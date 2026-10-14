const jwt = require("jsonwebtoken");
const User = require("../models/user");

// the gate: only a valid token gets through
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Please log in first" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "This user no longer exists" });
    }

    req.user = user; // the next function can see who is logged in
    next();          // let the request through
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Your login is not valid or has expired. Please log in again" });
  }
};

// a second gate: only admins
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  res.status(403).json({ message: "Only an admin can do this" });
};