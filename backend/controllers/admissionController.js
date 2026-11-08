const Admission = require("../models/Admission");
const Patient = require("../models/Patient");
const Bed = require("../models/Bed");

// Reusable population for admission records
const populateAdmission = (query) => {
  return query
    .populate("patient", "patientId name age gender phone")
    .populate({
      path: "bed",
      select: "bedId bedNumber status room ward",
      populate: [
        {
          path: "room",
          select: "roomNumber roomId floor",
        },
        {
          path: "ward",
          select: "wardName wardId wardType",
        },
      ],
    });
};

// Create a new admission
const createAdmission = async (req, res) => {
  let acquiredBed = null;
  try {
    const { patient, bed, diagnosis, admittedBy, admissionDate } = req.body;

    if (!patient || !bed || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: "Patient, bed and diagnosis are required",
      });
    }

    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check if patient already has an active admission
    const existingAdmission = await Admission.findOne({
      patient,
      status: "Admitted",
    });

    if (existingAdmission) {
      return res.status(400).json({
        success: false,
        message: "Patient already has an active admission",
      });
    }

    // Atomic bed status transition from Available -> Occupied
    acquiredBed = await Bed.findOneAndUpdate(
      { _id: bed, status: "Available" },
      { status: "Occupied" },
      { new: true }
    );

    if (!acquiredBed) {
      return res.status(400).json({
        success: false,
        message: "This bed is not available for admission (may be Occupied, Cleaning, or in Maintenance)",
      });
    }

    const admission = await Admission.create({
      admissionId: `ADM-${Date.now()}`,
      patient,
      bed,
      diagnosis: diagnosis.trim(),
      admittedBy: admittedBy ? admittedBy.trim() : "Staff",
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
    });

    const populatedAdmission = await populateAdmission(
      Admission.findById(admission._id)
    );

    res.status(201).json({
      success: true,
      message: "Patient admitted successfully",
      admission: populatedAdmission,
    });
  } catch (error) {
    // Rollback bed status if admission creation failed
    if (acquiredBed) {
      await Bed.findByIdAndUpdate(acquiredBed._id, { status: "Available" });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all admissions
const getAdmissions = async (req, res) => {
  try {
    const admissions = await populateAdmission(
      Admission.find()
    ).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admissions.length,
      admissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get admission by ID
const getAdmissionById = async (req, res) => {
  try {
    const admission = await populateAdmission(
      Admission.findById(req.params.id)
    );

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: "Admission not found",
      });
    }

    res.status(200).json({
      success: true,
      admission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAdmission,
  getAdmissions,
  getAdmissionById,
};
