import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  ClipboardList,
  Users,
  BedDouble,
  CalendarDays,
  X,
  FileText,
  UserCheck,
} from "lucide-react";
import { apiFetch, getList } from "../utils/api";

function Admissions() {
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cascade filter state inside the admission form
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  const [form, setForm] = useState({
    patient: "",
    bed: "",
    date: new Date().toISOString().slice(0, 10),
    diagnosis: "",
    doctor: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [admissionRes, patientRes, bedRes, wardRes, roomRes] = await Promise.all([
        apiFetch("/admissions"),
        apiFetch("/patients"),
        apiFetch("/beds"),
        apiFetch("/wards"),
        apiFetch("/rooms"),
      ]);

      const [admissionData, patientData, bedData, wardData, roomData] = await Promise.all([
        admissionRes.json(),
        patientRes.json(),
        bedRes.json(),
        wardRes.json(),
        roomRes.json(),
      ]);

      if (!admissionRes.ok) throw new Error(admissionData.message || "Failed to load admissions");
      if (!patientRes.ok) throw new Error(patientData.message || "Failed to load patients");
      if (!bedRes.ok) throw new Error(bedData.message || "Failed to load beds");
      if (!wardRes.ok) throw new Error(wardData.message || "Failed to load wards");
      if (!roomRes.ok) throw new Error(roomData.message || "Failed to load rooms");

      setAdmissions(getList(admissionData, "admissions"));
      setPatients(getList(patientData, "patients"));
      setBeds(getList(bedData, "beds"));
      setWards(getList(wardData, "wards"));
      setRooms(getList(roomData, "rooms"));
    } catch (err) {
      console.error("Admissions loading error:", err);
      setError(err.message || "Failed to load admission data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter available beds
  const availableBeds = beds.filter((b) => b.status === "Available");

  // Filter rooms based on selected ward
  const availableRoomsInWard = selectedWard
    ? rooms.filter((r) => {
        const wardId = typeof r.ward === "object" ? r.ward?._id : r.ward;
        return String(wardId) === String(selectedWard);
      })
    : rooms;

  // Filter beds based on selected ward & room
  const selectableBeds = availableBeds.filter((b) => {
    const wardId = typeof b.ward === "object" ? b.ward?._id : b.ward;
    const roomId = typeof b.room === "object" ? b.room?._id : b.room;

    const matchesWard = !selectedWard || String(wardId) === String(selectedWard);
    const matchesRoom = !selectedRoom || String(roomId) === String(selectedRoom);

    return matchesWard && matchesRoom;
  });

  // Filter out patients who already have an active admission
  const unadmittedPatients = patients.filter((patient) => {
    const hasActive = admissions.some(
      (adm) =>
        adm.status === "Admitted" &&
        String(adm.patient?._id || adm.patient) === String(patient._id)
    );
    return !hasActive;
  });

  const getPatientName = (patient) => {
    if (patient && typeof patient === "object") return patient.name || "Unknown";
    return patients.find((p) => p._id === patient)?.name || "Unknown";
  };

  const getBedDetails = (bed) => {
    if (!bed) return { ward: "—", room: "—", bedNumber: "—" };
    if (typeof bed === "object") {
      const room = bed.room;
      const ward = bed.ward || room?.ward;
      return {
        ward: typeof ward === "object" ? ward.wardName : "—",
        room: typeof room === "object" ? `Room ${room.roomNumber}` : "—",
        bedNumber: bed.bedNumber || bed.bedId || "—",
      };
    }
    const found = beds.find((b) => b._id === bed);
    return found ? getBedDetails(found) : { ward: "—", room: "—", bedNumber: "—" };
  };

  const filteredAdmissions = admissions.filter((item) => {
    const patientName = getPatientName(item.patient);
    const bedDetails = getBedDetails(item.bed);
    const admissionId = item.admissionId || "";

    const matchesSearch =
      patientName.toLowerCase().includes(search.toLowerCase()) ||
      admissionId.toLowerCase().includes(search.toLowerCase()) ||
      bedDetails.bedNumber.toLowerCase().includes(search.toLowerCase()) ||
      bedDetails.ward.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const admittedCount = admissions.filter((item) => item.status === "Admitted").length;
  const dischargedCount = admissions.filter((item) => item.status === "Discharged").length;

  const openAdmissionModal = () => {
    setSelectedWard("");
    setSelectedRoom("");
    setForm({
      patient: unadmittedPatients[0]?._id || "",
      bed: "",
      date: new Date().toISOString().slice(0, 10),
      diagnosis: "",
      doctor: "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.patient || !form.bed || !form.diagnosis.trim()) {
      alert("Please select a patient, select an available bed, and enter diagnosis.");
      return;
    }

    try {
      const response = await apiFetch("/admissions", {
        method: "POST",
        body: JSON.stringify({
          patient: form.patient,
          bed: form.bed,
          admissionDate: form.date,
          diagnosis: form.diagnosis.trim(),
          admittedBy: form.doctor.trim() || "Staff",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to register admission");
      }

      alert("Patient admission registered successfully! Bed is now occupied.");
      setShowForm(false);
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admissions-management">
      {/* SUMMARY STATS */}
      <div className="admissions-summary">
        <div className="admissions-summary-card">
          <div>
            <span>Total Admissions</span>
            <h2>{admissions.length}</h2>
          </div>
          <div className="admissions-icon blue">
            <ClipboardList size={25} />
          </div>
        </div>

        <div className="admissions-summary-card">
          <div>
            <span>Currently Admitted</span>
            <h2>{admittedCount}</h2>
          </div>
          <div className="admissions-icon green">
            <Users size={25} />
          </div>
        </div>

        <div className="admissions-summary-card">
          <div>
            <span>Discharged Patients</span>
            <h2>{dischargedCount}</h2>
          </div>
          <div className="admissions-icon purple">
            <CalendarDays size={25} />
          </div>
        </div>

        <div className="admissions-summary-card">
          <div>
            <span>Available Beds</span>
            <h2>{availableBeds.length}</h2>
          </div>
          <div className="admissions-icon orange">
            <BedDouble size={25} />
          </div>
        </div>
      </div>

      {/* ADMISSION RECORDS PANEL */}
      <div className="panel admissions-panel">
        <div className="admissions-toolbar">
          <div>
            <h3>Admission Records</h3>
            <p>Manage patient admissions, bed allocations, and clinical assignments</p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value="All">All Statuses</option>
              <option value="Admitted">Admitted</option>
              <option value="Discharged">Discharged</option>
              <option value="Transferred">Transferred</option>
            </select>

            <button className="add-admission-btn" onClick={openAdmissionModal}>
              <Plus size={18} />
              <span>Admit Patient</span>
            </button>
          </div>
        </div>

        <div className="search-bar">
          <Search size={18} />
          <input
            placeholder="Search by patient name, admission ID, bed number, or ward..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && (
          <div style={{ padding: "12px", background: "#fef2f2", color: "#dc2626", borderRadius: "8px", margin: "14px 0" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            Loading admission records from database...
          </div>
        ) : filteredAdmissions.length === 0 ? (
          <div className="empty-table-state">
            <ClipboardList size={36} />
            <p>No admissions found</p>
            <span>Register a new patient admission to get started.</span>
          </div>
        ) : (
          <div className="admissions-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="admissions-table">
              <thead>
                <tr>
                  <th>ADMISSION ID</th>
                  <th>PATIENT</th>
                  <th>WARD / ROOM</th>
                  <th>BED NUMBER</th>
                  <th>ADMISSION DATE</th>
                  <th>DIAGNOSIS</th>
                  <th>STATUS</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmissions.map((item) => {
                  const patientName = getPatientName(item.patient);
                  const bedInfo = getBedDetails(item.bed);
                  return (
                    <tr key={item._id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: "700" }}>
                          {item.admissionId || "—"}
                        </span>
                      </td>
                      <td>
                        <strong>{patientName}</strong>
                      </td>
                      <td>
                        {bedInfo.ward} · {bedInfo.room}
                      </td>
                      <td>
                        <strong>Bed {bedInfo.bedNumber}</strong>
                      </td>
                      <td>
                        {new Date(item.admissionDate || item.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span style={{ color: "#334155" }}>{item.diagnosis}</span>
                      </td>
                      <td>
                        <span
                          className={`badge-status ${
                            item.status === "Admitted"
                              ? "badge-occupied"
                              : item.status === "Discharged"
                              ? "badge-discharged"
                              : "badge-available"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-btn-pill action-btn-view"
                          onClick={() => setSelectedAdmission(item)}
                          title="View Complete Admission Details"
                        >
                          <FileText size={14} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADMIT PATIENT MODAL WITH CASCADE BED SELECTION */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Admit Patient (Bed Allocation)</h3>
              <button className="modal-close-btn" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Patient Selection */}
                <div className="form-group">
                  <label>Select Registered Patient *</label>
                  {unadmittedPatients.length === 0 ? (
                    <div style={{ color: "#dc2626", fontSize: "13px", padding: "8px", background: "#fef2f2", borderRadius: "6px" }}>
                      No unadmitted patients available. Please register a new patient first in the Patients module.
                    </div>
                  ) : (
                    <select
                      value={form.patient}
                      onChange={(e) => setForm({ ...form, patient: e.target.value })}
                      required
                    >
                      <option value="">Select Patient</option>
                      {unadmittedPatients.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.patientId} · {p.age} yrs · {p.gender})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Ward and Room Filter Cascading */}
                <div className="modal-grid-2">
                  <div className="form-group">
                    <label>Filter by Ward</label>
                    <select
                      value={selectedWard}
                      onChange={(e) => {
                        setSelectedWard(e.target.value);
                        setSelectedRoom("");
                        setForm({ ...form, bed: "" });
                      }}
                    >
                      <option value="">All Wards</option>
                      {wards.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.wardName} ({w.wardType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Filter by Room</label>
                    <select
                      value={selectedRoom}
                      onChange={(e) => {
                        setSelectedRoom(e.target.value);
                        setForm({ ...form, bed: "" });
                      }}
                    >
                      <option value="">All Rooms</option>
                      {availableRoomsInWard.map((r) => (
                        <option key={r._id} value={r._id}>
                          Room {r.roomNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Available Bed Selection */}
                <div className="form-group">
                  <label>Select Available Bed * ({selectableBeds.length} available)</label>
                  {selectableBeds.length === 0 ? (
                    <div style={{ color: "#b45309", fontSize: "13px", padding: "8px", background: "#fffbeb", borderRadius: "6px" }}>
                      No available beds found matching this ward/room. Make sure beds are marked as Available (not Cleaning or Maintenance).
                    </div>
                  ) : (
                    <select
                      value={form.bed}
                      onChange={(e) => setForm({ ...form, bed: e.target.value })}
                      required
                    >
                      <option value="">Select Available Bed</option>
                      {selectableBeds.map((b) => {
                        const roomNumber = typeof b.room === "object" ? b.room?.roomNumber : "—";
                        const wardName = typeof b.ward === "object" ? b.ward?.wardName : "—";
                        return (
                          <option key={b._id} value={b._id}>
                            Bed {b.bedNumber} ({wardName} · Room {roomNumber} · {b.bedType})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Diagnosis & Attending Physician */}
                <div className="form-group">
                  <label>Clinical Diagnosis / Reason for Admission *</label>
                  <textarea
                    rows="2"
                    value={form.diagnosis}
                    onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                    placeholder="e.g. Acute Viral Bronchitis, Post-op Recovery"
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    required
                  />
                </div>

                <div className="modal-grid-2">
                  <div className="form-group">
                    <label>Admitting Doctor / Staff</label>
                    <input
                      type="text"
                      value={form.doctor}
                      onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                      placeholder="e.g. Dr. Ramesh / Staff Nurse"
                    />
                  </div>

                  <div className="form-group">
                    <label>Admission Date *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={unadmittedPatients.length === 0 || selectableBeds.length === 0}
                >
                  Confirm Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMISSION DETAILS MODAL */}
      {selectedAdmission && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Admission Details: {selectedAdmission.admissionId}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedAdmission(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Patient Name</span>
                  <p style={{ fontWeight: "700" }}>{getPatientName(selectedAdmission.patient)}</p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Status</span>
                  <p>
                    <span
                      className={`badge-status ${
                        selectedAdmission.status === "Admitted"
                          ? "badge-occupied"
                          : selectedAdmission.status === "Discharged"
                          ? "badge-discharged"
                          : "badge-available"
                      }`}
                    >
                      {selectedAdmission.status}
                    </span>
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Ward / Bed</span>
                  <p style={{ fontWeight: "700" }}>
                    {getBedDetails(selectedAdmission.bed).ward} · Bed {getBedDetails(selectedAdmission.bed).bedNumber}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Room</span>
                  <p style={{ fontWeight: "700" }}>{getBedDetails(selectedAdmission.bed).room}</p>
                </div>
              </div>

              <div style={{ padding: "10px 0" }}>
                <p><strong>Diagnosis:</strong> {selectedAdmission.diagnosis}</p>
                <p><strong>Admitted By:</strong> {selectedAdmission.admittedBy || "Staff"}</p>
                <p>
                  <strong>Admission Date:</strong>{" "}
                  {new Date(selectedAdmission.admissionDate || selectedAdmission.createdAt).toLocaleString()}
                </p>
                {selectedAdmission.dischargeDate && (
                  <p>
                    <strong>Discharge Date:</strong>{" "}
                    {new Date(selectedAdmission.dischargeDate).toLocaleString()}
                  </p>
                )}
                {selectedAdmission.dischargeNotes && (
                  <p><strong>Discharge Notes:</strong> {selectedAdmission.dischargeNotes}</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedAdmission(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admissions;
