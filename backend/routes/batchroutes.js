const express = require("express");
const {
  getBatches,
  getBatchesByMedicine,
  getStockSummary,
} = require("../controllers/batchcontroller");

const router = express.Router();

router.get("/", getBatches);
router.get("/summary", getStockSummary);
router.get("/medicine/:id", getBatchesByMedicine);

module.exports = router;