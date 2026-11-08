const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

// All dashboard stats require login
router.get("/stats", protect, getDashboardStats);

module.exports = router;
