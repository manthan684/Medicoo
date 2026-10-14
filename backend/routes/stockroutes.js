const express = require("express");
const { createStockIn, getStockIns } = require("../controllers/stockincontroller");

const router = express.Router();

router.post("/", createStockIn);
router.get("/", getStockIns);

module.exports = router;