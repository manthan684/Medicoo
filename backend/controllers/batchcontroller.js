const mongoose = require("mongoose");
const Batch = require("../models/batch");

// 1. All batches that still have stock (oldest expiry first)
exports.getBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ quantity: { $gt: 0 } })
      .populate("medicine", "name type strengthValue strengthUnit")
      .sort({ expiryDate: 1 })
      .lean();

    const today = new Date();
    const result = batches.map((b) => ({ ...b, expired: b.expiryDate < today }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. All batches of ONE medicine (oldest expiry first)
exports.getBatchesByMedicine = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid medicine id" });
    }

    const batches = await Batch.find({
      medicine: req.params.id,
      quantity: { $gt: 0 },
    })
      .sort({ expiryDate: 1 })
      .lean();

    const today = new Date();
    const result = batches.map((b) => ({ ...b, expired: b.expiryDate < today }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Total usable stock for each medicine (expired batches are not counted)
exports.getStockSummary = async (req, res) => {
  try {
    const summary = await Batch.aggregate([
      { $match: { quantity: { $gt: 0 }, expiryDate: { $gt: new Date() } } },
      {
        $group: {
          _id: "$medicine",
          totalQuantity: { $sum: "$quantity" },
          batches: { $sum: 1 },
          nearestExpiry: { $min: "$expiryDate" },
        },
      },
      {
        $lookup: {
          from: "medicines",
          localField: "_id",
          foreignField: "_id",
          as: "medicine",
        },
      },
      { $unwind: "$medicine" },
      {
        $project: {
          _id: 0,
          medicineId: "$_id",
          name: "$medicine.name",
          type: "$medicine.type",
          strengthValue: "$medicine.strengthValue",
          strengthUnit: "$medicine.strengthUnit",
          totalQuantity: 1,
          batches: 1,
          nearestExpiry: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};