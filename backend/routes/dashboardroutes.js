const express = require("express");
const { getDashboard } = require("../controllers/dashboardcontroller");

const router = express.Router();

router.get("/", getDashboard);

module.exports = router;