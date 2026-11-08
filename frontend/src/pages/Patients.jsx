import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  UserRound,
  X,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  BedDouble,
  Clock,
  Phone,
  Droplet,
} from "lucide-react";
import { apiFetch, getList } from "../utils/api";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    address: "",
    bloodGroup: "O+",
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const [patientResponse, admissionResponse] = await Promise.all([
        apiFetch("/patients"),
        apiFetch("/admissions"),
      ]);

      const patientData = await patientResponse.json();
      const admissionData = await admissionResponse.json();

      if (!patientResponse.ok) throw new Error(patientData.message || "Failed to load patients");
      if (!admissionResponse.ok) throw new Error(admissionData.message || "Failed to load admissions");

      setPatients(getList(patientData, "patients"));
      setAdmissions(getList(admissionData, "admissions"));
    } catch (err) {
      console.error("Patient loading error:", err);
      setError(err.message || "Failed to load patient records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const getPatientStatus = (patient) => {
    const patientAdmissions = admissions.filter((admission) => {
      const admissionPatient = admission.patient?._id || admission.patient;
      return String(admissionPatient) === String(patient._id);
    });

    if (patientAdmissions.some((a) => a.status === "Admitted")) {
      return "Admitted";
    }

    if (patientAdmissions.some((a) => a.status === "Discharged")) {
      return "Discharged";
    }

    return "Registered";
  };

  const filteredPatients = patients.filter((patient) =>
    `${patient.name} ${patient.patientId || ""} ${patient.phone} ${patient.bloodGroup || ""} ${patient.gender}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingPatient(null);
    setFormData({
      name: "",
      age: "",
      gender: "Male",
      phone: "",
      address: "",
      bloodGroup: "O+",
    });
    setShowForm(true);
  };

  const openEditModal = (patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name || "",
      age: patient.age !== undefined ? String(patient.age) : "",
      gender: patient.gender || "Male",
      phone: patient.phone || "",
      address: patient.address || "",
      bloodGroup: patient.bloodGroup || "O+",
    });
    setShowForm(true);
  };

  const openHistoryModal = async (patient) => {
    try {
      const res = await apiFetch(`/patients/${patient._id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedPatientHistory(data);
        setShowHistoryModal(true);
      } else {
        alert(data.message || "Unable to fetch patient history");
      }
    } catch (err) {
      alert("Failed to load patient history: " + err.message);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.age || !/^\d{10}$/.test(formData.phone.trim())) {
      alert("Enter a patient name, valid age, and a 10-digit phone number.");
      return;
    }

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        age: Number(formData.age),
        phone: formData.phone.trim(),
      };

      const url = editingPatient ? `/patients/${editingPatient._id}` : "/patients";
      const method = editingPatient ? "PUT" : "POST";

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save patient record");
      }

      alert(editingPatient ? "Patient updated successfully!" : "Patient registered successfully!");
      setShowForm(false);
      setEditingPatient(null);
      await fetchPatients();
    } catch (err) {
      alert(err.message);
    }
  };

  const deletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient record?")) {
      return;
    }

    try {
      const response = await apiFetch(`/patients/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete patient");
      }

      alert("Patient deleted successfully!");
      await fetchPatients();
    } catch (err) {
      alert(err.message);
    }
  };

  const admittedCount = patients.filter(
    (patient) => getPatientStatus(patient) === "Admitted"
  ).length;

  const dischargedCount = patients.filter(
    (patient) => getPatientStatus(patient) === "Discharged"
  ).length;

  return (
    <div className="patients-management">
      {/* SUMMARY STATS */}
      <div className="patients-summary">
        <div className="patients-summary-card">
          <div className="patients-icon purple">
            <UserRound size={22} />
          </div>
          <p>Total Patients</p>
          <h2>{patients.length}</h2>
        </div>

        <div className="patients-summary-card">
          <div className="patients-icon green">
            <UserRound size={22} />
          </div>
          <p>Currently Admitted</p>
          <h2>{admittedCount}</h2>
        </div>

        <div className="patients-summary-card">
          <div className="patients-icon blue">
            <UserRound size={22} />
          </div>
          <p>Discharged History</p>
          <h2>{dischargedCount}</h2>
        </div>

        <div className="patients-summary-card">
          <div className="patients-icon orange">
            <Droplet size={22} />
          </div>
          <p>Blood Groups Tracked</p>
          <h2>{new Set(patients.map((p) => p.bloodGroup).filter(Boolean)).size}</h2>
        </div>
      </div>

      {/* PATIENTS TABLE PANEL */}
      <div className="panel patients-panel">
        <div className="patients-toolbar">
          <div>
            <h3>Registered Patients</h3>
            <p>Access patient demographics, medical history, and active admissions</p>
          </div>

          <button className="add-patient-btn" onClick={openAddModal}>
            <Plus size={18} />
            <span>Register Patient</span>
          </button>
        </div>

        <div className="search-bar">
          <Search size={18} />
          <input
            placeholder="Search by patient name, ID, phone, gender, blood group..."
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
            Loading patients from database...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="empty-table-state">
            <UserRound size={36} />
            <p>No patients found</p>
            <span>Register a new patient to get started.</span>
          </div>
        ) : (
          <div className="patients-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="patients-table">
              <thead>
                <tr>
                  <th>PATIENT ID</th>
                  <th>PATIENT NAME</th>
                  <th>AGE / GENDER</th>
                  <th>PHONE</th>
                  <th>BLOOD GROUP</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const status = getPatientStatus(patient);
                  return (
                    <tr key={patient._id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: "700" }}>
                          {patient.patientId || "—"}
                        </span>
                      </td>
                      <td>
                        <strong>{patient.name}</strong>
                      </td>
                      <td>
                        {patient.age} yrs · {patient.gender}
                      </td>
                      <td>{patient.phone}</td>
                      <td>
                        <span style={{ fontWeight: "700", color: "#dc2626" }}>
                          {patient.bloodGroup || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge-status ${
                            status === "Admitted"
                              ? "badge-occupied"
                              : status === "Discharged"
                              ? "badge-discharged"
                              : "badge-available"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="table-action-btns">
                          <button
                            className="action-btn-pill action-btn-view"
                            onClick={() => openHistoryModal(patient)}
                            title="View Patient History"
                          >
                            <FileText size={14} />
                            <span>Details</span>
                          </button>

                          <button
                            className="action-btn-pill action-btn-edit"
                            onClick={() => openEditModal(patient)}
                            title="Edit Patient Details"
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>

                          <button
                            className="action-btn-pill action-btn-delete"
                            onClick={() => deletePatient(patient._id)}
                            title="Delete Patient"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT PATIENT MODAL */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editingPatient ? "Edit Patient Details" : "Register New Patient"}</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingPatient(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Patient Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Kumar"
                    required
                  />
                </div>

                <div className="modal-grid-2">
                  <div className="form-group">
                    <label>Age *</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="e.g. 35"
                      min="0"
                      max="130"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="modal-grid-2">
                  <div className="form-group">
                    <label>Phone Number (10 digits) *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      pattern="[0-9]{10}"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Address / City</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. Warangal, Telangana"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPatient(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingPatient ? "Update Patient" : "Register Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PATIENT DETAILS & ADMISSION HISTORY MODAL */}
      {showHistoryModal && selectedPatientHistory && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-large">
            <div className="modal-header">
              <h3>
                Patient Profile: {selectedPatientHistory.patient?.name}
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedPatientHistory(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Demographics Summary */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>ID</span>
                  <p style={{ fontWeight: "700" }}>{selectedPatientHistory.patient?.patientId}</p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Age / Gender</span>
                  <p style={{ fontWeight: "700" }}>
                    {selectedPatientHistory.patient?.age} yrs / {selectedPatientHistory.patient?.gender}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Phone</span>
                  <p style={{ fontWeight: "700" }}>{selectedPatientHistory.patient?.phone}</p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Blood Group</span>
                  <p style={{ fontWeight: "700", color: "#dc2626" }}>
                    {selectedPatientHistory.patient?.bloodGroup || "—"}
                  </p>
                </div>
              </div>

              {/* Admission History */}
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: "800", margin: "16px 0 10px", color: "#1e293b" }}>
                  Admission Records ({selectedPatientHistory.admissions?.length || 0})
                </h4>

                {(!selectedPatientHistory.admissions || selectedPatientHistory.admissions.length === 0) ? (
                  <p style={{ color: "#64748b", fontSize: "13px" }}>No past admissions recorded.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectedPatientHistory.admissions.map((adm) => (
                      <div
                        key={adm._id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "12px",
                          background: "#ffffff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <strong>{adm.admissionId}</strong>
                          <span
                            className={`badge-status ${
                              adm.status === "Admitted"
                                ? "badge-occupied"
                                : adm.status === "Discharged"
                                ? "badge-discharged"
                                : "badge-available"
                            }`}
                          >
                            {adm.status}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#334155" }}>
                          <p><strong>Diagnosis:</strong> {adm.diagnosis}</p>
                          <p>
                            <strong>Assigned Bed:</strong> Bed {adm.bed?.bedNumber || "—"} (
                            {adm.bed?.room?.roomNumber ? `Room ${adm.bed.room.roomNumber}` : ""},{" "}
                            {adm.bed?.ward?.wardName || "Ward"})
                          </p>
                          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                            Admitted: {new Date(adm.admissionDate || adm.createdAt).toLocaleString()}
                            {adm.dischargeDate && ` · Discharged: ${new Date(adm.dischargeDate).toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transfer History */}
              {selectedPatientHistory.transfers && selectedPatientHistory.transfers.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: "800", margin: "16px 0 10px", color: "#1e293b" }}>
                    Transfer History ({selectedPatientHistory.transfers.length})
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedPatientHistory.transfers.map((trf) => (
                      <div
                        key={trf._id}
                        style={{
                          padding: "10px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                      >
                        <span style={{ fontWeight: "700" }}>{trf.transferId}:</span> Bed {trf.fromBed?.bedNumber || "—"} → Bed {trf.toBed?.bedNumber || "—"}
                        <p style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>
                          Reason: {trf.reason} · Date: {new Date(trf.transferDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedPatientHistory(null);
                }}
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

export default Patients;
