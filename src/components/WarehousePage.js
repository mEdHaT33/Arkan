// src/components/WarehousePage.jsx
import React, { useEffect, useMemo, useState } from "react";

const API = "https://arkanaltafawuq.com/arkan-system";

const tiny = {
  btn: {
    padding: "6px 10px",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  input: { padding: 8, borderRadius: 6, border: "1px solid #ddd" },
  card: { border: "1px solid #e5e5e5", borderRadius: 10, padding: 16 },
};

const WarehousePage = () => {
  const [tab, setTab] = useState("stock"); // stock | add | in | out | movements
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add Item form
  const [newItem, setNewItem] = useState({
    item_code: "",
    item_name: "",
    description: "",
    category: "",
    quantity: "", // initial qty
    unit: "pcs",
    purchase_price: "",
    selling_price: "",
    supplier_id: "",
    reorder_level: "",
    location: "",
  });

  // IN form
  const [inForm, setInForm] = useState({
    item_id: "",
    qty: "",
    unit_cost: "",
    supplier_id: "",
    po_number: "",
    note: "",
  });

  // OUT form
  const [outForm, setOutForm] = useState({
    item_id: "",
    qty: "",
    reason: "usage",
    order_id: "",
    note: "",
  });

  // Movements list
  const [inRows, setInRows] = useState([]);
  const [outRows, setOutRows] = useState([]);
  const [filters, setFilters] = useState({
    item_id: "",
    from: "",
    to: "",
    limit: 100,
  });

  const username = localStorage.getItem("username") || "";

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/warehouse_get_items.php`);
      const data = await res.json();
      if (data.success) setItems(Array.isArray(data.items) ? data.items : []);
      else setItems([]);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIn = async () => {
    const qs = new URLSearchParams();
    if (filters.item_id) qs.append("item_id", filters.item_id);
    if (filters.from) qs.append("from", filters.from);
    if (filters.to) qs.append("to", filters.to);
    if (filters.limit) qs.append("limit", filters.limit);
    const res = await fetch(`${API}/warehouse_get_in.php?` + qs.toString());
    const data = await res.json();
    if (data.success) setInRows(data.items || []);
  };

  const fetchOut = async () => {
    const qs = new URLSearchParams();
    if (filters.item_id) qs.append("item_id", filters.item_id);
    if (filters.from) qs.append("from", filters.from);
    if (filters.to) qs.append("to", filters.to);
    if (filters.limit) qs.append("limit", filters.limit);
    const res = await fetch(`${API}/warehouse_get_out.php?` + qs.toString());
    const data = await res.json();
    if (data.success) setOutRows(data.items || []);
  };

  useEffect(() => {
    if (tab === "stock") fetchItems();
    if (tab === "in") { fetchItems(); fetchIn(); }
    if (tab === "out") { fetchItems(); fetchOut(); }
    if (tab === "movements") { fetchIn(); fetchOut(); }
  }, [tab]); // eslint-disable-line

  const addItem = async (e) => {
    e.preventDefault();
    const payload = {
      item_code: newItem.item_code,
      item_name: newItem.item_name,
      description: newItem.description,
      category: newItem.category,
      qty: parseFloat(newItem.quantity || 0),
      unit: newItem.unit,
      purchase_price: parseFloat(newItem.purchase_price || 0),
      selling_price: parseFloat(newItem.selling_price || 0),
      supplier_id: newItem.supplier_id || null,
      reorder_level: parseFloat(newItem.reorder_level || 0),
      location: newItem.location,
    };

    const res = await fetch(`${API}/warehouse_add_item.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      alert("✅ Item added");
      setNewItem({
        item_code: "",
        item_name: "",
        description: "",
        category: "",
        quantity: "",
        unit: "pcs",
        purchase_price: "",
        selling_price: "",
        supplier_id: "",
        reorder_level: "",
        location: "",
      });
      setTab("stock");
      fetchItems();
    } else {
      alert("❌ " + (data.message || "Failed to add item"));
    }
  };

  const addIn = async (e) => {
    e.preventDefault();
    const payload = {
      item_id: parseInt(inForm.item_id, 10),
      qty: parseFloat(inForm.qty || 0),
      unit_cost: inForm.unit_cost === "" ? null : parseFloat(inForm.unit_cost),
      supplier_id: inForm.supplier_id === "" ? null : parseInt(inForm.supplier_id, 10),
      po_number: inForm.po_number || null,
      note: inForm.note || null,
      received_by: username || null,
    };
    const res = await fetch(`${API}/warehouse_add_in.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      alert("✅ Stock IN recorded");
      setInForm({ item_id: "", qty: "", unit_cost: "", supplier_id: "", po_number: "", note: "" });
      fetchItems();
      fetchIn();
    } else {
      alert("❌ " + (data.message || "Failed to add IN"));
    }
  };

  const addOut = async (e) => {
    e.preventDefault();
    const payload = {
      item_id: parseInt(outForm.item_id, 10),
      qty: parseFloat(outForm.qty || 0),
      reason: outForm.reason || "usage",
      order_id: outForm.order_id === "" ? null : parseInt(outForm.order_id, 10),
      note: outForm.note || null,
      issued_by: username || null,
    };
    const res = await fetch(`${API}/warehouse_add_out.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      alert("✅ Stock OUT recorded");
      setOutForm({ item_id: "", qty: "", reason: "usage", order_id: "", note: "" });
      fetchItems();
      fetchOut();
    } else {
      alert("❌ " + (data.message || "Failed to add OUT"));
    }
  };

  const quickAdjust = async (item_id, delta) => {
    if (delta > 0) {
      // Use IN endpoint for +1
      await fetch(`${API}/warehouse_add_in.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id,
          qty: 1,
          unit_cost: null,
          supplier_id: null,
          po_number: "quick-adjust",
          note: delta > 0 ? "quick +1" : "quick -1",
          received_by: username || null,
        }),
      });
    } else {
      // Use OUT endpoint for -1
      await fetch(`${API}/warehouse_add_out.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id,
          qty: 1,
          reason: "adjustment",
          order_id: null,
          note: "quick -1",
          issued_by: username || null,
        }),
      });
    }
    fetchItems();
    if (tab === "movements") { fetchIn(); fetchOut(); }
  };

  // const deleteItem = async (item_id) => {
  //   if (!window.confirm("Delete this item and all its movements?")) return;
  //   const res = await fetch(`${API}/warehouse_delete_item.php`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ id: item_id }),
  //   });
  //   const data = await res.json();
  //   if (data.success) {
  //     fetchItems();
  //     if (tab === "movements") { fetchIn(); fetchOut(); }
  //   } else {
  //     alert("❌ " + (data.message || "Delete failed"));
  //   }
  // };

  const itemsById = useMemo(() => {
    const map = new Map();
    items.forEach((i) => map.set(String(i.item_id), i));
    return map;
  }, [items]);

  return (
    <div style={{ padding: 20 }}>
      <h2>📦 Warehouse</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {["stock", "add", "in", "out", "movements"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...tiny.btn,
              background: tab === t ? "#333" : "#ccc",
              color: tab === t ? "#fff" : "#000",
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* STOCK */}
      {tab === "stock" && (
        <div>
          <div style={{ marginBottom: 10 }}>
            <button
              style={{ ...tiny.btn, background: "#f3f3f3", color: "#000" }}
              onClick={fetchItems}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table border="1" cellPadding="8" width="100%">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Min</th>
                  <th>Location</th>
                  <th>Quick +/-</th>
                  {/* <th>Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const low = Number(it.quantity) <= Number(it.reorder_level || 0);
                  return (
                    <tr key={it.item_id} style={low ? { background: "#fff4f4" } : undefined}>
                      <td>{it.item_id}</td>
                      <td>{it.item_code || "-"}</td>
                      <td>{it.item_name}</td>
                      <td>{it.quantity}</td>
                      <td>{it.unit}</td>
                      <td>{it.reorder_level ?? "-"}</td>
                      <td>{it.location ?? "-"}</td>
                      <td>
                        <button
                          style={{ ...tiny.btn, background: "#e6fff0", color: "#0a6" }}
                          onClick={() => quickAdjust(it.item_id, +1)}
                        >
                          +1
                        </button>{" "}
                        <button
                          style={{ ...tiny.btn, background: "#ffecec", color: "#c00" }}
                          onClick={() => quickAdjust(it.item_id, -1)}
                        >
                          -1
                        </button>
                      </td>
                      {/* <td>
                        <button
                          style={{ ...tiny.btn, background: "#fff", color: "#c00", border: "1px solid #ddd" }}
                          onClick={() => deleteItem(it.item_id)}
                        >
                          Delete
                        </button>
                      </td> */}
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="9">No items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD ITEM */}
      {tab === "add" && (
        <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
          <form onSubmit={addItem} style={{ ...tiny.card, display: "grid", gap: 10 }}>
            <h3>➕ Add Item</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                style={tiny.input}
                placeholder="Item Code (unique)"
                value={newItem.item_code}
                onChange={(e) => setNewItem({ ...newItem, item_code: e.target.value })}
              />
              <input
                style={tiny.input}
                placeholder="Item Name *"
                required
                value={newItem.item_name}
                onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
              />
              <input
                style={tiny.input}
                placeholder="Category"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              />
              <input
                style={tiny.input}
                placeholder="Location"
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
              />
              <input
                style={tiny.input}
                placeholder="Unit (pcs/m/etc)"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              />
              <input
                style={tiny.input}
                type="number"
                step="0.01"
                placeholder="Initial Qty"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              />
              <input
                style={tiny.input}
                type="number"
                step="0.01"
                placeholder="Reorder Level"
                value={newItem.reorder_level}
                onChange={(e) => setNewItem({ ...newItem, reorder_level: e.target.value })}
              />
              <input
                style={tiny.input}
                type="number"
                step="0.01"
                placeholder="Purchase Price"
                value={newItem.purchase_price}
                onChange={(e) => setNewItem({ ...newItem, purchase_price: e.target.value })}
              />
              <input
                style={tiny.input}
                type="number"
                step="0.01"
                placeholder="Selling Price"
                value={newItem.selling_price}
                onChange={(e) => setNewItem({ ...newItem, selling_price: e.target.value })}
              />
              <input
                style={tiny.input}
                placeholder="Supplier ID (optional)"
                value={newItem.supplier_id}
                onChange={(e) => setNewItem({ ...newItem, supplier_id: e.target.value })}
              />
            </div>
            <textarea
              style={{ ...tiny.input, minHeight: 80 }}
              placeholder="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            />
            <div>
              <button style={{ ...tiny.btn, background: "#333", color: "#fff" }} type="submit">
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STOCK IN */}
      {tab === "in" && (
        <div style={{ display: "grid", gap: 16 }}>
          <form onSubmit={addIn} style={{ ...tiny.card, display: "grid", gap: 10 }}>
            <h3>⬆️ Stock IN</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <select
                style={tiny.input}
                value={inForm.item_id}
                onChange={(e) => setInForm({ ...inForm, item_id: e.target.value })}
              >
                <option value="">Select Item</option>
                {items.map((i) => (
                  <option key={i.item_id} value={i.item_id}>
                    #{i.item_id} — {i.item_name} ({i.item_code || "no-code"})
                  </option>
                ))}
              </select>
              <input
                style={tiny.input}
                type="number"
                step="0.01"
                placeholder="Qty"
                value={inForm.qty}
                onChange={(e) => setInForm({ ...inForm, qty: e.target.value })}
              />
              <input
                style={tiny.input}
                type="number"
                step="0.0001"
                placeholder="Unit Cost (optional)"
                value={inForm.unit_cost}
                onChange={(e) => setInForm({ ...inForm, unit_cost: e.target.value })}
              />
              <input
                style={tiny.input}
                placeholder="Supplier ID (optional)"
                value={inForm.supplier_id}
                onChange={(e) => setInForm({ ...inForm, supplier_id: e.target.value })}
              />
              <input
                style={tiny.input}
                placeholder="PO Number"
                value={inForm.po_number}
                onChange={(e) => setInForm({ ...inForm, po_number: e.target.value })}
              />
              <input
                style={{ ...tiny.input, gridColumn: "span 3" }}
                placeholder="Note"
                value={inForm.note}
                onChange={(e) => setInForm({ ...inForm, note: e.target.value })}
              />
            </div>
            <div>
              <button style={{ ...tiny.btn, background: "#333", color: "#fff" }} type="submit">
                Add IN
              </button>
            </div>
          </form>

          {/* IN LIST */}
          <MovementFilters filters={filters} setFilters={setFilters} onApply={() => { fetchIn(); }} />
          <MovementInTable rows={inRows} />
        </div>
      )}

      {/* STOCK OUT */}
      {tab === "out" && (
        <div style={{ display: "grid", gap: 16 }}>
          <form onSubmit={addOut} style={{ ...tiny.card, display: "grid", gap: 10 }}>
            <h3>⬇️ Stock OUT</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <select
                style={tiny.input}
                value={outForm.item_id}
                onChange={(e) => setOutForm({ ...outForm, item_id: e.target.value })}
              >
                <option value="">Select Item</option>
                {items.map((i) => (
                  <option key={i.item_id} value={i.item_id}>
                    #{i.item_id} — {i.item_name} ({i.item_code || "no-code"})
                  </option>
                ))}
              </select>
              <input
                style={tiny.input}
                type="number"
                step="0.01"
                placeholder="Qty"
                value={outForm.qty}
                onChange={(e) => setOutForm({ ...outForm, qty: e.target.value })}
              />
              <select
                style={tiny.input}
                value={outForm.reason}
                onChange={(e) => setOutForm({ ...outForm, reason: e.target.value })}
              >
                <option value="usage">usage</option>
                <option value="production">production</option>
                <option value="sale">sale</option>
                <option value="adjustment">adjustment</option>
                <option value="transfer">transfer</option>
              </select>
              <input
                style={tiny.input}
                placeholder="Order ID (optional)"
                value={outForm.order_id}
                onChange={(e) => setOutForm({ ...outForm, order_id: e.target.value })}
              />
              <input
                style={{ ...tiny.input, gridColumn: "span 3" }}
                placeholder="Note"
                value={outForm.note}
                onChange={(e) => setOutForm({ ...outForm, note: e.target.value })}
              />
            </div>
            <div>
              <button style={{ ...tiny.btn, background: "#333", color: "#fff" }} type="submit">
                Add OUT
              </button>
            </div>
          </form>

          {/* OUT LIST */}
          <MovementFilters filters={filters} setFilters={setFilters} onApply={() => { fetchOut(); }} />
          <MovementOutTable rows={outRows} itemsById={itemsById} />
        </div>
      )}

      {/* MOVEMENTS (combined) */}
      {tab === "movements" && (
        <div style={{ display: "grid", gap: 20 }}>
          <MovementFilters filters={filters} setFilters={setFilters} onApply={() => { fetchIn(); fetchOut(); }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <h3>IN</h3>
              <MovementInTable rows={inRows} />
            </div>
            <div>
              <h3>OUT</h3>
              <MovementOutTable rows={outRows} itemsById={itemsById} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MovementFilters = ({ filters, setFilters, onApply }) => {
  return (
    <div style={{ ...tiny.card, display: "flex", gap: 10, alignItems: "center" }}>
      <input
        style={tiny.input}
        placeholder="Item ID"
        value={filters.item_id}
        onChange={(e) => setFilters({ ...filters, item_id: e.target.value })}
      />
      <input
        style={tiny.input}
        type="date"
        value={filters.from}
        onChange={(e) => setFilters({ ...filters, from: e.target.value })}
      />
      <input
        style={tiny.input}
        type="date"
        value={filters.to}
        onChange={(e) => setFilters({ ...filters, to: e.target.value })}
      />
      <input
        style={{ ...tiny.input, width: 100 }}
        type="number"
        value={filters.limit}
        onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value || 100) })}
      />
      <button style={{ ...tiny.btn, background: "#333", color: "#fff" }} onClick={onApply}>
        Apply
      </button>
    </div>
  );
};

const MovementInTable = ({ rows }) => (
  <div style={{ overflowX: "auto" }}>
    <table border="1" cellPadding="8" width="100%">
      <thead>
        <tr>
          <th>Date</th>
          <th>Item</th>
          <th>Qty</th>
          <th>Unit Cost</th>
          <th>Total Cost</th>
          <th>Supplier</th>
          <th>PO</th>
          <th>By</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.received_at}</td>
            <td>
              #{r.item_id} — {r.item_code} / {r.item_name}
            </td>
            <td style={{ color: "#0a6", fontWeight: 600 }}>+{r.qty}</td>
            <td>{r.unit_cost ?? "-"}</td>
            <td>{r.total_cost ?? "-"}</td>
            <td>{r.supplier_id ?? "-"}</td>
            <td>{r.po_number ?? "-"}</td>
            <td>{r.received_by ?? "-"}</td>
            <td>{r.note ?? "-"}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan="9">No IN movements</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const MovementOutTable = ({ rows }) => (
  <div style={{ overflowX: "auto" }}>
    <table border="1" cellPadding="8" width="100%">
      <thead>
        <tr>
          <th>Date</th>
          <th>Item</th>
          <th>Qty</th>
          <th>Reason</th>
          <th>Order</th>
          <th>By</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.issued_at}</td>
            <td>
              #{r.item_id} — {r.item_code} / {r.item_name}
            </td>
            <td style={{ color: "#c00", fontWeight: 600 }}>-{r.qty}</td>
            <td>{r.reason}</td>
            <td>{r.order_id ?? "-"}</td>
            <td>{r.issued_by ?? "-"}</td>
            <td>{r.note ?? "-"}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan="7">No OUT movements</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default WarehousePage;
