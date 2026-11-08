
const Transfer = require("../models/Transfer");
const Admission = require("../models/Admission");
const Bed = require("../models/Bed");

// Transfer patient to another bed
const transferPatient = async (req, res) => {
  try {
    const { admission, toBed, reason } = req.body;

    if (!admission || !toBed || !reason) {
      return res.status(400).json({
        success: false,
        message: "Admission, destination bed and reason are required",
      });
    }

    const admissionExists = await Admission.findById(admission);

    if (!admissionExists || admissionExists.status !== "Admitted") {
      return res.status(404).json({
        success: false,
        message: "Active admission not found",
      });
    }

    const fromBed = await Bed.findById(admissionExists.bed);
    const destinationBed = await Bed.findById(toBed);

    if (!fromBed || !destinationBed) {
      return res.status(404).json({
        success: false,
        message: "Source or destination bed not found",
      });
    }

    if (fromBed._id.toString() === destinationBed._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Patient is already assigned to this bed",
      });
    }

    if (destinationBed.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: "Destination bed is not available",
      });
    }

    // Update bed statuses: previous bed goes to Cleaning, destination bed becomes Occupied
    fromBed.status = "Cleaning";
    destinationBed.status = "Occupied";

    await fromBed.save();
    await destinationBed.save();

    // Update admission with new bed
    admissionExists.bed = destinationBed._id;
    admissionExists.status = "Transferred";
    await admissionExists.save();

    // Create transfer record
    const transfer = await Transfer.create({
      transferId: `TRF-${Date.now()}`,
      patient: admissionExists.patient,
      admission: admissionExists._id,
      fromBed: fromBed._id,
      toBed: destinationBed._id,
      reason,
    });

    // Keep admission active after transfer
    admissionExists.status = "Admitted";
    await admissionExists.save();

    res.status(201).json({
      success: true,
      message: "Patient transferred successfully",
      transfer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all transfer records
const getTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find()
      .populate("patient", "patientId name")
      .populate("fromBed", "bedNumber status")
      .populate("toBed", "bedNumber status")
      .populate("admission", "admissionId");

    res.status(200).json({
      success: true,
      count: transfers.length,
      transfers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  transferPatient,
  getTransfers,
};
