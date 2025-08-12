// components/DesignerTeamPage.jsx
import React, { useEffect, useState } from "react";

const API_BASE = "https://arkanaltafawuq.com/arkan-system"; // no trailing slash
const api = (p) => `${API_BASE}/${String(p).replace(/^\/+/, "")}`;

// Only these four stages
const EDITABLE_STATUSES = [
  "quotation uploaded",
  "waiting for 3d",
  "design phase",
  "approved",
];

const DesignerTeamPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState("design phase");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "";
    const storedRole = localStorage.getItem("role") || "";
    setUsername(storedUsername);
    setRole(storedRole);
    if (storedUsername) fetchOrders(storedUsername);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  const fetchOrders = async (user) => {
    try {
      setError("");
      const res = await fetch(
        api(`get_designer_team_orders.php?username=${encodeURIComponent(user)}`)
      );
      const data = await res.json();
      if (data.success) {
        const list = Array.isArray(data.orders) ? data.orders : [];
        // keep only assigned + one of the 4 statuses + matches selected tab
        const relevant = list.filter((o) => {
          const s = (o.status || "").toLowerCase();
          return EDITABLE_STATUSES.includes(s) && s === selectedTab.toLowerCase();
        });
        setOrders(relevant);
      } else {
        setOrders([]);
        setError(data.message || "No orders found.");
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrders([]);
      setError("Failed to fetch orders.");
    }
  };

  const getFieldForTab = () => {
    const tab = selectedTab.toLowerCase();
    if (tab === "quotation uploaded" || tab === "waiting for 3d") return "d3_file";
    if (tab === "design phase") return "prova_file";
    if (tab === "approved") return "production_file";
    return null;
  };

  const handleFileUpload = async (orderId, field, file) => {
    if (!file || !field) return;
    const formData = new FormData();
    formData.append("order_id", orderId);
    formData.append("field", field);
    formData.append("file", file);
    formData.append("assigned_to", username);

    try {
      const res = await fetch(api("upload_order_file.php"), {
        method: "POST",
        body: formData,
      });
      const raw = await res.text();
      let data;
      try { data = JSON.parse(raw); } catch { data = null; }
      if (res.ok && data?.success) {
        fetchOrders(username); // refresh
      } else {
        const msg = (data && data.message) ? data.message : raw.slice(0, 300) || "Upload failed.";
        alert(`Upload failed: ${msg}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload error.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🧑‍🎨 Designer Team Page</h2>
      <p>
        Logged in as: <strong>{username}</strong> {role ? `(Role: ${role})` : ""}
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {EDITABLE_STATUSES.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            style={{
              padding: "8px 15px",
              background: selectedTab === tab ? "#333" : "#ccc",
              color: selectedTab === tab ? "white" : "black",
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
            }}
            title={`Show "${tab}" assigned to you`}
          >
            {tab}
          </button>
        ))}
        <button
          onClick={() => username && fetchOrders(username)}
          style={{
            padding: "8px 15px",
            background: "#0ea5e9",
            color: "white",
            borderRadius: 4,
            border: "none",
            cursor: "pointer",
          }}
          title="Refresh"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#ffe6e6",
            border: "1px solid #ffcccc",
            color: "#a40000",
            padding: "10px 12px",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <p>No orders in this tab.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Upload</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const field = getFieldForTab();
              return (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{order.status}</td>
                  <td>
                    {field ? (
                      <input
                        type="file"
                        onChange={(e) =>
                          handleFileUpload(order.order_id, field, e.target.files?.[0])
                        }
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{order.created_at || "N/A"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DesignerTeamPage;
