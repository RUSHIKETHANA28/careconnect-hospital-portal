
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const wardRoutes = require("./routes/wardRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bedRoutes = require("./routes/bedRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const transferRoutes = require("./routes/transferRoutes");
const dischargeRoutes = require("./routes/dischargeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/wards", wardRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/discharges", dischargeRoutes);
app.use("/api/dashboard", dashboardRoutes);
// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to CareConnect Backend API",
    status: "Server is running successfully",
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CareConnect API is healthy",
  });
});

// Server configuration
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected successfully");
    } else {
      console.log("MongoDB URI not configured. Running without database.");
    }

    app.listen(PORT, () => {
      console.log(`CareConnect server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
};

startServer();
