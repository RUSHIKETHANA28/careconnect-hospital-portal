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
      trim: true,
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

// Compound index to guarantee uniqueness of bedNumber within a room
bedSchema.index({ room: 1, bedNumber: 1 }, { unique: true });
bedSchema.index({ ward: 1 });
bedSchema.index({ status: 1 });

module.exports = mongoose.model("Bed", bedSchema);
