
const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema(
  {
    transferId: {
      type: String,
      required: true,
      unique: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    admission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      required: true,
    },
    fromBed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      required: true,
    },
    toBed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      required: true,
    },
    transferDate: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transfer", transferSchema);
