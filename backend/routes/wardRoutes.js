
const express = require("express");
const router = express.Router();

const {
  createWard,
  getWards,
  getWardById,
  updateWard,
  deleteWard,
} = require("../controllers/wardController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All ward routes require login
router.use(protect);

// Create ward
router.post(
  "/",
  authorize("Admin", "Hospital Administrator"),
  createWard
);

// Get all wards
router.get("/", getWards);

// Get ward by ID
router.get("/:id", getWardById);

// Update ward
router.put(
  "/:id",
  authorize("Admin", "Hospital Administrator"),
  updateWard
);

// Delete ward
router.delete(
  "/:id",
  authorize("Admin", "Hospital Administrator"),
  deleteWard
);

module.exports = router;
