const mongoose = require("mongoose");
const { titleCase } = require("../utils/titlecase");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
      set: titleCase,
    },
    type: {
      type: String,
      required: [true, "Medicine type is required"],
      enum: {
        values: ["tablet", "capsule", "syrup", "injection", "ointment", "drops", "other"],
        message: "{VALUE} is not a valid medicine type",
      },
    },
    strengthValue: {
      type: Number,
      min: [0, "Strength cannot be negative"],
    },
    strengthUnit: {
      type: String,
      enum: {
        values: ["mg", "g", "mcg", "ml", "IU", "%"],
        message: "{VALUE} is not a valid unit",
      },
      // the unit is required only when a strength value is given
      required: [
        function () {
          return this.strengthValue != null;
        },
        "Strength unit is required when strength value is given",
      ],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
  },
  { timestamps: true }
);

// the same name, type and strength cannot be added twice
medicineSchema.index(
  { name: 1, type: 1, strengthValue: 1, strengthUnit: 1 },
  { unique: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);