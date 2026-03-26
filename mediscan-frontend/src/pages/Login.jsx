import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ DEMO LOGIN ACCOUNT
  const handleLogin = (e) => {
    e.preventDefault();

    if (form.email === "demo@mediscan.com" && form.password === "123456") {
      navigate("/dashboard"); // later route
    } else {
      setError("Invalid credentials. Try demo account.");
    }
  };

  const handleGuest = () => {
    navigate("/dashboard");
  };

  return (
    <div className="login-container">
      {/* LEFT PANEL */}
      <div className="login-left">
        <div className="left-content">
          <div className="logo-box">
            <div className="logo-icon">+</div>
          </div>

          <h1>Your Digital Health Companion</h1>

          <p>
            Access your medical records, scan symptoms, and connect with
            professionals in one secure place.
          </p>

          <div className="feature-row">
            <div className="feature-card">🔒 Secure Data</div>
            <div className="feature-card">⚡ Instant Results</div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <div className="login-form-wrapper">

          <h2>Welcome back</h2>
          <p>Please enter your details to sign in</p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <Lock size={18} />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div className="error">{error}</div>}

            <button className="login-btn">Login</button>
          </form>

          <div className="divider">OR</div>

          <button className="guest-btn" onClick={handleGuest}>
            Continue as Guest
          </button>

          <p className="register-text">
            Don't have an account? <span>Register now</span>
          </p>

          <div className="demo-note">
            Demo Login → demo@mediscan.com / 123456
          </div>
        </div>
      </div>
    </div>
  );
}