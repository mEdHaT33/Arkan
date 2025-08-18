// components/DesignerTeamPage.jsx
import React, { useEffect, useState } from "react";

const API_BASE = "https://arkanaltafawuq.com/arkan-system"; // no trailing slash
const api = (p) => `${API_BASE}/${String(p).replace(/^\/+/, "")}`;

const STATUSES = [
  "All",
  "quotation uploaded",
  "waiting for 3d",
  "design phase",
  "approved",
];

const normalize = (v) => String(v || "").trim().toLowerCase();

const DesignerTeamPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("design phase");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  // Resolve username from either "username" or "loggedUser"
  const resolveUsername = () => {
    const u1 = localStorage.getItem("username") || "";
    if (u1) return u1;
    try {
      const obj = JSON.parse(localStorage.getItem("loggedUser") || "{}");
      if (obj && obj.username) return obj.username;
    } catch {}
    return "";
  };

  useEffect(() => {
    const u = resolveUsername();
    setUsername(u);
    if (u) fetchOrders(u, selectedStatus);
    else {
      setOrders([]);
      setError("No username in localStorage. Please ensure login sets either 'username' or 'loggedUser.username'.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const fetchOrders = async (user, status) => {
    try {
      setError("");
      const res = await fetch(
        api(`get_designer_team_orders.php?username=${encodeURIComponent(user)}`)
      );
      const data = await res.json();

      if (!data?.success) {
        setOrders([]);
        setError(data?.message || "No orders found.");
        return;
      }

      const list = Array.isArray(data.orders) ? data.orders : [];
      const wanted = normalize(status);

      // Normalize each order status once
      const filtered =
        wanted === "all"
          ? list
          : list.filter((o) => normalize(o.status) === wanted);

      setOrders(filtered);
      if (filtered.length === 0 && list.length > 0 && wanted !== "all") {
        // Helpful hint if the tab is empty but API has data
        setError(
          `No orders in "${status}". Try other tabs or "All" to verify data is loading.`
        );
      }
    } catch (e) {
      console.error("Failed to fetch orders:", e);
      setOrders([]);
      setError("Failed to fetch orders.");
    }
  };

  const fieldForStatus = (status) => {
    const s = normalize(status);
    if (s === "quotation uploaded" || s === "waiting for 3d") return "d3_file";
    if (s === "design phase") return "prova_file";
    if (s === "approved") return "production_file";
    return null;
  };

  const handleUpload = async (orderId, field, file) => {
    if (!file || !field || !username) return;

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
      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch {}
      if (res.ok && data?.success) {
        fetchOrders(username, selectedStatus);
      } else {
        alert(`Upload failed: ${(data && data.message) || text.slice(0, 300) || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Upload error:", e);
      alert("Upload error.");
    }
  };

  const fieldForCurrentTab = fieldForStatus(selectedStatus);

  return (
    <div style={{ padding: 20 }}>
      <h2>🧑‍🎨 Designer Team Page</h2>
      <p>
        Logged in as: <strong>{username || "—"}</strong>
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedStatus(s)}
            style={{
              padding: "8px 15px",
              background: selectedStatus === s ? "#333" : "#ccc",
              color: selectedStatus === s ? "white" : "black",
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
            }}
            title={`Show "${s}" assigned to you`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => username && fetchOrders(username, selectedStatus)}
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
            {orders.map((o) => (
              <tr key={o.order_id}>
                <td>{o.order_id}</td>
                <td>{o.status}</td>
                <td>
                  {fieldForCurrentTab ? (
                    <input
                      type="file"
                      onChange={(e) =>
                        handleUpload(o.order_id, fieldForCurrentTab, e.target.files?.[0])
                      }
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td>{o.created_at || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DesignerTeamPage;
