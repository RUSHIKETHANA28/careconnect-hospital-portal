
const express = require("express");
const router = express.Router();

const {
  transferPatient,
  getTransfers,
} = require("../controllers/transferController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All transfer routes require login
router.use(protect);

// Transfer a patient
router.post(
  "/",
  authorize("Admin", "Hospital Administrator", "Receptionist", "Nurse"),
  transferPatient
);

// Get all transfer records
router.get("/", getTransfers);

module.exports = router;
