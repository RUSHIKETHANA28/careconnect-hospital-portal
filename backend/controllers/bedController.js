
const Bed = require("../models/Bed");
const Room = require("../models/Room");
const Ward = require("../models/Ward");
const Admission = require("../models/Admission");

// Create a new bed
const createBed = async (req, res) => {
  try {
    const { bedNumber, room, ward, bedType } = req.body;

    if (!bedNumber || !room || !ward) {
      return res.status(400).json({
        success: false,
        message: "Bed number, room and ward are required",
      });
    }

    const roomExists = await Room.findById(room);
    if (!roomExists) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const wardExists = await Ward.findById(ward);
    if (!wardExists) {
      return res.status(404).json({
        success: false,
        message: "Ward not found",
      });
    }

    const existingBed = await Bed.findOne({
      bedNumber,
      room,
    });

    if (existingBed) {
      return res.status(400).json({
        success: false,
        message: "This bed already exists in the room",
      });
    }

    // Validate room capacity
    const bedsInRoom = await Bed.countDocuments({ room });
    if (bedsInRoom >= roomExists.capacity) {
      return res.status(400).json({
        success: false,
        message: `Room ${roomExists.roomNumber} has reached its maximum capacity of ${roomExists.capacity} bed(s)`,
      });
    }

    const bed = await Bed.create({
      bedId: `BED-${Date.now()}`,
      bedNumber,
      room,
      ward,
      bedType: bedType || "General",
    });

    res.status(201).json({
      success: true,
      message: "Bed created successfully",
      bed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all beds
const getBeds = async (req, res) => {
  try {
    const beds = await Bed.find()
      .populate("room", "roomNumber")
      .populate("ward", "wardName wardType")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: beds.length,
      beds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get bed by ID
const getBedById = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id)
      .populate("room", "roomNumber")
      .populate("ward", "wardName wardType");

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: "Bed not found",
      });
    }

    res.status(200).json({
      success: true,
      bed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update bed
const updateBed = async (req, res) => {
  try {
    const bedId = req.params.id;
    const currentBed = await Bed.findById(bedId);

    if (!currentBed) {
      return res.status(404).json({
        success: false,
        message: "Bed not found",
      });
    }

    // Role check: Nurse and Receptionist can only update status
    if (["Nurse", "Receptionist"].includes(req.user.role)) {
      if (req.body.status) {
        // Guard: Prevent overriding Occupied to Available directly if patient is admitted
        if (currentBed.status === "Occupied" && req.body.status === "Available") {
          const activeAdm = await Admission.findOne({ bed: bedId, status: "Admitted" });
          if (activeAdm) {
            return res.status(400).json({
              success: false,
              message: "Cannot mark bed as Available while an active admission exists. Discharge or transfer the patient first.",
            });
          }
        }
        currentBed.status = req.body.status;
        await currentBed.save();
        return res.status(200).json({
          success: true,
          message: `Bed status updated to ${req.body.status}`,
          bed: currentBed,
        });
      } else {
        return res.status(403).json({
          success: false,
          message: "You are only authorized to update bed status",
        });
      }
    }

    // For Admin / Hospital Administrator:
    if (req.body.status === "Available" && currentBed.status === "Occupied") {
      const activeAdm = await Admission.findOne({ bed: bedId, status: "Admitted" });
      if (activeAdm) {
        return res.status(400).json({
          success: false,
          message: "Cannot mark bed as Available while an active admission exists. Discharge or transfer the patient first.",
        });
      }
    }

    const bed = await Bed.findByIdAndUpdate(
      bedId,
      req.body,
      { new: true, runValidators: true }
    ).populate("room", "roomNumber").populate("ward", "wardName wardType");

    res.status(200).json({
      success: true,
      message: "Bed updated successfully",
      bed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete bed safely
const deleteBed = async (req, res) => {
  try {
    const bedId = req.params.id;

    // Safety check: Restrict deletion if an active admission exists
    const activeAdmission = await Admission.findOne({
      bed: bedId,
      status: "Admitted",
    });

    if (activeAdmission) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete bed: A patient is currently admitted to this bed. Discharge or transfer the patient first.",
      });
    }

    const bed = await Bed.findByIdAndDelete(bedId);

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: "Bed not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bed deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createBed,
  getBeds,
  getBedById,
  updateBed,
  deleteBed,
};
