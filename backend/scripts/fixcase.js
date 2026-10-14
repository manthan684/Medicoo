require("dotenv").config();
const mongoose = require("mongoose");
const Shop = require("../models/shop");
const Medicine = require("../models/medicine");
const { titleCase } = require("../utils/titlecase");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  let shops = 0;
  for (const s of await Shop.find()) {
    s.name = titleCase(s.name);
    s.ownerName = titleCase(s.ownerName);
    s.address = titleCase(s.address);
    try {
      await s.save();
      shops++;
    } catch (err) {
      console.log("Shop skipped:", s.name, "-", err.message);
    }
  }

  let medicines = 0;
  for (const m of await Medicine.find()) {
    m.name = titleCase(m.name);
    try {
      await m.save();
      medicines++;
    } catch (err) {
      console.log("Medicine skipped:", m.name, "-", err.message);
    }
  }

  console.log(`Done: ${shops} shops and ${medicines} medicines checked`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.log("Error:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});