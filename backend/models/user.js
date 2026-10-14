const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // hidden when we read users
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "staff"],
        message: "{VALUE} is not a valid role",
      },
      default: "staff",
    },
  },
  { timestamps: true }
);

// runs just before a user is saved
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // password not changed, do nothing
  this.password = await bcrypt.hash(this.password, 10); // scramble it
});

// used by the login: is the typed password right?
userSchema.methods.matchPassword = function (typedPassword) {
  return bcrypt.compare(typedPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);