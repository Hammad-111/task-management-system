import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await register(username.trim(), email.trim(), password);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <button className="theme-toggle" onClick={() => {
        const d = document.documentElement.getAttribute("data-theme") === "dark";
        const t = d ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", t);
        localStorage.setItem("theme", t);
      }}>Theme</button>

      <div className="auth-box">
        <h1>Task Manager</h1>
        <p className="subtitle">create your account</p>

        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button className="btn btn-primary">Register</button>
        </form>

        <p className="auth-link">
          already registered? <Link to="/login">login</Link>
        </p>
      </div>
    </div>
  );
}
