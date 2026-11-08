
const express = require("express");
const router = express.Router();

const {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} = require("../controllers/roomController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All room routes require login
router.use(protect);

// Create room
router.post(
  "/",
  authorize("Admin", "Hospital Administrator"),
  createRoom
);

// Get all rooms
router.get("/", getRooms);

// Get room by ID
router.get("/:id", getRoomById);

// Update room
router.put(
  "/:id",
  authorize("Admin", "Hospital Administrator"),
  updateRoom
);

// Delete room
router.delete(
  "/:id",
  authorize("Admin", "Hospital Administrator"),
  deleteRoom
);

module.exports = router;
