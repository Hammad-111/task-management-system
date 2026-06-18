import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await login(username.trim(), password);
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("username", username.trim());
      navigate("/dashboard");
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
        <p className="subtitle">sign in to continue</p>

        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Username or Email</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary">Login</button>
        </form>

        <p className="auth-link">
          no account? <Link to="/register">register here</Link>
        </p>
      </div>
    </div>
  );
}
