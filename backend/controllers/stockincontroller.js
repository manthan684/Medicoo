const mongoose = require("mongoose");
const Medicine = require("../models/medicine");
const Batch = require("../models/batch");
const StockIn = require("../models/stockin");
const { dateRange } = require("../utils/daterange");
// small helper: "2027-03-31T00:00:00Z" becomes "2027-03-31"
const dayOf = (date) => new Date(date).toISOString().slice(0, 10);

// ---------- double-click protection ----------
// A stock-in that is exactly the same as one saved (or still being saved)
// in the last few seconds is treated as an accidental double click and refused.
// This works on the server, so it also protects you if the browser sends twice.
const RECENT_MS = 10 * 1000; // 10 seconds
const recent = new Map(); // fingerprint -> time it started saving

// one short text that describes a stock-in: the supplier and every row
const fingerprintOf = (supplierName, items) => {
  const rows = items
    .map((i) => `${i.medicine}|${i.batchNumber}|${i.quantity}|${dayOf(i.expiryDate)}`)
    .sort()
    .join(";");
  return `${String(supplierName || "").trim().toLowerCase()}#${rows}`;
};

// forget the ones that are older than 10 seconds
const forgetOld = () => {
  const now = Date.now();
  for (const [key, time] of recent) {
    if (now - time > RECENT_MS) recent.delete(key);
  }
};

exports.createStockIn = async (req, res) => {
  let fingerprint = null;

  try {
    const { supplierName, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Add at least one item" });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const cleanItems = [];
    const seenBatches = new Map(); // batches already seen in this same request

    // STEP 1: check every item BEFORE changing anything
    for (let i = 0; i < items.length; i++) {
      const row = `Item ${i + 1}`;
      const item = items[i];

      const batchNumber = String(item.batchNumber || "").trim().toUpperCase();
      const quantity = Number(item.quantity);
      const expiryDate = new Date(item.expiryDate);

      if (!mongoose.Types.ObjectId.isValid(item.medicine)) {
        return res.status(400).json({ message: `${row}: invalid medicine id` });
      }
      if (!batchNumber) {
        return res.status(400).json({ message: `${row}: batch number is required` });
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: `${row}: quantity must be a whole number, 1 or more` });
      }
      if (isNaN(expiryDate) || expiryDate <= today) {
        return res.status(400).json({ message: `${row}: expiry date must be a valid future date` });
      }

      const medicineExists = await Medicine.exists({ _id: item.medicine });
      if (!medicineExists) {
        return res.status(404).json({ message: `${row}: medicine not found` });
      }

      // same batch, different expiry date as the saved one: reject
      const existing = await Batch.findOne({ medicine: item.medicine, batchNumber });
      if (existing && dayOf(existing.expiryDate) !== dayOf(expiryDate)) {
        return res.status(400).json({
          message: `${row}: batch ${batchNumber} is already saved with expiry ${dayOf(existing.expiryDate)}, but you sent ${dayOf(expiryDate)}`,
        });
      }

      // the same batch twice in this stock-in must have the same expiry date
      const batchKey = `${item.medicine}-${batchNumber}`;
      const day = dayOf(expiryDate);
      if (seenBatches.has(batchKey) && seenBatches.get(batchKey) !== day) {
        return res.status(400).json({
          message: `${row}: batch ${batchNumber} appears twice with different expiry dates`,
        });
      }
      seenBatches.set(batchKey, day);

      cleanItems.push({ medicine: item.medicine, batchNumber, quantity, expiryDate });
    }

    // STEP 1b: refuse an accidental double click.
    // There is no "await" between the check and the save of the fingerprint,
    // so two clicks that arrive at the same moment cannot both get through.
    forgetOld();
    fingerprint = fingerprintOf(supplierName, cleanItems);
    if (recent.has(fingerprint)) {
      fingerprint = null; // this request did not claim it, so it must not release it
      return res.status(409).json({
        message: "This stock-in was just saved. Check the History list before saving again.",
      });
    }
    recent.set(fingerprint, Date.now());

    // STEP 2: everything is fine, now save
    const savedItems = [];
    for (const item of cleanItems) {
      const batch = await Batch.findOneAndUpdate(
        { medicine: item.medicine, batchNumber: item.batchNumber },
        {
          $inc: { quantity: item.quantity },             // add to the quantity
          $setOnInsert: { expiryDate: item.expiryDate }, // set the date only for a NEW batch
        },
        { upsert: true, new: true, runValidators: true }
      );
      savedItems.push({ ...item, batch: batch._id });
    }

    const stockIn = await StockIn.create({ supplierName, items: savedItems });
    res.status(201).json(stockIn);
  } catch (err) {
    // the save failed, so let the person try again straight away
    if (fingerprint) recent.delete(fingerprint);
    res.status(400).json({ message: err.message });
  }
};
exports.getStockIns = async (req, res) => {
  try {
    const { medicine, supplier, from, to } = req.query;
    const filter = {};

    if (medicine) {
      if (!mongoose.Types.ObjectId.isValid(medicine)) {
        return res.status(400).json({ message: "Invalid medicine id" });
      }
      filter["items.medicine"] = medicine;
    }

    if (supplier) {
      // part of the name, any capital letters; special characters made safe
      const safe = supplier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.supplierName = new RegExp(safe, "i");
    }

    if (from || to) {
      const { range, error } = dateRange(from, to);
      if (error) return res.status(400).json({ message: error });
      filter.receivedDate = range;
    }

    const list = await StockIn.find(filter)
      .sort({ receivedDate: -1 })
      .limit(200)
      .populate("items.medicine", "name type strengthValue strengthUnit");

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};