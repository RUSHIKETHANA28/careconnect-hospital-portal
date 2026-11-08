
const Admission = require("../models/Admission");
const Bed = require("../models/Bed");

// Discharge a patient
const dischargePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const admission = await Admission.findById(id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: "Admission not found",
      });
    }

    if (admission.status !== "Admitted") {
      return res.status(400).json({
        success: false,
        message: "Patient is not currently admitted",
      });
    }

    const bed = await Bed.findById(admission.bed);

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: "Assigned bed not found",
      });
    }

    // Update admission status
    admission.status = "Discharged";
    admission.dischargeDate = new Date();
    if (req.body && req.body.dischargeNotes) {
      admission.dischargeNotes = req.body.dischargeNotes;
    }
    await admission.save();

    // Mark bed for cleaning
    bed.status = "Cleaning";
    await bed.save();

    res.status(200).json({
      success: true,
      message: "Patient discharged successfully. Bed is now under cleaning.",
      admission,
      bed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  dischargePatient,
};
