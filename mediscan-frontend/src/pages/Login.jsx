import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import "../styles/Login.css";

import { signIn, signUp } from "../api/authApi";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError("");

    const { data, error } = await signUp(
      form.email,
      form.password,
      form.name
    );

    if (error) {
      setError(error.message);
    } else {
      login(data.user);
      navigate("/dashboard");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const { data, error } = await signIn(form.email, form.password);

    if (error) {
      setError(error.message);
    } else {
      login(data.user);
      navigate("/dashboard");
    }

  };

  const handleGuest = () => {
    navigate("/dashboard");
  };

  return (
    <div className="login-container">
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

      <div className="login-right">
        <div className="login-form-wrapper">

          <h2>Welcome back</h2>
          <p>Please enter your details to sign in</p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
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
            Don't have an account?{" "}
            <span onClick={handleRegister} style={{ cursor: "pointer" }}>
              Register now
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}