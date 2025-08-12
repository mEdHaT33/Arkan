// components/FinancePage.jsx
import React, { useEffect, useState } from "react";

const API = "https://arkanaltafawuq.com/arkan-system";

const FinancePage = () => {
  const [orders, setOrders] = useState([]);
  const [fileUploads, setFileUploads] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchReadyForInvoice = async () => {
    try {
      setLoading(true);
      setErr("");
      // 🔎 Use the status you asked for: "images uploaded"
      const res = await fetch(
        `${API}/get_orders_by_status.php?status=${encodeURIComponent("images uploaded")}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error(e);
      setErr("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadyForInvoice();
  }, []);

  const onFilePick = (orderId, file) => {
    setFileUploads((prev) => ({ ...prev, [orderId]: file }));
  };

  const uploadInvoice = async (orderId) => {
    const file = fileUploads[orderId];
    if (!file) {
      alert("Please choose a PDF first.");
      return;
    }

    const fd = new FormData();
    fd.append("order_id", orderId);
    // 👇 important: use your existing endpoint + field name
    fd.append("field", "invoice_file");
    fd.append("file", file);
    // optional: who did it
    fd.append("assigned_to", localStorage.getItem("username") || "finance");

    try {
      const res = await fetch(`${API}/upload_order_file.php`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        // Backend sets status to "invoice uploaded" automatically
        alert("✅ Invoice uploaded");
        // Remove the order from this list (no longer "images uploaded")
        setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
        setFileUploads((prev) => {
          const copy = { ...prev };
          delete copy[orderId];
          return copy;
        });
      } else {
        alert("❌ " + (data.message || "Upload failed"));
      }
    } catch (e) {
      console.error(e);
      alert("❌ Network error");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>💵 Finance — Orders Ready for Invoice</h2>
      {err && <div style={{ color: "red", marginBottom: 10 }}>{err}</div>}
      <div style={{ marginBottom: 12 }}>
        <button onClick={fetchReadyForInvoice} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {orders.length === 0 ? (
        <p>No orders with status “images uploaded”.</p>
      ) : (
        <table border="1" cellPadding="8" width="100%">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Final Images</th>
              <th>Client</th>
              <th>Created By</th>
              <th>Created At</th>
              <th>Upload Invoice (PDF)</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.order_id}>
                <td>{o.order_id}</td>
                <td>{o.status}</td>
                <td>
                  {o.final_images ? (
                    <a
                      href={`${API}/${o.final_images}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Images PDF
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>{o.client_name || o.client_id}</td>
                <td>{o.created_by || "-"}</td>
                <td>{o.created_at || "-"}</td>
                <td>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      e.target.files[0] && onFilePick(o.order_id, e.target.files[0])
                    }
                    style={{ marginRight: 8 }}
                  />
                  <button onClick={() => uploadInvoice(o.order_id)}>
                    Upload Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FinancePage;





