const express = require("express");
const {
  createSupply,
  getSupplies,
  getSupplyById,
} = require("../controllers/supplycontroller");

const router = express.Router();

router.post("/", createSupply);
router.get("/", getSupplies);
router.get("/:id", getSupplyById);

module.exports = router;