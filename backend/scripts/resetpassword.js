require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

const [email, newPassword] = process.argv.slice(2);

async function run() {
  if (!email || !newPassword) {
    console.log('Use: node scripts/resetpassword.js email@example.com "NewPassword"');
    process.exit(1);
  }
  if (newPassword.length < 6) {
    console.log("The password needs at least 6 characters");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.log("No user with this email. Check the email in Compass.");
    await mongoose.disconnect();
    process.exit(1);
  }

  user.password = newPassword; // the model scrambles it before saving
  await user.save();
  console.log("Password changed for:", user.email);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.log("Error:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});