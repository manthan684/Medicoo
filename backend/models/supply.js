const mongoose = require("mongoose");

const supplySchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop is required"],
    },
    supplyDate: { type: Date, default: Date.now },
    items: [
      {
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
        quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
        price: { type: Number, required: true, min: 0 }, // price on that day, copied from the medicine
        batches: [
          {
            batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
            batchNumber: { type: String, required: true },
            expiryDate: { type: Date, required: true },
            quantity: { type: Number, required: true, min: 1 }, // taken from this batch
          },
        ],
      },
    ],
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supply", supplySchema);
