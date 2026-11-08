
const express = require("express");
const router = express.Router();

const {
  createAdmission,
  getAdmissions,
  getAdmissionById,
} = require("../controllers/admissionController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All admission routes require login
router.use(protect);

// Create admission
router.post(
  "/",
  authorize("Admin", "Hospital Administrator", "Receptionist"),
  createAdmission
);

// Get all admissions
router.get("/", getAdmissions);

// Get admission by ID
router.get("/:id", getAdmissionById);

module.exports = router;
