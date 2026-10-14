const express = require("express");
const { login, me } = require("../controllers/authcontroller");
const { protect } = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/login", login);
router.get("/me", protect, me); // protected: needs a token

module.exports = router;