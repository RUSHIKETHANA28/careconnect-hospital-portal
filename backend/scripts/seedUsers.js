const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const User = require("../models/User");

const seedAccounts = [
  {
    name: "System Admin",
    email: "admin@careconnect.com",
    password: "admin123",
    role: "Admin",
  },
  {
    name: "Dr. Sarah Jenkins",
    email: "admin.hosp@careconnect.com",
    password: "admin123",
    role: "Hospital Administrator",
  },
  {
    name: "Pooja Sharma",
    email: "receptionist@careconnect.com",
    password: "admin123",
    role: "Receptionist",
  },
  {
    name: "Sister Mary Varghese",
    email: "nurse@careconnect.com",
    password: "admin123",
    role: "Nurse",
  },
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for user seeding");

    for (const acc of seedAccounts) {
      const existing = await User.findOne({ email: acc.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(acc.password, 10);
        await User.create({
          name: acc.name,
          email: acc.email,
          password: hashedPassword,
          role: acc.role,
        });
        console.log(`Created user: ${acc.email} (${acc.role})`);
      } else {
        console.log(`User already exists: ${acc.email}`);
      }
    }

    console.log("User seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedUsers();
