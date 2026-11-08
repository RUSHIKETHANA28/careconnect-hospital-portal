import { useState } from "react";
import { Activity, Lock, Mail, Eye, EyeOff, AlertCircle, LogIn } from "lucide-react";
import { BASE_URL } from "../utils/api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    if (event) event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password");
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
            Hospital Bed Availability & Admission Management Portal
          </p>
        </div>

        {error && (
          <div className="login-error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
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
            <label htmlFor="login-password">Password</label>
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
                autoComplete="current-password"
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
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In to Portal</span>
              </>
            )}
          </button>
        </form>

        <div className="demo-accounts-section">
          <p className="demo-accounts-label">Demo Role Accounts (Click to Fill)</p>
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
      </div>
    </div>
  );
}

export default Login;
