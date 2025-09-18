import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "https://arkanaltafawuq.com/arkan-system/login.php",
        {
          method: "POST",
          credentials: 'include',  // This is crucial for sending/receiving cookies
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();
      console.log("Login response:", data);

      if (data.success) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role);

        navigate("/dashboard");
      } else {
        alert("❌ Login failed: " + data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("❌ Server error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Arkan System Login</h2>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
