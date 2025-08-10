// ✅ React Frontend - DesignerTeamPage.jsx (With Correct LocalStorage and Debug)
import React, { useEffect, useState } from "react";

const DesignerTeamPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState("design phase");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "";
    const storedRole = localStorage.getItem("role") || "";
    setUsername(storedUsername);
    setRole(storedRole);
    fetchOrders(storedUsername);
  }, [selectedTab]);

  const fetchOrders = async (user) => {
    try {
      console.log("Fetching orders for username:", user);
      const res = await fetch(
        `https://arkanaltafawuq.com/arkan-system/get_designer_team_orders.php?username=${user}`
      );
      const data = await res.json();
      console.log("Received orders:", data);
      if (data.success) {
        const relevant = data.orders.filter(
          (order) => order.status === selectedTab
        );
        setOrders(relevant);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const handleFileUpload = async (orderId, field, file) => {
    const formData = new FormData();
    formData.append("order_id", orderId);
    formData.append("field", field);
    formData.append("file", file);

    try {
      const res = await fetch(
        "https://arkanaltafawuq.com/arkan-system/upload_order_file.php",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      console.log("Upload response:", data);
      if (data.success) fetchOrders(username);
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const getFieldForTab = () => {
    switch (selectedTab) {
      case "design phase":
        return "prova_file";
      case "approved":
        return "production_file";
      case "waiting for 3d":
        return "d3_file";
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🧑‍🎨 Designer Team Page</h2>
      <p>
        Logged in as: <strong>{username}</strong> (Role: {role})
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["approved", "design phase", "waiting for 3d"].map((tab) => (
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
        <table
          border="1"
          cellPadding="10"
          style={{ width: "100%", textAlign: "left" }}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Upload</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_id}>
                <td>{order.order_id}</td>
                <td>{order.status}</td>
                <td>
                  {getFieldForTab() ? (
                    <input
                      type="file"
                      onChange={(e) =>
                        handleFileUpload(
                          order.order_id,
                          getFieldForTab(),
                          e.target.files[0]
                        )
                      }
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td>{order.created_at || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DesignerTeamPage;
