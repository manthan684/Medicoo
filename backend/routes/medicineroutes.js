const express = require("express");
const {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
} = require("../controllers/medicinecontroller");

const router = express.Router();

router.post("/", createMedicine);
router.get("/", getMedicines);
router.get("/:id", getMedicineById);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);

module.exports = router;