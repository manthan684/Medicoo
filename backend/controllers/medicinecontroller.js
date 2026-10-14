const Medicine = require("../models/medicine");
const Batch = require("../models/batch");

// Add a medicine
exports.createMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.create(req.body);
    res.status(201).json(medicine);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "This medicine already exists" });
    }
    res.status(400).json({ message: err.message });
  }
};

// Get all medicines (A to Z, capital and small letters mixed)
exports.getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find()
      .sort({ name: 1 })
      .collation({ locale: "en", strength: 2 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get one medicine
exports.getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    res.json(medicine);
  } catch (err) {
    res.status(400).json({ message: "Invalid medicine id" });
  }
};

// Update a medicine
exports.updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    res.json(medicine);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "This medicine already exists" });
    }
    res.status(400).json({ message: err.message });
  }
};

// Delete a medicine (not allowed when it has stock records)
exports.deleteMedicine = async (req, res) => {
  try {
    const inUse = await Batch.exists({ medicine: req.params.id });
    if (inUse) {
      return res.status(400).json({
        message: "This medicine has stock records, so it cannot be deleted",
      });
    }

    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    res.json({ message: "Medicine deleted" });
  } catch (err) {
    res.status(400).json({ message: "Invalid medicine id" });
  }
};