import { useState, useEffect } from "react";
import {
  Building2,
  User,
  Bell,
  Lock,
  Save,
  Hospital,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "../utils/api";

function Settings() {
  const [hospital, setHospital] = useState(() => {
    const saved = localStorage.getItem("careconnect_hospital_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return {
      name: "CareConnect Super Specialty Hospital",
      email: "administration@careconnect-hospital.org",
      phone: "+91 98765 43210",
      address: "DevOps & Healthcare Center, Academic Year 2026-2027",
    };
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return {
      name: "Portal User",
      email: "user@careconnect.com",
      role: "Admin",
    };
  });

  const [notifications, setNotifications] = useState({
    admissions: true,
    discharges: true,
    bedUpdates: true,
    maintenance: true,
  });

  const [password, setPassword] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const [settingsMessage, setSettingsMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState({ text: "", isError: false });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sync current user profile from server
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await apiFetch("/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        }
      } catch (err) {
        // fallback to localStorage
      }
    };
    fetchMe();
  }, []);

  const handleHospitalChange = (event) => {
    setHospital({
      ...hospital,
      [event.target.name]: event.target.value,
    });
  };

  const handleNotificationChange = (event) => {
    setNotifications({
      ...notifications,
      [event.target.name]: event.target.checked,
    });
  };

  const saveSettings = (event) => {
    event.preventDefault();
    localStorage.setItem("careconnect_hospital_settings", JSON.stringify(hospital));
    setSettingsMessage("Hospital configuration saved successfully!");
    setTimeout(() => setSettingsMessage(""), 4000);
  };

  // Real password change against backend /api/auth/change-password
  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage({ text: "", isError: false });

    if (!password.current || !password.newPassword || !password.confirm) {
      setPasswordMessage({ text: "Please fill in all password fields.", isError: true });
      return;
    }

    if (password.newPassword.length < 6) {
      setPasswordMessage({ text: "New password must contain at least 6 characters.", isError: true });
      return;
    }

    if (password.newPassword !== password.confirm) {
      setPasswordMessage({ text: "New password and confirmation password do not match.", isError: true });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await apiFetch("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: password.current,
          newPassword: password.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update password");
      }

      setPasswordMessage({
        text: "Password updated successfully in database! Use your new password on next login.",
        isError: false,
      });

      setPassword({
        current: "",
        newPassword: "",
        confirm: "",
      });
    } catch (err) {
      setPasswordMessage({
        text: err.message || "Unable to change password.",
        isError: true,
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="settings-management">
      <div className="settings-intro">
        <h3>System Settings</h3>
        <p>Manage hospital institutional details, profile preferences, and account security</p>
      </div>

      <form onSubmit={saveSettings}>
        {/* HOSPITAL INFORMATION PANEL */}
        <div className="panel settings-panel">
          <div className="settings-section-heading">
            <div className="settings-section-icon blue">
              <Building2 size={22} />
            </div>
            <div>
              <h3>Hospital Information</h3>
              <p>Configure institution branding and operational contact details</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <label>
              Hospital Name
              <input
                name="name"
                value={hospital.name}
                onChange={handleHospitalChange}
                required
              />
            </label>

            <label>
              Official Hospital Email
              <input
                type="email"
                name="email"
                value={hospital.email}
                onChange={handleHospitalChange}
                required
              />
            </label>

            <label>
              Contact Number
              <input
                name="phone"
                value={hospital.phone}
                onChange={handleHospitalChange}
                required
              />
            </label>

            <label>
              Hospital Address
              <input
                name="address"
                value={hospital.address}
                onChange={handleHospitalChange}
                required
              />
            </label>
          </div>
        </div>

        {/* LOGGED IN USER PROFILE */}
        <div className="panel settings-panel">
          <div className="settings-section-heading">
            <div className="settings-section-icon purple">
              <User size={22} />
            </div>
            <div>
              <h3>Active Profile Information</h3>
              <p>Current authenticated user role and identity in CareConnect</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <label>
              Account Name
              <input value={currentUser.name || "—"} disabled style={{ background: "#f8fafc" }} />
            </label>

            <label>
              Email Address
              <input value={currentUser.email || "—"} disabled style={{ background: "#f8fafc" }} />
            </label>

            <label>
              Authorized Role
              <input
                value={currentUser.role || "—"}
                disabled
                style={{ background: "#f8fafc", fontWeight: "700", color: "#2563eb" }}
              />
            </label>
          </div>
        </div>

        {/* NOTIFICATION PREFERENCES */}
        <div className="panel settings-panel">
          <div className="settings-section-heading">
            <div className="settings-section-icon green">
              <Bell size={22} />
            </div>
            <div>
              <h3>System Notification Preferences</h3>
              <p>Control live alerts for admissions, discharges, and bed status updates</p>
            </div>
          </div>

          <div className="notification-list">
            <label className="notification-option">
              <div>
                <strong>New Patient Admissions</strong>
                <small>Alert staff whenever an admission is registered.</small>
              </div>
              <input
                type="checkbox"
                name="admissions"
                checked={notifications.admissions}
                onChange={handleNotificationChange}
              />
            </label>

            <label className="notification-option">
              <div>
                <strong>Patient Discharges</strong>
                <small>Trigger bed sanitization alert when a patient is discharged.</small>
              </div>
              <input
                type="checkbox"
                name="discharges"
                checked={notifications.discharges}
                onChange={handleNotificationChange}
              />
            </label>

            <label className="notification-option">
              <div>
                <strong>Bed Availability Updates</strong>
                <small>Notify reception when beds transition to Available status.</small>
              </div>
              <input
                type="checkbox"
                name="bedUpdates"
                checked={notifications.bedUpdates}
                onChange={handleNotificationChange}
              />
            </label>

            <label className="notification-option">
              <div>
                <strong>Cleaning & Maintenance Alerts</strong>
                <small>Notify nursing staff of beds pending cleaning or repair.</small>
              </div>
              <input
                type="checkbox"
                name="maintenance"
                checked={notifications.maintenance}
                onChange={handleNotificationChange}
              />
            </label>
          </div>
        </div>

        <div className="settings-save-area">
          {settingsMessage && (
            <span className="settings-success" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={16} />
              {settingsMessage}
            </span>
          )}

          <button type="submit" className="settings-save-button">
            <Save size={17} />
            Save Hospital Settings
          </button>
        </div>
      </form>

      {/* REAL PASSWORD CHANGE (CONNECTED TO BACKEND BCRYPT) */}
      <div className="panel settings-panel password-panel" style={{ marginTop: "24px" }}>
        <div className="settings-section-heading">
          <div className="settings-section-icon orange">
            <Lock size={22} />
          </div>
          <div>
            <h3>Account Security: Change Password</h3>
            <p>Update your password with cryptographic bcrypt hashing on the backend</p>
          </div>
        </div>

        {passwordMessage.text && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: passwordMessage.isError ? "#fef2f2" : "#f0fdf4",
              color: passwordMessage.isError ? "#dc2626" : "#15803d",
              border: `1px solid ${passwordMessage.isError ? "#fecaca" : "#bbf7d0"}`,
            }}
          >
            {passwordMessage.isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={changePassword}>
          <div className="settings-form-grid">
            <label>
              Current Password *
              <input
                type="password"
                value={password.current}
                onChange={(e) => setPassword({ ...password, current: e.target.value })}
                placeholder="Enter current password"
                required
              />
            </label>

            <label>
              New Password (min 6 chars) *
              <input
                type="password"
                value={password.newPassword}
                onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                placeholder="Enter new password"
                required
              />
            </label>

            <label>
              Confirm New Password *
              <input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                placeholder="Confirm new password"
                required
              />
            </label>
          </div>

          <button
            type="submit"
            className="settings-password-button"
            disabled={passwordLoading}
          >
            <Lock size={16} />
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;
