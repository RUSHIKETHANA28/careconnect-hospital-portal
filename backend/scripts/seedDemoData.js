/**
 * CareConnect University Demonstration Data Seeder
 * Student Roll Number: 2303A51919
 * Course: DevOps & Full Stack Development
 * Academic Year: 2026-2027
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Ward = require("../models/Ward");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
const Patient = require("../models/Patient");
const Admission = require("../models/Admission");
const Transfer = require("../models/Transfer");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/careconnect";

async function seed() {
  console.log("=================================================");
  console.log("CARECONNECT DEMONSTRATION DATA SEEDER");
  console.log("Student Roll Number: 2303A51919");
  console.log("Connecting to:", MONGO_URI);
  console.log("=================================================");

  await mongoose.connect(MONGO_URI);

  // 1. SEED USERS (All 4 RBAC Roles)
  const defaultPassword = "admin123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const demoUsers = [
    { name: "System Admin", email: "admin@careconnect.com", role: "Admin" },
    { name: "Dr. Sarah Jenkins", email: "admin.hosp@careconnect.com", role: "Hospital Administrator" },
    { name: "Pooja Sharma", email: "receptionist@careconnect.com", role: "Receptionist" },
    { name: "Sister Mary Varghese", email: "nurse@careconnect.com", role: "Nurse" },
  ];

  for (const u of demoUsers) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      await User.create({ ...u, password: hashedPassword });
      console.log(`✓ Created user: ${u.email} (${u.role})`);
    } else {
      console.log(`✓ User exists: ${u.email} (${u.role})`);
    }
  }

  // 2. SEED WARDS (3 Hospital Wards)
  const demoWards = [
    { wardName: "General Medical Ward", wardType: "General", floor: 1, capacity: 20, description: "Internal medicine & general inpatient ward" },
    { wardName: "Critical Care & ICU", wardType: "ICU", floor: 2, capacity: 10, description: "Intensive care and cardiac telemetry units" },
    { wardName: "Emergency & Trauma Ward", wardType: "Emergency", floor: 1, capacity: 15, description: "Acute emergency assessment and triage bay" },
  ];

  const wardMap = {};
  for (const w of demoWards) {
    let ward = await Ward.findOne({ wardName: w.wardName });
    if (!ward) {
      ward = await Ward.create({
        wardId: `WARD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...w,
      });
      console.log(`✓ Created Ward: ${w.wardName}`);
    } else {
      console.log(`✓ Ward exists: ${w.wardName}`);
    }
    wardMap[w.wardName] = ward;
  }

  // 3. SEED ROOMS (5 Hospital Rooms)
  const demoRooms = [
    { roomNumber: "101", ward: wardMap["General Medical Ward"]._id, floor: 1, capacity: 4 },
    { roomNumber: "102", ward: wardMap["General Medical Ward"]._id, floor: 1, capacity: 4 },
    { roomNumber: "ICU-Pod-A", ward: wardMap["Critical Care & ICU"]._id, floor: 2, capacity: 2 },
    { roomNumber: "ICU-Pod-B", ward: wardMap["Critical Care & ICU"]._id, floor: 2, capacity: 2 },
    { roomNumber: "ER-Bay-1", ward: wardMap["Emergency & Trauma Ward"]._id, floor: 1, capacity: 2 },
  ];

  const roomMap = {};
  for (const r of demoRooms) {
    let room = await Room.findOne({ roomNumber: r.roomNumber, ward: r.ward });
    if (!room) {
      room = await Room.create({
        roomId: `ROOM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...r,
      });
      console.log(`✓ Created Room: ${r.roomNumber}`);
    } else {
      console.log(`✓ Room exists: ${r.roomNumber}`);
    }
    roomMap[r.roomNumber] = room;
  }

  // 4. SEED BEDS (14 Hospital Beds across 5 Rooms)
  const demoBeds = [
    // Room 101
    { bedNumber: "G-101A", room: roomMap["101"]._id, ward: wardMap["General Medical Ward"]._id, bedType: "General", status: "Available" },
    { bedNumber: "G-101B", room: roomMap["101"]._id, ward: wardMap["General Medical Ward"]._id, bedType: "General", status: "Available" },
    { bedNumber: "G-101C", room: roomMap["101"]._id, ward: wardMap["General Medical Ward"]._id, bedType: "General", status: "Available" },
    { bedNumber: "G-101D", room: roomMap["101"]._id, ward: wardMap["General Medical Ward"]._id, bedType: "General", status: "Available" },
    // Room 102
    { bedNumber: "G-102A", room: roomMap["102"]._id, ward: wardMap["General Medical Ward"]._id, bedType: "General", status: "Available" },
    { bedNumber: "G-102B", room: roomMap["102"]._id, ward: wardMap["General Medical Ward"]._id, bedType: "General", status: "Available" },
    { bedNumber: "G-102C", room: roomMap["102"]._id, ward: wardMap["General Medical Ward"]._id, bedType: "General", status: "Available" },
    { bedNumber: "G-102D", room: roomMap["102"]._id, ward: wardMap["General Medical Ward"]._id, bedType: "General", status: "Available" },
    // ICU Pod A
    { bedNumber: "ICU-01", room: roomMap["ICU-Pod-A"]._id, ward: wardMap["Critical Care & ICU"]._id, bedType: "ICU", status: "Available" },
    { bedNumber: "ICU-02", room: roomMap["ICU-Pod-A"]._id, ward: wardMap["Critical Care & ICU"]._id, bedType: "ICU", status: "Available" },
    // ICU Pod B
    { bedNumber: "ICU-03", room: roomMap["ICU-Pod-B"]._id, ward: wardMap["Critical Care & ICU"]._id, bedType: "ICU", status: "Available" },
    { bedNumber: "ICU-04", room: roomMap["ICU-Pod-B"]._id, ward: wardMap["Critical Care & ICU"]._id, bedType: "ICU", status: "Available" },
    // ER Bay 1
    { bedNumber: "ER-01", room: roomMap["ER-Bay-1"]._id, ward: wardMap["Emergency & Trauma Ward"]._id, bedType: "Emergency", status: "Available" },
    { bedNumber: "ER-02", room: roomMap["ER-Bay-1"]._id, ward: wardMap["Emergency & Trauma Ward"]._id, bedType: "Emergency", status: "Maintenance" },
  ];

  const bedMap = {};
  for (const b of demoBeds) {
    let bed = await Bed.findOne({ bedNumber: b.bedNumber, room: b.room });
    if (!bed) {
      bed = await Bed.create({
        bedId: `BED-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...b,
      });
      console.log(`✓ Created Bed: ${b.bedNumber} (${b.status})`);
    } else {
      console.log(`✓ Bed exists: ${b.bedNumber} (${bed.status})`);
    }
    bedMap[b.bedNumber] = bed;
  }

  // 5. SEED PATIENTS (6 Patients)
  const demoPatients = [
    { name: "Rajesh Kumar", age: 45, gender: "Male", phone: "9876543210", address: "12 MG Road, Bangalore", bloodGroup: "O+" },
    { name: "Ananya Sharma", age: 28, gender: "Female", phone: "9812345678", address: "45 Park Street, Kolkata", bloodGroup: "A+" },
    { name: "Mohammed Farooq", age: 58, gender: "Male", phone: "9765432109", address: "8 Jubilee Hills, Hyderabad", bloodGroup: "B+" },
    { name: "Priya Patel", age: 34, gender: "Female", phone: "9988776655", address: "22 Ring Road, Ahmedabad", bloodGroup: "AB+" },
    { name: "David Wilson", age: 62, gender: "Male", phone: "9123456780", address: "104 Richmond Town, Bangalore", bloodGroup: "O-" },
    { name: "Sunita Verma", age: 50, gender: "Female", phone: "9871234567", address: "78 Civil Lines, Delhi", bloodGroup: "B-" },
  ];

  const patientMap = {};
  for (const p of demoPatients) {
    let patient = await Patient.findOne({ phone: p.phone });
    if (!patient) {
      patient = await Patient.create({
        patientId: `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...p,
      });
      console.log(`✓ Created Patient: ${p.name}`);
    } else {
      console.log(`✓ Patient exists: ${p.name}`);
    }
    patientMap[p.name] = patient;
  }

  // 6. SEED ADMISSIONS, TRANSFERS & DISCHARGES
  // Admission 1: Rajesh Kumar in G-101A (Admitted / Occupied)
  const p1 = patientMap["Rajesh Kumar"];
  const b1 = bedMap["G-101A"];
  let adm1 = await Admission.findOne({ patient: p1._id, status: "Admitted" });
  if (!adm1) {
    adm1 = await Admission.create({
      admissionId: `ADM-${Date.now()}-101`,
      patient: p1._id,
      bed: b1._id,
      admissionDate: new Date(Date.now() - 2 * 24 * 3600 * 1000), // 2 days ago
      diagnosis: "Acute Bronchitis & Respiratory Distress",
      admittedBy: "Dr. Sarah Jenkins",
      status: "Admitted",
    });
    await Bed.findByIdAndUpdate(b1._id, { status: "Occupied" });
    console.log(`✓ Created Active Admission: Rajesh Kumar -> Bed G-101A (Occupied)`);
  }

  // Admission 2: Priya Patel in ICU-01 (Admitted / Occupied)
  const p2 = patientMap["Priya Patel"];
  const b2 = bedMap["ICU-01"];
  let adm2 = await Admission.findOne({ patient: p2._id, status: "Admitted" });
  if (!adm2) {
    adm2 = await Admission.create({
      admissionId: `ADM-${Date.now()}-102`,
      patient: p2._id,
      bed: b2._id,
      admissionDate: new Date(Date.now() - 1 * 24 * 3600 * 1000), // 1 day ago
      diagnosis: "Post-operative cardiac telemetry monitoring",
      admittedBy: "Dr. Rajesh Mehta",
      status: "Admitted",
    });
    await Bed.findByIdAndUpdate(b2._id, { status: "Occupied" });
    console.log(`✓ Created Active Admission: Priya Patel -> Bed ICU-01 (Occupied)`);
  }

  // Admission 3: Mohammed Farooq in G-102A (Admitted / Occupied)
  const p3 = patientMap["Mohammed Farooq"];
  const b3 = bedMap["G-102A"];
  let adm3 = await Admission.findOne({ patient: p3._id, status: "Admitted" });
  if (!adm3) {
    adm3 = await Admission.create({
      admissionId: `ADM-${Date.now()}-103`,
      patient: p3._id,
      bed: b3._id,
      admissionDate: new Date(Date.now() - 4 * 3600 * 1000), // 4 hours ago
      diagnosis: "Hypertensive Crisis & Stage 2 Hypertension",
      admittedBy: "Dr. A. K. Sharma",
      status: "Admitted",
    });
    await Bed.findByIdAndUpdate(b3._id, { status: "Occupied" });
    console.log(`✓ Created Active Admission: Mohammed Farooq -> Bed G-102A (Occupied)`);
  }

  // Admission 4: Ananya Sharma (Admitted -> Transferred G-101B to G-101C -> Discharged)
  const p4 = patientMap["Ananya Sharma"];
  const bFrom = bedMap["G-101B"];
  const bTo = bedMap["G-101C"];
  let adm4 = await Admission.findOne({ patient: p4._id, status: "Discharged" });
  if (!adm4) {
    adm4 = await Admission.create({
      admissionId: `ADM-${Date.now()}-104`,
      patient: p4._id,
      bed: bTo._id,
      admissionDate: new Date(Date.now() - 4 * 24 * 3600 * 1000), // 4 days ago
      dischargeDate: new Date(Date.now() - 1 * 3600 * 1000), // 1 hour ago
      diagnosis: "Acute Gastroenteritis & Dehydration",
      admittedBy: "Dr. Sarah Jenkins",
      status: "Discharged",
      dischargeNotes: "Complete clinical recovery observed. Tolerating oral intake well. Discharged with oral rehydration and 5-day probiotic course.",
    });

    // Create transfer record
    const trf = await Transfer.findOne({ patient: p4._id });
    if (!trf) {
      await Transfer.create({
        transferId: `TRF-${Date.now()}-101`,
        patient: p4._id,
        admission: adm4._id,
        fromBed: bFrom._id,
        toBed: bTo._id,
        reason: "Patient step-down to quiet corner bed for observation",
        transferDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      });
      console.log(`✓ Created Transfer Record: Ananya Sharma (G-101B -> G-101C)`);
    }

    // Both vacated beds enter Cleaning status
    await Bed.findByIdAndUpdate(bFrom._id, { status: "Cleaning" });
    await Bed.findByIdAndUpdate(bTo._id, { status: "Cleaning" });
    console.log(`✓ Set Beds G-101B and G-101C to Cleaning status`);
  }

  console.log("=================================================");
  console.log("DEMONSTRATION SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=================================================");

  // Output summary
  const [totalWards, totalRooms, totalBeds, totalPatients, totalAdmissions, totalTransfers] = await Promise.all([
    Ward.countDocuments(),
    Room.countDocuments(),
    Bed.countDocuments(),
    Patient.countDocuments(),
    Admission.countDocuments(),
    Transfer.countDocuments(),
  ]);

  const bedCounts = await Bed.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  console.log({
    totalWards,
    totalRooms,
    totalBeds,
    bedStatuses: bedCounts,
    totalPatients,
    totalAdmissions,
    totalTransfers,
  });

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
