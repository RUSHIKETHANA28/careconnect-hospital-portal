
const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
  changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Register route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// Current user profile
router.get("/me", protect, getMe);

// Change password
router.put("/change-password", protect, changePassword);

module.exports = router;
