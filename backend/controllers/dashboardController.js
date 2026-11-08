const Bed = require("../models/Bed");
const Patient = require("../models/Patient");
const Admission = require("../models/Admission");
const Ward = require("../models/Ward");
const Room = require("../models/Room");
const Transfer = require("../models/Transfer");

const getDashboardStats = async (req, res) => {
  try {
    const [
      beds,
      patientsCount,
      wards,
      roomsCount,
      admissions,
      transfersCount,
    ] = await Promise.all([
      Bed.find().populate("ward", "wardName wardType").populate("room", "roomNumber"),
      Patient.countDocuments(),
      Ward.find(),
      Room.countDocuments(),
      Admission.find()
        .populate("patient", "patientId name age gender phone")
        .populate({
          path: "bed",
          select: "bedId bedNumber status room ward",
          populate: [
            { path: "room", select: "roomNumber" },
            { path: "ward", select: "wardName wardType" },
          ],
        })
        .sort({ createdAt: -1 }),
      Transfer.countDocuments(),
    ]);

    const totalBeds = beds.length;
    const availableBeds = beds.filter((b) => b.status === "Available").length;
    const occupiedBeds = beds.filter((b) => b.status === "Occupied").length;
    const cleaningBeds = beds.filter((b) => b.status === "Cleaning").length;
    const maintenanceBeds = beds.filter((b) => b.status === "Maintenance").length;

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const activeAdmissions = admissions.filter((a) => a.status === "Admitted").length;
    const dischargedCount = admissions.filter((a) => a.status === "Discharged").length;

    // Bed Distribution for Pie Chart
    const bedDistribution = [
      { name: "Available", value: availableBeds, color: "#16a34a" },
      { name: "Occupied", value: occupiedBeds, color: "#2563eb" },
      { name: "Cleaning", value: cleaningBeds, color: "#eab308" },
      { name: "Maintenance", value: maintenanceBeds, color: "#dc2626" },
    ];

    // Ward-wise occupancy
    const wardOccupancy = wards.map((ward) => {
      const wardBeds = beds.filter((b) => {
        const wardId = b.ward?._id || b.ward;
        return String(wardId) === String(ward._id);
      });
      const occupied = wardBeds.filter((b) => b.status === "Occupied").length;
      const available = wardBeds.filter((b) => b.status === "Available").length;
      return {
        wardName: ward.wardName,
        wardType: ward.wardType,
        totalBeds: wardBeds.length,
        occupied,
        available,
        rate: wardBeds.length > 0 ? Math.round((occupied / wardBeds.length) * 100) : 0,
      };
    });

    // Recent 5 admissions
    const recentAdmissions = admissions.slice(0, 5);

    res.status(200).json({
      success: true,
      stats: {
        totalBeds,
        availableBeds,
        occupiedBeds,
        cleaningBeds,
        maintenanceBeds,
        occupancyRate,
        totalPatients: patientsCount,
        totalWards: wards.length,
        totalRooms: roomsCount,
        activeAdmissions,
        dischargedCount,
        totalTransfers: transfersCount,
      },
      bedDistribution,
      wardOccupancy,
      recentAdmissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};
