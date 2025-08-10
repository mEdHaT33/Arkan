import React, { useEffect, useState } from "react";

const DesignerManagerPage = () => {
  const [orders, setOrders] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("design phase");
  const statuses = ["design phase", "waiting for 3d", "approved"];

  useEffect(() => {
    fetchOrdersByStatus(selectedStatus);
    fetchDesigners();
  }, [selectedStatus]);

  const fetchOrdersByStatus = async (status) => {
    const res = await fetch(
      `https://arkanaltafawuq.com/arkan-system/get_designer_orders.php?status=${status}`
    );
    const data = await res.json();
    if (data.success) setOrders(data.orders);
  };

  const fetchDesigners = async () => {
    const res = await fetch(
      "https://arkanaltafawuq.com/arkan-system/get_designers.php"
    );
    const data = await res.json();
    if (data.success) setDesigners(data.users);
  };

  const assignDesigner = async (orderId, username) => {
    if (!username) return;
    const res = await fetch(
      "https://arkanaltafawuq.com/arkan-system/assign_designer.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          designer_username: username,
        }),
      }
    );
    const data = await res.json();
    if (data.success) fetchOrdersByStatus(selectedStatus);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🎨 Designer Manager Page</h2>

      <div
        style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}
      >
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            style={{
              padding: "8px 15px",
              background: selectedStatus === status ? "#333" : "#ccc",
              color: selectedStatus === status ? "white" : "black",
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <p>No orders found for this status.</p>
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
              <th>Assign Designer</th>
              <th>Assigned To</th>
              <th>Created By</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_id}>
                <td>{order.order_id}</td>
                <td>{order.status}</td>
                <td>
                  <select
                    value={order.designer_assigned_to || ""}
                    onChange={(e) =>
                      assignDesigner(order.order_id, e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    {designers.map((d) => (
                      <option key={d.username} value={d.username}>
                        {d.username}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{order.designer_assigned_to || "-"}</td>
                <td>{order.created_by}</td>
                <td>{order.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DesignerManagerPage;
