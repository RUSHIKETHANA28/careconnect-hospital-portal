const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
  {
    admissionId: {
      type: String,
      required: true,
      unique: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      required: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },
    admittedBy: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Admitted", "Transferred", "Discharged"],
      default: "Admitted",
    },
    dischargeDate: {
      type: Date,
      default: null,
    },
    dischargeNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes for fast lookup and integrity
admissionSchema.index({ patient: 1, status: 1 });
admissionSchema.index({ bed: 1, status: 1 });

module.exports = mongoose.model("Admission", admissionSchema);
