const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine", // points to a record in the Medicine collection
      required: [true, "Medicine is required"],
    },
    batchNumber: {
      type: String,
      required: [true, "Batch number is required"],
      trim: true,
      uppercase: true, // "b-102" and "B-102" become the same
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
  },
  { timestamps: true }
);

// the same batch number cannot be saved twice for the same medicine
batchSchema.index({ medicine: 1, batchNumber: 1 }, { unique: true });

module.exports = mongoose.model("Batch", batchSchema);