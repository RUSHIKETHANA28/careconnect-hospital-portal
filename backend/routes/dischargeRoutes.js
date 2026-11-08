
const express = require("express");
const router = express.Router();

const {
  dischargePatient,
} = require("../controllers/dischargeController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All discharge routes require login
router.use(protect);

// Discharge a patient using the admission ID
router.put(
  "/:id",
  authorize("Admin", "Hospital Administrator", "Receptionist", "Nurse"),
  dischargePatient
);

module.exports = router;
