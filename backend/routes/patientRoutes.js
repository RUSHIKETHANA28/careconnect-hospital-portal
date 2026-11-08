
const express = require("express");
const router = express.Router();

const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} = require("../controllers/patientController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All patient routes require login
router.use(protect);

// Add patient
router.post(
  "/",
  authorize("Admin", "Hospital Administrator", "Receptionist"),
  createPatient
);

// Get all patients
router.get("/", getPatients);

// Get patient by ID
router.get("/:id", getPatientById);

// Update patient
router.put(
  "/:id",
  authorize("Admin", "Hospital Administrator", "Receptionist"),
  updatePatient
);

// Delete patient
router.delete(
  "/:id",
  authorize("Admin", "Hospital Administrator"),
  deletePatient
);

module.exports = router;
