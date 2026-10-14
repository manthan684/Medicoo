const mongoose = require("mongoose");
const { titleCase } = require("../utils/titlecase");

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      set: titleCase,
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
      set: titleCase,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^91\d{10}$/, "Phone must start with 91 and have 10 more digits"],
    },
    address: {
      type: String,
      trim: true,
      set: titleCase,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shop", shopSchema);