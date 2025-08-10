import React, { useEffect, useState } from "react";
import "../styles/OrderListPage.css";

const OrderListPage = ({ isSidebarOpen }) => {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalOrderId, setModalOrderId] = useState(null);
  const [error, setError] = useState("");

  const statuses = [
    "pending",
    "brief uploaded",
    "waiting for 3d",
    "design phase",
    "prova uploaded",
    "approved",
    "production files uploaded",
    "images uploaded",
    "invoice uploaded",
  ];

  useEffect(() => {
    fetchOrdersByStatus(selectedStatus);
  }, [selectedStatus]);

  const fetchOrdersByStatus = async (status) => {
    try {
      setLoading(true);
      setError("");
      const url = `https://arkanaltafawuq.com/arkan-system/get_orders_by_status.php?status=${encodeURIComponent(
        status
      )}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        setOrders([]);
        setError("No orders found for this status.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProva = async (orderId) => {
    const user = JSON.parse(localStorage.getItem("loggedUser"));
    try {
      const response = await fetch(
        "https://arkanaltafawuq.com/arkan-system/approve_prova.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            approved_by: user?.username || "system",
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("✅ Prova approved. Status updated to 'approved'");
        fetchOrdersByStatus(selectedStatus);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Request failed.");
      console.error(err);
    }
    setShowModal(false);
  };

  const handleFileUpload = async (orderId, file, field) => {
    const formData = new FormData();
    formData.append("order_id", orderId);
    formData.append("field", field);
    formData.append("file", file);

    const user = JSON.parse(localStorage.getItem("loggedUser"));
    if (user && user.username) {
      formData.append("assigned_to", user.username);
    }

    try {
      const res = await fetch(
        "https://arkanaltafawuq.com/arkan-system/upload_order_file.php",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (data.success) {
        alert(`✅ File uploaded. New status: ${data.new_status}`);
        fetchOrdersByStatus(selectedStatus);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Upload failed.");
    }
  };

  const renderUploadInput = (order, fileKey) => {
    return (
      <td className="table-cell">
        <input
          type="file"
          onChange={(e) => {
            if (e.target.files.length > 0) {
              handleFileUpload(order.order_id, e.target.files[0], fileKey);
            }
          }}
          className="form-input"
        />
        {order[fileKey] && (
          <div className="file-link">
            <a
              href={`https://arkanaltafawuq.com/arkan-system/${order[fileKey]}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="field-icon">📄</span> View
            </a>
          </div>
        )}
      </td>
    );
  };

  return (
    <div className={`order-page ${isSidebarOpen ? "shifted" : ""}`}>
      <h2 className="order-title">📦 Order List</h2>

      {error && <div className="error-message">❌ {error}</div>}

      <div className="status-buttons">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`status-button ${
              selectedStatus === status ? "active" : ""
            }`}
          >
            {status}
          </button>
        ))}
        <button
          onClick={() => fetchOrdersByStatus(selectedStatus)}
          className="form-button refresh-button"
        >
          <span className="button-icon">🔄</span> Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <span className="spinner"></span> Loading...
        </div>
      ) : orders.length === 0 ? (
        <p className="no-orders">No orders found for this status.</p>
      ) : (
        <div className="table-container">
          <table className="order-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Status</th>
                <th>Brief</th>
                <th>3D</th>
                <th>Prova</th>
                <th>Production</th>
                <th>Images</th>
                <th>Invoice</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id}>
                  <td className="table-cell">{order.order_id}</td>
                  <td className="table-cell">
                    {order.client_name || order.client_id}
                  </td>
                  <td className="table-cell">{order.status}</td>
                  {renderUploadInput(order, "brief_file")}
                  {renderUploadInput(order, "d3_file")}
                  {renderUploadInput(order, "prova_file")}
                  {renderUploadInput(order, "production_file")}
                  {renderUploadInput(order, "final_images")}
                  {renderUploadInput(order, "invoice_file")}
                  <td className="table-cell">{order.created_by}</td>
                  <td className="table-cell">{order.created_at}</td>
                  <td className="table-cell">
                    {order.status === "prova uploaded" && (
                      <button
                        onClick={() => {
                          setModalOrderId(order.order_id);
                          setShowModal(true);
                        }}
                        className="form-button approve-button"
                      >
                        <span className="button-icon">✅</span> Approve Prova
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3 className="modal-title">Confirm Prova Approval</h3>
            <p>
              Are you sure you want to approve the prova for order{" "}
              {modalOrderId}?
            </p>
            <div className="modal-buttons">
              <button
                onClick={() => handleApproveProva(modalOrderId)}
                className="form-button submit-button"
              >
                <span className="button-icon">✔️</span> Confirm
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="form-button cancel-button"
              >
                <span className="button-icon">✖️</span> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderListPage;
