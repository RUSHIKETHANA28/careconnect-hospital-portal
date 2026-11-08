
const express = require("express");
const router = express.Router();

const {
  createBed,
  getBeds,
  getBedById,
  updateBed,
  deleteBed,
} = require("../controllers/bedController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All bed routes require login
router.use(protect);

// Create bed
router.post(
  "/",
  authorize("Admin", "Hospital Administrator"),
  createBed
);

// Get all beds
router.get("/", getBeds);

// Get bed by ID
router.get("/:id", getBedById);

// Update bed (Admin/Hospital Administrator can update all fields; Nurse/Receptionist can update bed status)
router.put(
  "/:id",
  authorize("Admin", "Hospital Administrator", "Nurse", "Receptionist"),
  updateBed
);

// Delete bed
router.delete(
  "/:id",
  authorize("Admin", "Hospital Administrator"),
  deleteBed
);

module.exports = router;
