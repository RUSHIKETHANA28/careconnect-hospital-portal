
const Room = require("../models/Room");
const Ward = require("../models/Ward");
const Bed = require("../models/Bed");

// Create a new room
const createRoom = async (req, res) => {
  try {
    const { roomNumber, ward, floor, capacity } = req.body;

    if (!roomNumber || !ward || floor === undefined || !capacity) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required room details",
      });
    }

    const existingRoom = await Room.findOne({ roomNumber, ward });

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: "This room already exists in the selected ward",
      });
    }

    const wardExists = await Ward.findById(ward);

    if (!wardExists) {
      return res.status(404).json({
        success: false,
        message: "Selected ward not found",
      });
    }

    const room = await Room.create({
      roomId: `ROOM-${Date.now()}`,
      roomNumber,
      ward,
      floor,
      capacity,
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all rooms
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate("ward", "wardName wardType");

    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get room by ID
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate("ward", "wardName wardType");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }
};

// Update room
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("ward", "wardName wardType");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      room,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete room safely
const deleteRoom = async (req, res) => {
  try {
    const roomId = req.params.id;

    // Safety check: Prevent deletion if beds exist in this room
    const bedCount = await Bed.countDocuments({ room: roomId });
    if (bedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete room: ${bedCount} bed(s) are assigned to this room. Delete or reassign the beds first.`,
      });
    }

    const room = await Room.findByIdAndDelete(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Invalid room ID",
    });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
};
