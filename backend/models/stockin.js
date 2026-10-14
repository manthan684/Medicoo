const mongoose = require("mongoose");

const stockInSchema = new mongoose.Schema(
  {
    supplierName: { type: String, trim: true }, // the company it came from
    receivedDate: { type: Date, default: Date.now },
    items: [
      {
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
        batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
        batchNumber: { type: String, required: true },
        expiryDate: { type: Date, required: true },
        quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockIn", stockInSchema);