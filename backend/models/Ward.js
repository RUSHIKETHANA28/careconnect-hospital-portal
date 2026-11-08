
const mongoose = require("mongoose");

const wardSchema = new mongoose.Schema(
  {
    wardId: {
      type: String,
      required: true,
      unique: true,
    },
    wardName: {
      type: String,
      required: true,
      trim: true,
    },
    wardType: {
      type: String,
      required: true,
      enum: ["General", "ICU", "Emergency", "Private", "Maternity"],
    },
    floor: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ward", wardSchema);
