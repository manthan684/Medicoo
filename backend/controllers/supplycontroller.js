const mongoose = require("mongoose");
const Shop = require("../models/shop");
const Medicine = require("../models/medicine");
const Batch = require("../models/batch");
const Supply = require("../models/supply");
const { dateRange } = require("../utils/daterange");
exports.createSupply = async (req, res) => {
  const applied = []; // every batch we reduce is remembered here, so we can undo if something fails

  try {
    const { shop, items } = req.body;

    if (!mongoose.Types.ObjectId.isValid(shop)) {
      return res.status(400).json({ message: "Invalid shop id" });
    }
    if (!(await Shop.exists({ _id: shop }))) {
      return res.status(404).json({ message: "Shop not found" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Add at least one item" });
    }

    const now = new Date();
    const plannedItems = [];
    const seen = new Set();

    // STEP 1: plan everything. Nothing is changed yet.
    for (let i = 0; i < items.length; i++) {
      const row = `Item ${i + 1}`;
      const medicineId = items[i].medicine;
      const quantity = Number(items[i].quantity);

      if (!mongoose.Types.ObjectId.isValid(medicineId)) {
        return res.status(400).json({ message: `${row}: invalid medicine id` });
      }
      if (seen.has(String(medicineId))) {
        return res.status(400).json({ message: `${row}: this medicine is added twice, increase its quantity instead` });
      }
      seen.add(String(medicineId));

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: `${row}: quantity must be a whole number, 1 or more` });
      }

      const medicine = await Medicine.findById(medicineId);
      if (!medicine) {
        return res.status(404).json({ message: `${row}: medicine not found` });
      }

      // only batches that have stock AND are not expired, oldest expiry first (FEFO)
      const batches = await Batch.find({
        medicine: medicineId,
        quantity: { $gt: 0 },
        expiryDate: { $gt: now },
      }).sort({ expiryDate: 1 });

      const available = batches.reduce((sum, b) => sum + b.quantity, 0);
      if (available < quantity) {
        return res.status(400).json({
          message: `${row}: not enough stock for ${medicine.name}. Needed ${quantity}, usable stock ${available} (expired batches are not counted)`,
        });
      }

      // the FEFO loop: take from the oldest batch first
      let need = quantity;
      const used = [];
      for (const b of batches) {
        if (need === 0) break;
        const take = Math.min(need, b.quantity);
        used.push({
          batch: b._id,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          quantity: take,
        });
        need -= take;
      }

      plannedItems.push({ medicine: medicine._id, quantity, price: medicine.price, batches: used });
    }

    // STEP 2: reduce the stock
    for (const item of plannedItems) {
      for (const u of item.batches) {
        const result = await Batch.updateOne(
          { _id: u.batch, quantity: { $gte: u.quantity } }, // still enough stock right now?
          { $inc: { quantity: -u.quantity } }
        );
        if (result.modifiedCount === 0) {
          throw new Error("Stock changed while saving. Please try again.");
        }
        applied.push(u);
      }
    }

    // STEP 3: save the supply record
    const totalAmount = plannedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const supply = await Supply.create({ shop, items: plannedItems, totalAmount });

    res.status(201).json(supply);
  } catch (err) {
    // something failed after we changed stock: put everything back
    for (const u of applied) {
      await Batch.updateOne({ _id: u.batch }, { $inc: { quantity: u.quantity } });
    }
    res.status(400).json({ message: err.message });
  }
};
exports.getSupplies = async (req, res) => {
  try {
    const { shop, medicine, from, to } = req.query;
    const filter = {};

    if (shop) {
      if (!mongoose.Types.ObjectId.isValid(shop)) {
        return res.status(400).json({ message: "Invalid shop id" });
      }
      filter.shop = shop;
    }

    if (medicine) {
      if (!mongoose.Types.ObjectId.isValid(medicine)) {
        return res.status(400).json({ message: "Invalid medicine id" });
      }
      filter["items.medicine"] = medicine; // look inside the items list
    }

    if (from || to) {
      const { range, error } = dateRange(from, to);
      if (error) return res.status(400).json({ message: error });
      filter.supplyDate = range;
    }

    const supplies = await Supply.find(filter)
      .sort({ supplyDate: -1 })
      .limit(200)
      .populate("shop", "name ownerName")
      .populate("items.medicine", "name type strengthValue strengthUnit");

    res.json(supplies);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.getSupplyById = async (req, res) => {
  try {
    const supply = await Supply.findById(req.params.id)
      .populate("shop", "name ownerName phone address")
      .populate("items.medicine", "name type strengthValue strengthUnit");

    if (!supply) return res.status(404).json({ message: "Supply not found" });
    res.json(supply);
  } catch (err) {
    res.status(400).json({ message: "Invalid supply id" });
  }
};