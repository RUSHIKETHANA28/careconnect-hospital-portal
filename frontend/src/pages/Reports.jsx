import { useState, useEffect } from "react";
import {
  BedDouble,
  Users,
  Search,
  Download,
  Printer,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  Brush,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { apiFetch, getList } from "../utils/api";

function Reports() {
  const [activeReport, setActiveReport] = useState("Bed Occupancy");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [wardFilter, setWardFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [beds, setBeds] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [wards, setWards] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reportOptions = [
    "Bed Occupancy",
    "Available Beds",
    "Patient Admissions",
    "Discharges",
  ];

  // Fetch actual data from MongoDB through the backend
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [bedsResponse, admissionsResponse, wardsResponse] = await Promise.all([
        apiFetch("/beds"),
        apiFetch("/admissions"),
        apiFetch("/wards"),
      ]);

      const [bedsResult, admissionsResult, wardsResult] = await Promise.all([
        bedsResponse.json(),
        admissionsResponse.json(),
        wardsResponse.json(),
      ]);

      if (!bedsResponse.ok) throw new Error(bedsResult.message || "Unable to fetch bed records.");
      if (!admissionsResponse.ok) throw new Error(admissionsResult.message || "Unable to fetch admission records.");
      if (!wardsResponse.ok) throw new Error(wardsResult.message || "Unable to fetch ward records.");

      setBeds(getList(bedsResult, "beds"));
      setAdmissions(getList(admissionsResult, "admissions"));
      setWards(getList(wardsResult, "wards"));
    } catch (err) {
      console.error("Reports error:", err);
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Summary calculations from actual bed records
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === "Occupied").length;
  const availableBeds = beds.filter((b) => b.status === "Available").length;
  const cleaningBeds = beds.filter((b) => b.status === "Cleaning").length;
  const maintenanceBeds = beds.filter((b) => b.status === "Maintenance").length;

  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const getWardName = (bed) => {
    if (!bed || typeof bed !== "object") return "—";
    if (typeof bed.ward === "object" && bed.ward) {
      return bed.ward.wardName || "—";
    }
    const found = wards.find((w) => String(w._id) === String(bed.ward));
    return found ? found.wardName : "—";
  };

  const getRoomNumber = (bed) => {
    if (!bed || typeof bed !== "object") return "—";
    if (typeof bed.room === "object" && bed.room) {
      return `Room ${bed.room.roomNumber}` || "—";
    }
    return "—";
  };

  const getPatientName = (patient) => {
    if (!patient || typeof patient !== "object") return "Unknown Patient";
    return patient.name || "Unknown Patient";
  };

  // 1. Bed Occupancy Rows
  const bedOccupancyRows = beds.map((bed) => ({
    id: bed.bedNumber || bed.bedId || "—",
    bedId: bed.bedId || "—",
    ward: getWardName(bed),
    room: getRoomNumber(bed),
    bedType: bed.bedType || "General",
    status: bed.status || "Unknown",
  }));

  // 2. Available Bed Rows
  const availableBedRows = bedOccupancyRows.filter((b) => b.status === "Available");

  // 3. Patient Admission Rows
  const admissionRows = admissions.map((adm) => ({
    id: adm.admissionId || "—",
    patient: getPatientName(adm.patient),
    ward: getWardName(adm.bed),
    room: getRoomNumber(adm.bed),
    bed: adm.bed?.bedNumber || adm.bed?.bedId || "—",
    date: adm.admissionDate ? String(adm.admissionDate).slice(0, 10) : "—",
    diagnosis: adm.diagnosis || "—",
    doctor: adm.admittedBy || "Staff",
    status: adm.status || "Admitted",
  }));

  // 4. Discharge Rows
  const dischargeRows = admissions
    .filter((adm) => adm.status === "Discharged")
    .map((adm) => ({
      id: adm.admissionId || "—",
      patient: getPatientName(adm.patient),
      ward: getWardName(adm.bed),
      bed: adm.bed?.bedNumber || adm.bed?.bedId || "—",
      admissionDate: adm.admissionDate ? String(adm.admissionDate).slice(0, 10) : "—",
      date: adm.dischargeDate ? String(adm.dischargeDate).slice(0, 10) : "—",
      dischargeNotes: adm.dischargeNotes || adm.diagnosis || "Discharge completed",
      status: "Discharged",
    }));

  // Select active dataset
  let currentRows = [];
  if (activeReport === "Bed Occupancy") currentRows = bedOccupancyRows;
  else if (activeReport === "Available Beds") currentRows = availableBedRows;
  else if (activeReport === "Patient Admissions") currentRows = admissionRows;
  else if (activeReport === "Discharges") currentRows = dischargeRows;

  // Filter rows by search, status, ward, and date
  const filteredRows = currentRows.filter((row) => {
    const matchesSearch = Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || row.status === statusFilter;
    const matchesWard = wardFilter === "All" || row.ward === wardFilter;

    let matchesDate = true;
    if (fromDate && row.date) {
      matchesDate = matchesDate && row.date >= fromDate;
    }
    if (toDate && row.date) {
      matchesDate = matchesDate && row.date <= toDate;
    }

    return matchesSearch && matchesStatus && matchesWard && matchesDate;
  });

  // Export filtered records as CSV
  const exportCSV = () => {
    if (filteredRows.length === 0) {
      alert("No records available to export.");
      return;
    }

    const headers = Object.keys(filteredRows[0]);
    const csvContent = [
      headers.join(","),
      ...filteredRows.map((row) =>
        headers
          .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `careconnect-${activeReport.toLowerCase().replace(/\s+/g, "-")}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="reports-management">
      {/* SUMMARY STATS CARDS */}
      <div className="report-summary">
        <div className="report-summary-card">
          <div>
            <span>Total Beds</span>
            <h2>{totalBeds}</h2>
          </div>
          <div className="report-icon blue">
            <BedDouble size={25} />
          </div>
        </div>

        <div className="report-summary-card">
          <div>
            <span>Occupied Beds</span>
            <h2>{occupiedBeds}</h2>
          </div>
          <div className="report-icon purple">
            <Users size={25} />
          </div>
        </div>

        <div className="report-summary-card">
          <div>
            <span>Available Beds</span>
            <h2>{availableBeds}</h2>
          </div>
          <div className="report-icon green">
            <CheckCircle2 size={25} />
          </div>
        </div>

        <div className="report-summary-card">
          <div>
            <span>Occupancy Rate</span>
            <h2>{occupancyRate}%</h2>
          </div>
          <div className="report-icon orange">
            <FileText size={25} />
          </div>
        </div>
      </div>

      {/* REPORT PANEL */}
      <div className="panel reports-panel">
        <div className="reports-heading">
          <div>
            <h3>Hospital Clinical Reports</h3>
            <p>Access audit-ready bed occupancy, available bed inventories, admissions, and discharge registers</p>
          </div>

          <div className="report-actions">
            <button
              className="action-btn-pill action-btn-view"
              style={{ padding: "8px 14px", fontSize: "13px" }}
              onClick={fetchReports}
              disabled={loading}
              title="Refresh Report Data"
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>

            <button
              className="report-export-button"
              onClick={exportCSV}
              disabled={loading || filteredRows.length === 0}
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>

            <button
              className="report-print-button"
              onClick={printReport}
              disabled={loading || filteredRows.length === 0}
            >
              <Printer size={16} />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* REPORT TABS */}
        <div className="report-tabs">
          {reportOptions.map((report) => (
            <button
              key={report}
              className={activeReport === report ? "active" : ""}
              onClick={() => {
                setActiveReport(report);
                setSearch("");
                setStatusFilter("All");
                setWardFilter("All");
                setFromDate("");
                setToDate("");
              }}
            >
              {report}
            </button>
          ))}
        </div>

        <div className="report-content-heading">
          <div>
            <h3>{activeReport} Report</h3>
            <p>{loading ? "Loading database records..." : `${filteredRows.length} record(s) matching filter`}</p>
          </div>
        </div>

        {/* MULTI-FILTER BAR */}
        <div className="report-filters" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div className="report-search" style={{ flex: "1 1 200px" }}>
            <Search size={18} />
            <input
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="report-filter-select"
          >
            <option value="All">All Wards</option>
            {wards.map((w) => (
              <option key={w._id} value={w.wardName}>
                {w.wardName}
              </option>
            ))}
          </select>

          {activeReport === "Bed Occupancy" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="report-filter-select"
            >
              <option value="All">All Bed Statuses</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          )}

          {(activeReport === "Patient Admissions" || activeReport === "Discharges") && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                title="From Date"
              />
              <span style={{ fontSize: "12px", color: "#64748b" }}>to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                title="To Date"
              />
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: "12px", background: "#fef2f2", color: "#dc2626", borderRadius: "8px", margin: "14px 0" }}>
            {error}
          </div>
        )}

        {/* REPORT TABLE */}
        <div className="report-table-wrapper" style={{ overflowX: "auto" }}>
          <table className="report-table">
            <thead>
              <tr>
                {activeReport === "Bed Occupancy" && (
                  <>
                    <th>BED NUMBER</th>
                    <th>BED ID</th>
                    <th>WARD</th>
                    <th>ROOM</th>
                    <th>TYPE</th>
                    <th>STATUS</th>
                  </>
                )}

                {activeReport === "Available Beds" && (
                  <>
                    <th>BED NUMBER</th>
                    <th>BED ID</th>
                    <th>WARD</th>
                    <th>ROOM</th>
                    <th>BED TYPE</th>
                    <th>STATUS</th>
                  </>
                )}

                {activeReport === "Patient Admissions" && (
                  <>
                    <th>ADMISSION ID</th>
                    <th>PATIENT NAME</th>
                    <th>WARD</th>
                    <th>ROOM</th>
                    <th>BED</th>
                    <th>ADMISSION DATE</th>
                    <th>DIAGNOSIS</th>
                    <th>STATUS</th>
                  </>
                )}

                {activeReport === "Discharges" && (
                  <>
                    <th>ADMISSION ID</th>
                    <th>PATIENT NAME</th>
                    <th>WARD</th>
                    <th>BED</th>
                    <th>ADMITTED</th>
                    <th>DISCHARGED</th>
                    <th>DISCHARGE NOTES</th>
                    <th>STATUS</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    Loading clinical report data...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No report records match the selected parameters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={row.id + idx}>
                    {activeReport === "Bed Occupancy" && (
                      <>
                        <td><strong>Bed {row.id}</strong></td>
                        <td><span style={{ fontFamily: "monospace" }}>{row.bedId}</span></td>
                        <td>{row.ward}</td>
                        <td>{row.room}</td>
                        <td>{row.bedType}</td>
                        <td>
                          <span className={`badge-status badge-${row.status.toLowerCase()}`}>
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === "Available Beds" && (
                      <>
                        <td><strong>Bed {row.id}</strong></td>
                        <td><span style={{ fontFamily: "monospace" }}>{row.bedId}</span></td>
                        <td>{row.ward}</td>
                        <td>{row.room}</td>
                        <td>{row.bedType}</td>
                        <td>
                          <span className="badge-status badge-available">
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === "Patient Admissions" && (
                      <>
                        <td><span style={{ fontFamily: "monospace", fontWeight: "700" }}>{row.id}</span></td>
                        <td><strong>{row.patient}</strong></td>
                        <td>{row.ward}</td>
                        <td>{row.room}</td>
                        <td>Bed {row.bed}</td>
                        <td>{row.date}</td>
                        <td>{row.diagnosis}</td>
                        <td>
                          <span
                            className={`badge-status ${
                              row.status === "Admitted"
                                ? "badge-occupied"
                                : row.status === "Discharged"
                                ? "badge-discharged"
                                : "badge-available"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === "Discharges" && (
                      <>
                        <td><span style={{ fontFamily: "monospace", fontWeight: "700" }}>{row.id}</span></td>
                        <td><strong>{row.patient}</strong></td>
                        <td>{row.ward}</td>
                        <td>Bed {row.bed}</td>
                        <td>{row.admissionDate}</td>
                        <td><strong>{row.date}</strong></td>
                        <td><small>{row.dischargeNotes}</small></td>
                        <td>
                          <span className="badge-status badge-discharged">
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
