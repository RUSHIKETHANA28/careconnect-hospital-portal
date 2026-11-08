
const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema(
  {
    bedId: {
      type: String,
      required: true,
      unique: true,
    },
    bedNumber: {
      type: String,
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "Occupied", "Cleaning", "Maintenance"],
      default: "Available",
    },
    bedType: {
      type: String,
      enum: ["General", "ICU", "Emergency", "Private"],
      default: "General",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bed", bedSchema);
