// components/CreateOrderPage.jsx
import React, { useEffect, useState } from "react";
import "../styles/CreateOrderPage.css";

const CreateOrderPage = ({ isSidebarOpen }) => {
  const [clients, setClients] = useState([]);
  const [orderData, setOrderData] = useState({ client_id: "", has_3d: false });
  const [files, setFiles] = useState({
    brief_file: null,
    quotation_file: null,
    production_file: null,  // (link is preferred later by team; AM can still upload if needed)
    final_images: null,
    invoice_file: null,
    d3_file: null,
    prova_file: null,
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("https://arkanaltafawuq.com/arkan-system/get_clients.php");
        const data = await response.json();
        if (data.success) setClients(data.clients);
      } catch (err) {
        console.error("❌ Error fetching clients", err);
        setError("Failed to load clients. Please try again.");
      }
    };
    fetchClients();
  }, []);

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleReset = () => {
    setOrderData({ client_id: "", has_3d: false });
    setFiles({
      brief_file: null,
      quotation_file: null,
      production_file: null,
      final_images: null,
      invoice_file: null,
      d3_file: null,
      prova_file: null,
    });
    setStatus("");
    setError("");
    document.querySelectorAll('input[type="file"]').forEach((input) => (input.value = ""));
  };

  const handleSubmit = () => {
    if (!orderData.client_id) {
      setError("Please select a client.");
      return;
    }
    if (
      !files.brief_file &&
      !files.quotation_file &&
      !files.d3_file &&
      !files.prova_file &&
      !files.production_file &&
      !files.final_images &&
      !files.invoice_file
    ) {
      setError("At least one file must be uploaded.");
      return;
    }
    setShowModal(true);
  };

  const confirmSubmit = async () => {
    setShowModal(false);
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("client_id", orderData.client_id);
    formData.append("has_3d", orderData.has_3d ? "1" : "0");
    formData.append("created_by", localStorage.getItem("username"));

    for (const key in files) {
      if (files[key]) formData.append(key, files[key]);
    }

    try {
      const response = await fetch("https://arkanaltafawuq.com/arkan-system/create_order.php", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      console.log("🔍 Raw response:", text);
      const data = JSON.parse(text);

      if (data.success) {
        alert("✅ Order Created Successfully!");
        setStatus(data.status);
        handleReset();
      } else {
        setError("Error: " + data.message);
      }
    } catch (err) {
      console.error("❌ Network or Server error:", err);
      setError("Network or Server error");
    }

    setLoading(false);
  };

  return (
    <div className={`order-page ${isSidebarOpen ? "shifted" : ""}`}>
      <h2 className="order-title">Create New Order</h2>
      {error && <div className="error-message">❌ {error}</div>}

      <div className="form-group">
        <div className="form-field">
          <label className="form-label">Select Client</label>
          <select
            value={orderData.client_id}
            onChange={(e) => setOrderData({ ...orderData, client_id: e.target.value })}
            className="form-select"
          >
            <option value="">-- Select Client --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">
            <input
              type="checkbox"
              checked={orderData.has_3d}
              onChange={(e) => setOrderData({ ...orderData, has_3d: e.target.checked })}
              className="form-checkbox"
            />
            Client has 3D ready
          </label>
        </div>

        <div className="form-field">
          <label className="form-label"><span ></span> Upload Brief File</label>
          <input type="file" name="brief_file" onChange={handleFileChange} className="form-input" />
        </div>
 <div className="form-field">
            <label className="form-label"> Upload Quotation File</label>
            <input type="file" name="quotation_file" onChange={handleFileChange} className="form-input" />
          </div>
           <div className="form-field">
            <label className="form-label">Upload 3D File</label>
            <input type="file" name="d3_file" onChange={handleFileChange} className="form-input" />
          </div>
        {/* {orderData.has_3d ? (
          <div className="form-field">
            <label className="form-label"><span className="field-icon">💸</span> Upload Quotation File</label>
            <input type="file" name="quotation_file" onChange={handleFileChange} className="form-input" />
          </div>
        ) : (
          <div className="form-field">
            <label className="form-label"><span className="field-icon">🖼️</span> Upload 3D File</label>
            <input type="file" name="d3_file" onChange={handleFileChange} className="form-input" />
          </div>
        )} */}

        <div className="form-field">
          <label className="form-label"> Upload Prova File</label>
          <input type="file" name="prova_file" onChange={handleFileChange} className="form-input" />
        </div>

        <div className="form-field">
          <label className="form-label">Upload Production File</label>
          <input type="file" name="production_file" onChange={handleFileChange} className="form-input" />
        </div>

        <div className="form-field">
          <label className="form-label"> Upload Final Images</label>
          <input type="file" name="final_images" onChange={handleFileChange} className="form-input" />
        </div>

        <div className="form-field">
          <label className="form-label"> Upload Invoice File</label>
          <input type="file" name="invoice_file" onChange={handleFileChange} className="form-input" />
        </div>

        <div className="form-buttons">
          <button onClick={handleSubmit} disabled={loading} className="form-button submit-button">
        
            {loading ? <span className="spinner"></span> : "Create Order"}
          </button>
          <button onClick={handleReset} disabled={loading} className="form-button reset-button">
            <span className="button-icon">🔄</span> Reset
          </button>
        </div>
      </div>

      {status && <div className="order-status"> Order Status: {status}</div>}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3 className="modal-title">Confirm Order Submission</h3>
            <p>Are you sure you want to create this order?</p>
            <div className="modal-buttons">
              <button onClick={confirmSubmit} className="form-button submit-button">
                <span className="button-icon">✔️</span> Confirm
              </button>
              <button onClick={() => setShowModal(false)} className="form-button cancel-button">
                <span className="button-icon">✖️</span> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrderPage;
