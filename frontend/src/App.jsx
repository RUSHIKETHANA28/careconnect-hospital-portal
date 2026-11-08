import { useState, useEffect } from "react";

import {
  LayoutDashboard,
  BedDouble,
  Building2,
  DoorOpen,
  Users,
  ClipboardList,
  ArrowLeftRight,
  FileText,
  Settings as SettingsIcon,
  Menu,
  Search,
  Activity,
  LogOut,
  Brush,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import BedManagement from "./pages/BedManagement";
import WardManagement from "./pages/WardManagement";
import RoomManagement from "./pages/RoomManagement";
import Patients from "./pages/Patients";
import Admissions from "./pages/Admissions";
import TransfersDischarge from "./pages/TransfersDischarge";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { apiFetch } from "./utils/api";

import "./styles/style.css";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Ward Management", icon: Building2 },
  { name: "Room Management", icon: DoorOpen },
  { name: "Bed Management", icon: BedDouble },
  { name: "Patients", icon: Users },
  { name: "Admissions", icon: ClipboardList },
  { name: "Transfers & Discharge", icon: ArrowLeftRight },
  { name: "Reports", icon: FileText },
  { name: "Settings", icon: SettingsIcon },
];

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });

  const [activePage, setActivePage] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(true);

  // Live dynamic dashboard statistics from MongoDB
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalBeds: 0,
      availableBeds: 0,
      occupiedBeds: 0,
      cleaningBeds: 0,
      maintenanceBeds: 0,
      occupancyRate: 0,
      totalPatients: 0,
      totalWards: 0,
      totalRooms: 0,
      activeAdmissions: 0,
      dischargedCount: 0,
      totalTransfers: 0,
    },
    bedDistribution: [
      { name: "Available", value: 0, color: "#16a34a" },
      { name: "Occupied", value: 0, color: "#2563eb" },
      { name: "Cleaning", value: 0, color: "#eab308" },
      { name: "Maintenance", value: 0, color: "#dc2626" },
    ],
    wardOccupancy: [],
    recentAdmissions: [],
    recentDischarges: [],
    availableBedsList: [],
  });

  const [dashboardTab, setDashboardTab] = useState("admissions");
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Fetch live dashboard statistics from database
  const fetchDashboardStats = async () => {
    if (!user) return;
    try {
      setLoadingDashboard(true);
      const res = await apiFetch("/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setDashboardData({
          stats: data.stats || dashboardData.stats,
          bedDistribution: data.bedDistribution || dashboardData.bedDistribution,
          wardOccupancy: data.wardOccupancy || [],
          recentAdmissions: data.recentAdmissions || [],
          recentDischarges: data.recentDischarges || [],
          availableBedsList: data.availableBedsList || [],
        });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (user && activePage === "Dashboard") {
      fetchDashboardStats();
    }
  }, [user, activePage]);

  // Handle session expiration
  useEffect(() => {
    const handleExpired = (e) => {
      alert(e.detail?.message || "Session expired. Please log in again.");
      setUser(null);
    };

    window.addEventListener("careconnect:session-expired", handleExpired);
    return () => window.removeEventListener("careconnect:session-expired", handleExpired);
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setActivePage("Dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setActivePage("Dashboard");
  };

  // Role-based menu access
  const authorizedMenuItems = menuItems.filter((item) => {
    if (!user) return false;
    const role = user.role;
    if (role === "Admin" || role === "Hospital Administrator") return true;
    if (role === "Receptionist") {
      return ["Dashboard", "Bed Management", "Patients", "Admissions", "Transfers & Discharge", "Reports"].includes(item.name);
    }
    if (role === "Nurse") {
      return ["Dashboard", "Bed Management", "Patients", "Transfers & Discharge", "Reports"].includes(item.name);
    }
    return true;
  });

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const stats = dashboardData.stats;
  const hasBedData = dashboardData.bedDistribution.some((item) => item.value > 0);

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? "" : "collapsed"}`}>
        <div className="brand">
          <div className="brand-icon">
            <Activity size={25} />
          </div>

          {menuOpen && (
            <h2>
              Care<span>Connect</span>
            </h2>
          )}
        </div>

        {menuOpen && <p className="menu-label">MAIN MENU</p>}

        <nav>
          {authorizedMenuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => setActivePage(item.name)}
                title={item.name}
              >
                <Icon size={20} />
                {menuOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">
            {(user.name || "U").slice(0, 2).toUpperCase()}
          </div>

          {menuOpen && (
            <div>
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={22} />
          </button>

          <div className="search-box">
            <Search size={18} />
            <input placeholder="CareConnect Hospital System..." readOnly />
          </div>

          <div className="topbar-right">
            <div className="profile">
              <div className="avatar">
                {(user.name || "U").slice(0, 2).toUpperCase()}
              </div>

              <div>
                <strong>{user.name}</strong>
                <small>{user.role}</small>
              </div>
            </div>

            <button
              className="icon-button"
              onClick={handleLogout}
              title="Logout from CareConnect"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <p className="welcome">HOSPITAL MANAGEMENT SYSTEM</p>
              <h1>{activePage}</h1>
              <p className="subtitle">
                CareConnect Bed Availability and Admission Management Portal
              </p>
            </div>

            <div className="date-label">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>

          {activePage === "Dashboard" ? (
            <>
              {/* DASHBOARD SUMMARY CARDS - REAL DATABASE METRICS */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon purple">
                    <BedDouble />
                  </div>
                  <p>Total Hospital Beds</p>
                  <h2>{stats.totalBeds}</h2>
                  <small>{stats.totalWards} Wards · {stats.totalRooms} Rooms</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">
                    <CheckCircle2 />
                  </div>
                  <p>Available Beds</p>
                  <h2>{stats.availableBeds}</h2>
                  <small className="positive">Ready for instant admission</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon blue">
                    <Users />
                  </div>
                  <p>Occupied Beds</p>
                  <h2>{stats.occupiedBeds}</h2>
                  <small>{stats.occupancyRate}% Overall Occupancy</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange">
                    <Brush />
                  </div>
                  <p>Under Cleaning</p>
                  <h2>{stats.cleaningBeds}</h2>
                  <small>Maintenance: {stats.maintenanceBeds} beds</small>
                </div>
              </div>

              {/* SECOND ROW METRICS */}
              <div className="stats-grid" style={{ marginTop: "16px" }}>
                <div className="stat-card">
                  <div className="stat-icon purple">
                    <UserCheck />
                  </div>
                  <p>Active Admitted Patients</p>
                  <h2>{stats.activeAdmissions}</h2>
                  <small>Currently in hospital</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon blue">
                    <ClipboardList />
                  </div>
                  <p>Discharged Patients</p>
                  <h2>{stats.dischargedCount}</h2>
                  <small>Completed admissions</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">
                    <Users />
                  </div>
                  <p>Registered Patients</p>
                  <h2>{stats.totalPatients}</h2>
                  <small>Total in database</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange">
                    <ArrowLeftRight />
                  </div>
                  <p>Bed Transfers</p>
                  <h2>{stats.totalTransfers}</h2>
                  <small>Patient transfers recorded</small>
                </div>
              </div>

              {/* VISUALIZATIONS AND RECENT ACTIVITY */}
              <div className="dashboard-grid" style={{ marginTop: "24px" }}>
                <div className="panel occupancy-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Live Bed Distribution</h3>
                      <p>Real-time MongoDB bed availability breakdown</p>
                    </div>
                  </div>

                  {loadingDashboard ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>Loading statistics...</div>
                  ) : hasBedData ? (
                    <>
                      <div className="chart-area">
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={dashboardData.bedDistribution}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={100}
                              paddingAngle={4}
                            >
                              {dashboardData.bedDistribution.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="legend">
                        {dashboardData.bedDistribution.map((item) => (
                          <div key={item.name}>
                            <span style={{ background: item.color }}></span>
                            {item.name}: {item.value} bed{item.value !== 1 ? "s" : ""}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>
                      No beds created yet. Navigate to Bed Management to add hospital beds.
                    </div>
                  )}

                  {dashboardData.wardOccupancy.length > 0 && (
                    <div style={{ marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "10px", color: "#1e293b" }}>
                        Ward Occupancy Overview
                      </h4>
                      {dashboardData.wardOccupancy.map((w) => (
                        <div key={w.wardName} style={{ marginBottom: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                            <span><strong>{w.wardName}</strong> ({w.wardType})</span>
                            <span>{w.occupied}/{w.totalBeds} Occupied ({w.rate}%)</span>
                          </div>
                          <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${w.rate}%`, height: "100%", background: "#2563eb", borderRadius: "3px" }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="panel admissions-panel">
                  <div className="panel-heading" style={{ flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h3>Hospital Inpatient Activity</h3>
                      <p>Real-time records from MongoDB</p>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className={`action-btn-pill ${dashboardTab === "admissions" ? "action-btn-edit" : "action-btn-view"}`}
                        onClick={() => setDashboardTab("admissions")}
                      >
                        Admissions
                      </button>
                      <button
                        className={`action-btn-pill ${dashboardTab === "discharges" ? "action-btn-clean" : "action-btn-view"}`}
                        onClick={() => setDashboardTab("discharges")}
                      >
                        Discharges
                      </button>
                      <button
                        className={`action-btn-pill ${dashboardTab === "available" ? "action-btn-edit" : "action-btn-view"}`}
                        onClick={() => setDashboardTab("available")}
                      >
                        Available Beds
                      </button>
                    </div>
                  </div>

                  {dashboardTab === "admissions" && (
                    dashboardData.recentAdmissions.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>
                        No patient admission records found.
                      </div>
                    ) : (
                      dashboardData.recentAdmissions.map((adm) => {
                        const patientName = adm.patient?.name || "Patient";
                        const initials = patientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();

                        const wardName = adm.bed?.ward?.wardName || "Ward";
                        const bedNum = adm.bed?.bedNumber || adm.bed?.bedId || "Bed";

                        return (
                          <div className="admission-row" key={adm._id}>
                            <div className="patient-avatar">{initials}</div>
                            <div className="patient-info">
                              <strong>{patientName}</strong>
                              <small>{wardName} · Bed {bedNum}</small>
                            </div>
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
                        );
                      })
                    )
                  )}

                  {dashboardTab === "discharges" && (
                    dashboardData.recentDischarges.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>
                        No completed discharge records found.
                      </div>
                    ) : (
                      dashboardData.recentDischarges.map((dis) => {
                        const patientName = dis.patient?.name || "Patient";
                        const initials = patientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();

                        const wardName = dis.bed?.ward?.wardName || "Ward";
                        const bedNum = dis.bed?.bedNumber || dis.bed?.bedId || "Bed";

                        return (
                          <div className="admission-row" key={dis._id}>
                            <div className="patient-avatar" style={{ background: "#f1f5f9", color: "#334155" }}>
                              {initials}
                            </div>
                            <div className="patient-info">
                              <strong>{patientName}</strong>
                              <small>
                                Discharged {new Date(dis.dischargeDate || dis.updatedAt).toLocaleDateString()} · {wardName} Bed {bedNum}
                              </small>
                            </div>
                            <span className="badge-status badge-discharged">
                              Discharged
                            </span>
                          </div>
                        );
                      })
                    )
                  )}

                  {dashboardTab === "available" && (
                    dashboardData.availableBedsList.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>
                        No beds currently available. Check Cleaning status.
                      </div>
                    ) : (
                      dashboardData.availableBedsList.map((bed) => (
                        <div className="admission-row" key={bed._id}>
                          <div className="patient-avatar" style={{ background: "#dcfce7", color: "#15803d" }}>
                            {bed.bedNumber}
                          </div>
                          <div className="patient-info">
                            <strong>Bed {bed.bedNumber}</strong>
                            <small>{bed.wardName || "Ward"} · Room {bed.roomNumber || "—"} ({bed.bedType})</small>
                          </div>
                          <span className="badge-status badge-available">
                            Ready
                          </span>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            </>
          ) : activePage === "Ward Management" ? (
            <WardManagement />
          ) : activePage === "Room Management" ? (
            <RoomManagement />
          ) : activePage === "Bed Management" ? (
            <BedManagement />
          ) : activePage === "Patients" ? (
            <Patients />
          ) : activePage === "Admissions" ? (
            <Admissions />
          ) : activePage === "Transfers & Discharge" ? (
            <TransfersDischarge />
          ) : activePage === "Reports" ? (
            <Reports />
          ) : activePage === "Settings" ? (
            <Settings />
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default App;
