const Batch = require("../models/batch");
const Medicine = require("../models/medicine");

const DAY = 86400000; // one day in milliseconds
const MEDICINE_FIELDS = "name type strengthValue strengthUnit";

// read a number from the URL, keep it between min and max
const toInt = (value, fallback, min, max) => {
  const n = parseInt(value, 10);
  if (isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

// batches with stock that expire within the next "days" days
const findExpiring = async (days) => {
  const now = new Date();
  const until = new Date(now.getTime() + days * DAY);

  const batches = await Batch.find({
    quantity: { $gt: 0 },
    expiryDate: { $gt: now, $lte: until },
  })
    .sort({ expiryDate: 1 })
    .populate("medicine", MEDICINE_FIELDS)
    .lean();

  return batches.map((b) => ({
    ...b,
    daysLeft: Math.ceil((b.expiryDate - now) / DAY),
  }));
};

// batches that are already expired but still have stock
const findExpired = async () => {
  const now = new Date();

  const batches = await Batch.find({
    quantity: { $gt: 0 },
    expiryDate: { $lte: now },
  })
    .sort({ expiryDate: 1 })
    .populate("medicine", MEDICINE_FIELDS)
    .lean();

  return batches.map((b) => ({
    ...b,
    daysAgo: Math.floor((now - b.expiryDate) / DAY),
  }));
};

// medicines whose usable stock (not expired) is below the limit

// medicines whose usable stock (not expired) is below the limit.
// medicines that never had any batch are ignored.
const findLowStock = async (limit) => {
  const now = new Date();

  return Medicine.aggregate([
    {
      $lookup: {
        from: "batches",
        localField: "_id",
        foreignField: "medicine",
        as: "allBatches",
      },
    },
    // never stocked = not an alert
    { $match: { "allBatches.0": { $exists: true } } },
    {
      $addFields: {
        totalQuantity: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: "$allBatches",
                  as: "b",
                  cond: {
                    $and: [
                      { $gt: ["$$b.quantity", 0] },
                      { $gt: ["$$b.expiryDate", now] },
                    ],
                  },
                },
              },
              as: "usable",
              in: "$$usable.quantity",
            },
          },
        },
      },
    },
    { $match: { totalQuantity: { $lt: limit } } },
    {
      $project: {
        name: 1,
        type: 1,
        strengthValue: 1,
        strengthUnit: 1,
        totalQuantity: 1,
      },
    },
    { $sort: { totalQuantity: 1, name: 1 } },
  ]);
};
exports.getExpiring = async (req, res) => {
  try {
    const days = toInt(req.query.days, 60, 1, 365);
    res.json(await findExpiring(days));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExpired = async (req, res) => {
  try {
    res.json(await findExpired());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const limit = toInt(req.query.limit, 100, 1, 1000000);
    res.json(await findLowStock(limit));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// only the numbers
exports.getSummary = async (req, res) => {
  try {
    const days = toInt(req.query.days, 60, 1, 365);
    const limit = toInt(req.query.limit, 100, 1, 1000000);

    const [expiring, expired, low] = await Promise.all([
      findExpiring(days),
      findExpired(),
      findLowStock(limit),
    ]);

    res.json({
      days,
      limit,
      expiringSoon: expiring.length,
      expired: expired.length,
      lowStock: low.filter((m) => m.totalQuantity > 0).length,
      outOfStock: low.filter((m) => m.totalQuantity === 0).length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};