const Batch = require("../models/batch");
const Supply = require("../models/supply");
const StockIn = require("../models/stockin");

// all day and month boundaries use Indian time (UTC+5:30), on any server
const TZ = "Asia/Kolkata";
const IST = 330 * 60 * 1000; // 5 hours 30 minutes in milliseconds
const DAY = 86400000;
const round = (n) => Math.round((n || 0) * 100) / 100;

// the moment the given day started in India
const startOfDay = (date) =>
  new Date(Math.floor((date.getTime() + IST) / DAY) * DAY - IST);

// the moment the given month started in India
const startOfMonth = (date) => {
  const ist = new Date(date.getTime() + IST);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST);
};

// "2026-10-14" for a moment, as the date in India
const dayKey = (date) => new Date(date.getTime() + IST).toISOString().slice(0, 10);

// supplies, units and money since a date
const periodTotals = async (from) => {
  const [row] = await Supply.aggregate([
    { $match: { supplyDate: { $gte: from } } },
    {
      $group: {
        _id: null,
        supplies: { $sum: 1 },
        units: { $sum: { $sum: "$items.quantity" } },
        amount: { $sum: "$totalAmount" },
      },
    },
  ]);
  return {
    supplies: row ? row.supplies : 0,
    units: row ? row.units : 0,
    amount: round(row ? row.amount : 0),
  };
};

// stock that can really be given out: not finished, not expired
const usableStock = async (now) => {
  const [row] = await Batch.aggregate([
    { $match: { quantity: { $gt: 0 }, expiryDate: { $gt: now } } },
    {
      $group: {
        _id: null,
        units: { $sum: "$quantity" },
        batches: { $sum: 1 },
        medicines: { $addToSet: "$medicine" },
      },
    },
    { $project: { _id: 0, units: 1, batches: 1, medicines: { $size: "$medicines" } } },
  ]);
  return row || { units: 0, batches: 0, medicines: 0 };
};

// the 5 shops that took the most money this month
const topShops = (from) =>
  Supply.aggregate([
    { $match: { supplyDate: { $gte: from } } },
    {
      $group: {
        _id: "$shop",
        supplies: { $sum: 1 },
        units: { $sum: { $sum: "$items.quantity" } },
        amount: { $sum: "$totalAmount" },
      },
    },
    { $sort: { amount: -1 } },
    { $limit: 5 },
    { $lookup: { from: "shops", localField: "_id", foreignField: "_id", as: "shop" } },
    { $unwind: { path: "$shop", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        shopId: "$_id",
        name: { $ifNull: ["$shop.name", "Deleted shop"] },
        supplies: 1,
        units: 1,
        amount: 1,
      },
    },
  ]);

// the 5 medicines that went out the most this month
const topMedicines = (from) =>
  Supply.aggregate([
    { $match: { supplyDate: { $gte: from } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.medicine",
        units: { $sum: "$items.quantity" },
        amount: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { units: -1 } },
    { $limit: 5 },
    { $lookup: { from: "medicines", localField: "_id", foreignField: "_id", as: "medicine" } },
    { $unwind: { path: "$medicine", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        medicineId: "$_id",
        name: { $ifNull: ["$medicine.name", "Deleted medicine"] },
        strengthValue: "$medicine.strengthValue",
        strengthUnit: "$medicine.strengthUnit",
        units: 1,
        amount: 1,
      },
    },
  ]);

// one row for each of the last 30 days, with zeros on quiet days
const perDay = async (start) => {
  const rows = await Supply.aggregate([
    { $match: { supplyDate: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$supplyDate", timezone: TZ } },
        supplies: { $sum: 1 },
        units: { $sum: { $sum: "$items.quantity" } },
        amount: { $sum: "$totalAmount" },
      },
    },
  ]);
  const byDay = Object.fromEntries(rows.map((r) => [r._id, r]));

  const days = [];
  for (let i = 0; i < 30; i++) {
    const key = dayKey(new Date(start.getTime() + i * DAY));
    const r = byDay[key];
    days.push({
      date: key,
      supplies: r ? r.supplies : 0,
      units: r ? r.units : 0,
      amount: round(r ? r.amount : 0),
    });
  }
  return days;
};

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);
    const start30 = new Date(todayStart.getTime() - 29 * DAY);

    const [stock, today, month, shops, medicines, days, supplies, stockIns] =
      await Promise.all([
        usableStock(now),
        periodTotals(todayStart),
        periodTotals(monthStart),
        topShops(monthStart),
        topMedicines(monthStart),
        perDay(start30),
        Supply.find().sort({ supplyDate: -1 }).limit(5).populate("shop", "name").lean(),
        StockIn.find().sort({ receivedDate: -1 }).limit(5).lean(),
      ]);

    res.json({
      stock,
      today,
      month,
      topShops: shops.map((s) => ({ ...s, amount: round(s.amount) })),
      topMedicines: medicines.map((m) => ({ ...m, amount: round(m.amount) })),
      recentSupplies: supplies.map((s) => ({
        _id: s._id,
        shop: s.shop ? s.shop.name : "Deleted shop",
        date: s.supplyDate,
        medicines: s.items.length,
        units: s.items.reduce((sum, it) => sum + it.quantity, 0),
        amount: round(s.totalAmount),
      })),
      recentStockIns: stockIns.map((s) => ({
        _id: s._id,
        supplier: s.supplierName || "No supplier",
        date: s.receivedDate,
        medicines: s.items.length,
        units: s.items.reduce((sum, it) => sum + it.quantity, 0),
      })),
      perDay: days,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};