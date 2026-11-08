import { useState, useEffect } from "react";
import {
  Search,
  ArrowLeftRight,
  LogOut,
  Users,
  CheckCircle2,
  X,
} from "lucide-react";
import { apiFetch, getList } from "../utils/api";

function TransfersDischarge() {
  const [records, setRecords] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [wards, setWards] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("Transfer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    admission: "",
    toBed: "",
    reason: "",
    dischargeNotes: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [admissionRes, transferRes, bedRes, patientRes, wardRes] = await Promise.all([
        apiFetch("/admissions"),
        apiFetch("/transfers"),
        apiFetch("/beds"),
        apiFetch("/patients"),
        apiFetch("/wards"),
      ]);

      const [admissionData, transferData, bedData, patientData, wardData] = await Promise.all([
        admissionRes.json(),
        transferRes.json(),
        bedRes.json(),
        patientRes.json(),
        wardRes.json(),
      ]);

      if (!admissionRes.ok) throw new Error(admissionData.message || "Failed to load admissions");
      if (!transferRes.ok) throw new Error(transferData.message || "Failed to load transfers");
      if (!bedRes.ok) throw new Error(bedData.message || "Failed to load beds");
      if (!patientRes.ok) throw new Error(patientData.message || "Failed to load patients");
      if (!wardRes.ok) throw new Error(wardData.message || "Failed to load wards");

      setAdmissions(getList(admissionData, "admissions"));
      setRecords(getList(transferData, "transfers"));
      setBeds(getList(bedData, "beds"));
      setPatients(getList(patientData, "patients"));
      setWards(getList(wardData, "wards"));
    } catch (err) {
      console.error("Transfers loading error:", err);
      setError(err.message || "Failed to load transfer records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeAdmissions = admissions.filter((item) => item.status === "Admitted");
  const availableBeds = beds.filter((bed) => bed.status === "Available");

  const getPatientName = (patient) => {
    if (patient && typeof patient === "object") return patient.name || "Unknown";
    return patients.find((p) => p._id === patient)?.name || "Unknown";
  };

  const getBed = (bed) => {
    if (!bed) return null;
    const bedId = typeof bed === "object" ? bed._id : bed;
    const matchingBed = beds.find((item) => item._id === bedId);
    return matchingBed || (typeof bed === "object" ? bed : null);
  };

  const getWardName = (ward) => {
    if (!ward) return "Unknown Ward";
    if (typeof ward === "object") {
      if (ward.wardName) return ward.wardName;
      const wardId = ward._id || ward.id;
      return wards.find((item) => item._id === wardId)?.wardName || "Unknown Ward";
    }
    return wards.find((item) => item._id === ward)?.wardName || "Unknown Ward";
  };

  const getBedLabel = (bed) => {
    const bedData = getBed(bed);
    if (!bedData) return "—";

    const room = bedData.room;
    const ward = bedData.ward || (room && typeof room === "object" ? room.ward : null);
    const wardName = getWardName(ward);
    const bedNumber = bedData.bedNumber || bedData.bedId || "Unknown Bed";

    return `${wardName} / Bed ${bedNumber}`;
  };

  const getAdmissionPatient = (admission) => {
    return getPatientName(admission.patient);
  };

  const getSelectedAdmission = () => {
    return admissions.find((item) => item._id === form.admission);
  };

  const transfers = records.length;
  const discharges = admissions.filter((item) => item.status === "Discharged").length;

  const transferRecords = records.map((record) => ({
    id: record.transferId || "TR-—",
    patient: getPatientName(record.patient),
    from: getBedLabel(record.fromBed),
    to: getBedLabel(record.toBed),
    date: record.transferDate,
    reason: record.reason,
    type: "Transfer",
    status: "Completed",
  }));

  const dischargeRecords = admissions
    .filter((item) => item.status === "Discharged")
    .map((item) => ({
      id: item.admissionId || "DC-—",
      patient: getAdmissionPatient(item),
      from: getBedLabel(item.bed),
      to: "Discharged Home",
      date: item.dischargeDate,
      reason: item.dischargeNotes || item.diagnosis || "Discharge completed",
      type: "Discharge",
      status: "Completed",
    }));

  const allRecords = [...transferRecords, ...dischargeRecords].sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
  );

  const filteredRecords = allRecords.filter((record) => {
    const matchesSearch =
      record.patient.toLowerCase().includes(search.toLowerCase()) ||
      record.id.toLowerCase().includes(search.toLowerCase()) ||
      record.from.toLowerCase().includes(search.toLowerCase()) ||
      record.to.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "All" || record.type === filter;

    return matchesSearch && matchesFilter;
  });

  const openForm = (type) => {
    setFormType(type);
    setForm({
      admission: "",
      toBed: "",
      reason: "",
      dischargeNotes: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.admission) {
      alert("Please select an admitted patient.");
      return;
    }

    try {
      let response;

      if (formType === "Transfer") {
        if (!form.toBed || !form.reason.trim()) {
          alert("Please select a destination bed and enter a transfer reason.");
          return;
        }

        response = await apiFetch("/transfers", {
          method: "POST",
          body: JSON.stringify({
            admission: form.admission,
            toBed: form.toBed,
            reason: form.reason.trim(),
          }),
        });
      } else {
        response = await apiFetch(`/discharges/${form.admission}`, {
          method: "PUT",
          body: JSON.stringify({
            dischargeNotes: form.dischargeNotes.trim(),
          }),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Unable to complete ${formType.toLowerCase()}`);
      }

      alert(
        formType === "Transfer"
          ? "Patient transferred successfully! Previous bed is now marked for Cleaning."
          : "Patient discharged successfully! Bed is now marked for Cleaning."
      );

      setShowForm(false);
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="transfer-management">
      {/* SUMMARY CARDS */}
      <div className="transfer-summary">
        <div className="transfer-summary-card">
          <div>
            <span>Total Records</span>
            <h2>{allRecords.length}</h2>
          </div>
          <div className="transfer-icon blue">
            <Users size={25} />
          </div>
        </div>

        <div className="transfer-summary-card">
          <div>
            <span>Total Bed Transfers</span>
            <h2>{transfers}</h2>
          </div>
          <div className="transfer-icon purple">
            <ArrowLeftRight size={25} />
          </div>
        </div>

        <div className="transfer-summary-card">
          <div>
            <span>Completed Discharges</span>
            <h2>{discharges}</h2>
          </div>
          <div className="transfer-icon green">
            <LogOut size={25} />
          </div>
        </div>

        <div className="transfer-summary-card">
          <div>
            <span>Active Inpatients</span>
            <h2>{activeAdmissions.length}</h2>
          </div>
          <div className="transfer-icon orange">
            <CheckCircle2 size={25} />
          </div>
        </div>
      </div>

      {/* TRANSFERS & DISCHARGE PANEL */}
      <div className="panel transfer-panel">
        <div className="transfer-toolbar">
          <div>
            <h3>Transfers & Discharge Log</h3>
            <p>Track all patient transfers between beds and hospital discharge workflows</p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              className="action-btn-pill action-btn-edit"
              style={{ padding: "8px 14px", fontSize: "13px" }}
              onClick={() => openForm("Transfer")}
            >
              <ArrowLeftRight size={16} />
              <span>Transfer Patient</span>
            </button>

            <button
              className="action-btn-pill action-btn-clean"
              style={{ padding: "8px 14px", fontSize: "13px" }}
              onClick={() => openForm("Discharge")}
            >
              <LogOut size={16} />
              <span>Discharge Patient</span>
            </button>
          </div>
        </div>

        <div className="transfer-filter-row">
          <div className="transfer-search">
            <Search size={18} />
            <input
              placeholder="Search by patient, ID, or bed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="transfer-tabs">
            {["All", "Transfer", "Discharge"].map((tab) => (
              <button
                key={tab}
                className={filter === tab ? "active" : ""}
                onClick={() => setFilter(tab)}
              >
                {tab === "All" ? "All Activity" : `${tab}s`}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: "12px", background: "#fef2f2", color: "#dc2626", borderRadius: "8px", margin: "14px 0" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            Loading records from database...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-table-state">
            <ArrowLeftRight size={36} />
            <p>No transfer or discharge records found</p>
            <span>Transfer or discharge an admitted patient using the buttons above.</span>
          </div>
        ) : (
          <div className="transfer-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="transfer-table">
              <thead>
                <tr>
                  <th>RECORD ID</th>
                  <th>PATIENT</th>
                  <th>FROM BED</th>
                  <th>TO BED / DESTINATION</th>
                  <th>DATE</th>
                  <th>TYPE</th>
                  <th>NOTES / REASON</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((item) => (
                  <tr key={item.id + item.date}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: "700" }}>
                        {item.id}
                      </span>
                    </td>
                    <td>
                      <strong>{item.patient}</strong>
                    </td>
                    <td>{item.from}</td>
                    <td>
                      <strong>{item.to}</strong>
                    </td>
                    <td>{formatDate(item.date)}</td>
                    <td>
                      <span
                        className={`badge-status ${
                          item.type === "Transfer" ? "badge-occupied" : "badge-discharged"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td>
                      <small style={{ color: "#475569" }}>{item.reason || "—"}</small>
                    </td>
                    <td>
                      <span className="badge-status badge-available">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TRANSFER / DISCHARGE MODAL */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{formType === "Transfer" ? "Transfer Patient to Bed" : "Discharge Patient"}</h3>
              <button className="modal-close-btn" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Admitted Inpatient *</label>
                  {activeAdmissions.length === 0 ? (
                    <div style={{ color: "#dc2626", fontSize: "13px", padding: "8px", background: "#fef2f2", borderRadius: "6px" }}>
                      No patients are currently admitted in the hospital.
                    </div>
                  ) : (
                    <select
                      value={form.admission}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          admission: e.target.value,
                          toBed: "",
                        })
                      }
                      required
                    >
                      <option value="">Select Admitted Patient</option>
                      {activeAdmissions.map((admission) => (
                        <option key={admission._id} value={admission._id}>
                          {getAdmissionPatient(admission)} ({admission.admissionId} · {getBedLabel(admission.bed)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label>Current Assigned Bed</label>
                  <input
                    value={
                      getSelectedAdmission()
                        ? getBedLabel(getSelectedAdmission().bed)
                        : "No patient selected"
                    }
                    readOnly
                    style={{ background: "#f1f5f9" }}
                  />
                </div>

                {formType === "Transfer" ? (
                  <>
                    <div className="form-group">
                      <label>Select Destination Available Bed *</label>
                      {availableBeds.length === 0 ? (
                        <div style={{ color: "#b45309", fontSize: "13px", padding: "8px", background: "#fffbeb", borderRadius: "6px" }}>
                          No available beds in the hospital. Clean or discharge beds to make them available.
                        </div>
                      ) : (
                        <select
                          value={form.toBed}
                          onChange={(e) => setForm({ ...form, toBed: e.target.value })}
                          required
                        >
                          <option value="">Select Available Bed</option>
                          {availableBeds.map((bed) => (
                            <option key={bed._id} value={bed._id}>
                              {getBedLabel(bed)} ({bed.bedType})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Clinical Reason for Bed Transfer *</label>
                      <input
                        type="text"
                        value={form.reason}
                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        placeholder="e.g. Moved to ICU for intensive monitoring, Shifted to Private Ward"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Discharge Clinical Notes / Summary (Optional)</label>
                      <textarea
                        rows="3"
                        value={form.dischargeNotes}
                        onChange={(e) => setForm({ ...form, dischargeNotes: e.target.value })}
                        placeholder="e.g. Condition stable, discharged with oral medications for 5 days. Follow up in 1 week."
                        style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                      />
                    </div>

                    <div style={{ padding: "12px", background: "#eff6ff", borderRadius: "8px", fontSize: "13px", color: "#1e40af" }}>
                      Notice: Once discharged, the patient's assigned bed will automatically be marked as <strong>Cleaning</strong> so hospital staff can sanitize it before reallocation.
                    </div>
                  </>
                )}
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
                  disabled={activeAdmissions.length === 0 || (formType === "Transfer" && availableBeds.length === 0)}
                >
                  {formType === "Transfer" ? "Confirm Transfer" : "Confirm Discharge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransfersDischarge;
