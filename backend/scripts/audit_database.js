const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Ward = require("../models/Ward");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
const Patient = require("../models/Patient");
const Admission = require("../models/Admission");
const Transfer = require("../models/Transfer");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27018/hospital_db";

const auditDatabase = async () => {
  console.log("=================================================");
  console.log("CARECONNECT DATABASE INTEGRITY AUDIT");
  console.log("Time: " + new Date().toISOString());
  console.log("MongoDB URI:", MONGO_URI);
  console.log("=================================================\n");

  await mongoose.connect(MONGO_URI);

  const errors = [];
  const warnings = [];

  // 1. Audit Users and Roles
  const users = await User.find();
  console.log(`Auditing Users: Found ${users.length} users in database.`);
  const requiredRoles = ["Admin", "Hospital Administrator", "Receptionist", "Nurse"];
  const foundRoles = new Set(users.map((u) => u.role));
  for (const role of requiredRoles) {
    if (!foundRoles.has(role)) {
      errors.push(`Missing required role account for: ${role}`);
    } else {
      console.log(`  ✓ Found user with role: ${role}`);
    }
  }

  // 2. Audit Wards
  const wards = await Ward.find();
  console.log(`\nAuditing Wards: Found ${wards.length} wards.`);
  const wardIds = new Set(wards.map((w) => w._id.toString()));

  // 3. Audit Rooms
  const rooms = await Room.find();
  console.log(`Auditing Rooms: Found ${rooms.length} rooms.`);
  const roomIds = new Set(rooms.map((r) => r._id.toString()));
  for (const room of rooms) {
    if (!wardIds.has(room.ward.toString())) {
      errors.push(`Room ${room.roomNumber} (${room._id}) references non-existent Ward ID: ${room.ward}`);
    }
  }

  // Check duplicate rooms in same ward
  const roomKeySet = new Set();
  for (const room of rooms) {
    const key = `${room.ward.toString()}_${room.roomNumber.toLowerCase().trim()}`;
    if (roomKeySet.has(key)) {
      errors.push(`Duplicate room number '${room.roomNumber}' in ward ${room.ward}`);
    }
    roomKeySet.add(key);
  }

  // 4. Audit Beds
  const beds = await Bed.find();
  console.log(`Auditing Beds: Found ${beds.length} beds.`);
  const bedIds = new Set(beds.map((b) => b._id.toString()));
  const bedMap = new Map(beds.map((b) => [b._id.toString(), b]));

  // Check duplicate beds in same room
  const bedKeySet = new Set();
  for (const bed of beds) {
    const key = `${bed.room.toString()}_${bed.bedNumber.toLowerCase().trim()}`;
    if (bedKeySet.has(key)) {
      errors.push(`Duplicate bed number '${bed.bedNumber}' in room ${bed.room}`);
    }
    bedKeySet.add(key);

    if (!roomIds.has(bed.room.toString())) {
      errors.push(`Bed ${bed.bedNumber} (${bed._id}) references non-existent Room ID: ${bed.room}`);
    }
    if (!wardIds.has(bed.ward.toString())) {
      errors.push(`Bed ${bed.bedNumber} (${bed._id}) references non-existent Ward ID: ${bed.ward}`);
    }
  }

  // 5. Audit Patients
  const patients = await Patient.find();
  console.log(`Auditing Patients: Found ${patients.length} patients.`);
  const patientIds = new Set(patients.map((p) => p._id.toString()));

  // 6. Audit Admissions
  const admissions = await Admission.find();
  console.log(`Auditing Admissions: Found ${admissions.length} admissions.`);
  const activeAdmissions = admissions.filter((a) => a.status === "Admitted");
  console.log(`  Active Admissions: ${activeAdmissions.length}`);
  console.log(`  Discharged Admissions: ${admissions.filter((a) => a.status === "Discharged").length}`);

  // Check duplicate active admissions per patient
  const activePatientSet = new Set();
  for (const adm of activeAdmissions) {
    const pId = adm.patient.toString();
    if (activePatientSet.has(pId)) {
      errors.push(`Patient ${pId} has MULTIPLE active admissions! Duplicate admission ID: ${adm.admissionId}`);
    }
    activePatientSet.add(pId);
  }

  // Check duplicate active admissions per bed
  const activeBedSet = new Set();
  for (const adm of activeAdmissions) {
    const bId = adm.bed.toString();
    if (activeBedSet.has(bId)) {
      errors.push(`Bed ${bId} has MULTIPLE active admissions assigned to it! Admission ID: ${adm.admissionId}`);
    }
    activeBedSet.add(bId);
  }

  // Check orphan patient/bed in admissions
  for (const adm of admissions) {
    if (!patientIds.has(adm.patient.toString())) {
      errors.push(`Admission ${adm.admissionId} references non-existent Patient: ${adm.patient}`);
    }
    if (!bedIds.has(adm.bed.toString())) {
      errors.push(`Admission ${adm.admissionId} references non-existent Bed: ${adm.bed}`);
    }
    if (adm.status === "Discharged" && !adm.dischargeDate) {
      warnings.push(`Discharged admission ${adm.admissionId} has no dischargeDate set.`);
    }
  }

  // 7. Check Bed Status Consistency with Active Admissions
  console.log("\nAuditing Bed Status Consistency:");
  for (const bed of beds) {
    const hasActiveAdm = activeBedSet.has(bed._id.toString());
    if (hasActiveAdm && bed.status !== "Occupied") {
      errors.push(`Bed ${bed.bedNumber} has an active admission but status is '${bed.status}' (expected 'Occupied')`);
    }
    if (!hasActiveAdm && bed.status === "Occupied") {
      errors.push(`Bed ${bed.bedNumber} is marked 'Occupied' but has NO active admission assigned to it!`);
    }
  }

  // 8. Audit Transfers
  const transfers = await Transfer.find();
  console.log(`\nAuditing Transfers: Found ${transfers.length} transfer records.`);
  for (const trf of transfers) {
    if (!patientIds.has(trf.patient.toString())) {
      errors.push(`Transfer ${trf.transferId} references non-existent Patient: ${trf.patient}`);
    }
    if (!bedIds.has(trf.fromBed.toString())) {
      errors.push(`Transfer ${trf.transferId} references non-existent fromBed: ${trf.fromBed}`);
    }
    if (!bedIds.has(trf.toBed.toString())) {
      errors.push(`Transfer ${trf.transferId} references non-existent toBed: ${trf.toBed}`);
    }
  }

  // Summary
  console.log("\n=================================================");
  console.log("INTEGRITY AUDIT RESULTS:");
  console.log(`Total Errors Found: ${errors.length}`);
  console.log(`Total Warnings Found: ${warnings.length}`);
  if (errors.length > 0) {
    console.log("\nERRORS DETECTED:");
    errors.forEach((e, i) => console.log(`  ${i + 1}. [ERROR] ${e}`));
  } else {
    console.log("✓ Zero database integrity errors detected!");
  }
  if (warnings.length > 0) {
    console.log("\nWARNINGS DETECTED:");
    warnings.forEach((w, i) => console.log(`  ${i + 1}. [WARNING] ${w}`));
  } else {
    console.log("✓ Zero database warnings detected!");
  }
  console.log("=================================================");

  await mongoose.disconnect();
  process.exit(errors.length > 0 ? 1 : 0);
};

auditDatabase().catch((err) => {
  console.error("Audit script failed:", err);
  process.exit(1);
});
