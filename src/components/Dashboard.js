import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const roleAvatars = {
  admin: "🛡️",
  user: "👤",
  manager: "📋",
  guest: "👀",
};

const roleDescriptions = {
  admin: "You have full access to all system features and settings.",
  user: "You can view and manage your own data and profile.",
  manager: "You can oversee users and generate reports.",
  guest: "You have limited access. Please contact admin for more privileges.",
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      navigate("/login");
    }
    setUsername(localStorage.getItem("username") || "");
    setRole(localStorage.getItem("role") || "guest");
    setAnimate(true);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };



  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.2)",
          padding: "2.5rem 3rem",
          textAlign: "center",
          minWidth: "400px",
          minHeight: "520px",
          transform: animate ? "scale(1)" : "scale(0.9)",
          opacity: animate ? 1 : 0,
          transition: "all 0.6s cubic-bezier(.68,-0.55,.27,1.55)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
            {roleAvatars[role] || "👋"}
          </div>
          <h2 style={{ margin: "0 0 0.5rem", color: "#333" }}>
            {getGreeting()}, {username || "Guest"}!
          </h2>
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            <strong>Your Role:</strong> {role.charAt(0).toUpperCase() + role.slice(1)}
          </p>
          <p style={{ color: "#888", marginBottom: "1.5rem", fontStyle: "italic" }}>
            {roleDescriptions[role] || "Welcome to your dashboard."}
          </p>
          
        </div>
        <div>
          <button
            onClick={handleLogout}
            style={{
              background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 2rem",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(102,126,234,0.15)",
              transition: "background 0.3s",
              marginTop: "1.5rem",
            }}
          >
            Logout
          </button>
          <div style={{ marginTop: "2rem", color: "#aaa", fontSize: "0.95rem" }}>
            Need help? <a href="mailto:support@example.com" style={{ color: "#667eea" }}>Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
