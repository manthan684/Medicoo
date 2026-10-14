const express = require("express");
const {
  getExpiring,
  getExpired,
  getLowStock,
  getSummary,
} = require("../controllers/alertcontroller");

const router = express.Router();

router.get("/expiring", getExpiring);
router.get("/expired", getExpired);
router.get("/low-stock", getLowStock);
router.get("/summary", getSummary);

module.exports = router;