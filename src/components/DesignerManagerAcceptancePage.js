// components/DesignerManagerAcceptancePage.jsx
import React, { useEffect, useState } from "react";

const DesignerManagerAcceptancePage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState(
    "3d file done - sent to design manager"
  );
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "";
    const storedRole = localStorage.getItem("role") || "";
    setUsername(storedUsername);
    setRole(storedRole);
    fetchOrders();
  }, [selectedTab]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(
        `https://arkanaltafawuq.com/arkan-system/get_orders_by_status.php?status=${encodeURIComponent(
          selectedTab
        )}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const handleStatusUpdate = async (orderId, action) => {
    try {
      const res = await fetch(
        "https://arkanaltafawuq.com/arkan-system/update_order_status.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            order_id: orderId,
            action: action === "approve" ? "accept" : "edit",
          }),
        }
      );
      const data = await res.json();
      if (data.success) fetchOrders();
      else console.error("Status update error:", data);
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🎨 Designer Manager Acceptance Page</h2>
      <p>
        Logged in as: <strong>{username}</strong> (Role: {role})
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          "3d file done - sent to design manager",
          "prova file done - sent to design manager",
          "production file done - sent to design manager",
        ].map((tab) => (
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
          >
            {tab}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <p>No orders in this tab.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>File</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              let fileLink = "";
              if (selectedTab.includes("3d")) fileLink = order.d3_file;
              if (selectedTab.includes("prova")) fileLink = order.prova_file;
              if (selectedTab.includes("production")) fileLink = order.production_file;

              return (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{order.status}</td>
                  <td>
                    {fileLink ? (
                      <a
                        href={`https://arkanaltafawuq.com/arkan-system/${fileLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View PDF
                      </a>
                    ) : (
                      "No File"
                    )}
                  </td>
                  <td>{order.created_at || "N/A"}</td>
                  <td>
                    <button
                      onClick={() => handleStatusUpdate(order.order_id, "approve")}
                      style={{ marginRight: 10 }}
                    >
                      ✅ Approve
                    </button>
                    <button onClick={() => handleStatusUpdate(order.order_id, "needs_edit")}>
                      ❌ Needs Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DesignerManagerAcceptancePage;
