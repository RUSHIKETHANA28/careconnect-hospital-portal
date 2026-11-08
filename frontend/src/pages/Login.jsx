import { useState } from "react";
import { Activity, Lock, Mail, Eye, EyeOff, AlertCircle, LogIn, UserPlus, Shield } from "lucide-react";
import { BASE_URL } from "../utils/api";

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Receptionist");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isRegister ? `${BASE_URL}/auth/register` : `${BASE_URL}/auth/login`;
      const payload = isRegister
        ? { name: name.trim(), email: email.trim(), password, role }
        : { email: email.trim(), password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (isRegister ? "Registration failed" : "Invalid email or password"));
      }

      if (!data.token || !data.user) {
        throw new Error("Invalid response received from server");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Failed to connect to the authentication server");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (demoEmail, demoPassword) => {
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-badge">
            <Activity size={32} />
          </div>
          <h1>
            Care<span>Connect</span>
          </h1>
          <p className="login-subtitle">
            {isRegister
              ? "Register New Clinical / Administrative Staff Account"
              : "Hospital Bed Availability & Admission Management Portal"}
          </p>
        </div>

        {error && (
          <div className="login-error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label htmlFor="reg-name">Full Name *</label>
                <div className="input-with-icon">
                  <span className="input-icon-left">
                    <UserPlus size={18} />
                  </span>
                  <input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Rao / Nurse Sunita"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-role">Staff Role *</label>
                <div className="input-with-icon">
                  <span className="input-icon-left">
                    <Shield size={18} />
                  </span>
                  <select
                    id="reg-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 42px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: "10px",
                      fontSize: "14px",
                      background: "#ffffff",
                    }}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Hospital Administrator">Hospital Administrator</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Nurse">Nurse</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="login-email">Email Address *</label>
            <div className="input-with-icon">
              <span className="input-icon-left">
                <Mail size={18} />
              </span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hospital.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password (min 6 chars) *</label>
            <div className="input-with-icon">
              <span className="input-icon-left">
                <Lock size={18} />
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Processing...</span>
            ) : isRegister ? (
              <>
                <UserPlus size={18} />
                <span>Register Staff Account</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In to Portal</span>
              </>
            )}
          </button>

          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#2563eb",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {isRegister
                ? "Already have an account? Sign In"
                : "New staff member? Register an account"}
            </button>
          </div>
        </form>

        {!isRegister && (
          <div className="demo-accounts-section">
            <p className="demo-accounts-label">Demo Role Accounts (Click to Auto-fill)</p>
            <div className="demo-chips-grid">
              <button
                type="button"
                className="demo-chip"
                onClick={() => handleDemoSelect("admin@careconnect.com", "admin123")}
              >
                <strong>Admin</strong>
                <small>admin@careconnect.com</small>
              </button>

              <button
                type="button"
                className="demo-chip"
                onClick={() => handleDemoSelect("admin.hosp@careconnect.com", "admin123")}
              >
                <strong>Hospital Admin</strong>
                <small>admin.hosp@careconnect.com</small>
              </button>

              <button
                type="button"
                className="demo-chip"
                onClick={() => handleDemoSelect("receptionist@careconnect.com", "admin123")}
              >
                <strong>Receptionist</strong>
                <small>receptionist@careconnect.com</small>
              </button>

              <button
                type="button"
                className="demo-chip"
                onClick={() => handleDemoSelect("nurse@careconnect.com", "admin123")}
              >
                <strong>Nurse</strong>
                <small>nurse@careconnect.com</small>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
