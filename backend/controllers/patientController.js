
const Patient = require("../models/Patient");
const Admission = require("../models/Admission");
const Transfer = require("../models/Transfer");

// Add a new patient
const createPatient = async (req, res) => {
  try {
    const { name, age, gender, phone, address, bloodGroup } = req.body;

    if (!name || age === undefined || !gender || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, age, gender and phone",
      });
    }

    const patient = await Patient.create({
      patientId: `PAT-${Date.now()}`,
      name,
      age,
      gender,
      phone,
      address,
      bloodGroup,
    });

    res.status(201).json({
      success: true,
      message: "Patient added successfully",
      patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all patients
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get patient by ID with full history
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const admissions = await Admission.find({ patient: req.params.id })
      .populate({
        path: "bed",
        select: "bedId bedNumber room ward",
        populate: [
          { path: "room", select: "roomNumber" },
          { path: "ward", select: "wardName wardType" },
        ],
      })
      .sort({ createdAt: -1 });

    const transfers = await Transfer.find({ patient: req.params.id })
      .populate("fromBed", "bedNumber")
      .populate("toBed", "bedNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      patient,
      admissions,
      transfers,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }
};

// Update patient
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete patient safely
const deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Safety check: Prevent deletion if patient has an active admission
    const activeAdmission = await Admission.findOne({
      patient: patientId,
      status: "Admitted",
    });

    if (activeAdmission) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete patient: Patient currently has an active hospital admission. Please discharge the patient first.",
      });
    }

    const patient = await Patient.findByIdAndDelete(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Invalid patient ID",
    });
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};
