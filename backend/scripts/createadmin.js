require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

const [name, email, password] = process.argv.slice(2);

async function run() {
    if (!name || !email || !password) {
    console.log('Use: node scripts/createadmin.js "Name" email@example.com "password"');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    console.log("A user with this email already exists");
    await mongoose.disconnect();
    process.exit(1);
  }

  await User.create({ name, email, password, role: "admin" });
  console.log("Admin created:", email);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.log("Error:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
