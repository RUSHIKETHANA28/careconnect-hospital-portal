
const Ward = require("../models/Ward");
const Room = require("../models/Room");
const Bed = require("../models/Bed");

// Create a new ward
const createWard = async (req, res) => {
  try {
    const { wardName, wardType, floor, capacity, description } = req.body;

    if (!wardName || !wardType || floor === undefined || !capacity) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required ward details",
      });
    }

    const ward = await Ward.create({
      wardId: `WARD-${Date.now()}`,
      wardName,
      wardType,
      floor,
      capacity,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Ward created successfully",
      ward,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all wards
const getWards = async (req, res) => {
  try {
    const wards = await Ward.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: wards.length,
      wards,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get ward by ID
const getWardById = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);

    if (!ward) {
      return res.status(404).json({
        success: false,
        message: "Ward not found",
      });
    }

    res.status(200).json({
      success: true,
      ward,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid ward ID",
    });
  }
};

// Update ward
const updateWard = async (req, res) => {
  try {
    const ward = await Ward.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!ward) {
      return res.status(404).json({
        success: false,
        message: "Ward not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ward updated successfully",
      ward,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete ward safely
const deleteWard = async (req, res) => {
  try {
    const wardId = req.params.id;

    // Safety check: Prevent deletion if rooms exist in this ward
    const roomCount = await Room.countDocuments({ ward: wardId });
    if (roomCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ward: ${roomCount} room(s) are assigned to this ward. Delete or reassign the rooms first.`,
      });
    }

    // Safety check: Prevent deletion if beds exist in this ward
    const bedCount = await Bed.countDocuments({ ward: wardId });
    if (bedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ward: ${bedCount} bed(s) are associated with this ward. Remove the beds first.`,
      });
    }

    const ward = await Ward.findByIdAndDelete(wardId);

    if (!ward) {
      return res.status(404).json({
        success: false,
        message: "Ward not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ward deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Invalid ward ID",
    });
  }
};

module.exports = {
  createWard,
  getWards,
  getWardById,
  updateWard,
  deleteWard,
};
