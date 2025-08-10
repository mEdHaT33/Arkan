import React, { useEffect, useState } from "react";

const PurchaseReceiptPage = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [items, setItems] = useState([
    {
      item_name: "",
      item_code: "",
      description: "",
      price: "",
      qty: "",
      discount: "",
      tax: "",
    },
  ]);
  const [date, setDate] = useState("");

  useEffect(() => {
    fetch("https://arkanaltafawuq.com/arkan-system/get_vendors.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setVendors(data.vendors);
      })
      .catch((err) => console.error("Failed to fetch vendors", err));
  }, []);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        item_name: "",
        item_code: "",
        description: "",
        price: "",
        qty: "",
        discount: "",
        tax: "",
      },
    ]);
  };

  const removeItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleSubmit = async () => {
    if (!selectedVendor || !date) return alert("Vendor and date are required!");

    const payload = {
      vendor_id: selectedVendor,
      date,
      items,
    };

    try {
      const res = await fetch(
        "https://arkanaltafawuq.com/arkan-system/submit_purchase_receipt.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        alert("✅ Receipt saved! ID: " + data.receipt_id);
        setItems([
          {
            item_name: "",
            item_code: "",
            description: "",
            price: "",
            qty: "",
            discount: "",
            tax: "",
          },
        ]);
        setDate("");
        setSelectedVendor("");
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      console.error("Submit error", err);
      alert("❌ Server error");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📦 Purchase Receipt</h2>

      <label>Supplier:</label>
      <select
        value={selectedVendor}
        onChange={(e) => setSelectedVendor(e.target.value)}
      >
        <option value="">Select Vendor</option>
        {vendors.map((vendor) => (
          <option key={vendor.id} value={vendor.id}>
            {vendor.name}
          </option>
        ))}
      </select>

      <br />
      <label>Date:</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <h4 style={{ marginTop: 20 }}>Items</h4>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            marginBottom: 10,
            borderBottom: "1px dashed gray",
            paddingBottom: 10,
          }}
        >
          <input
            placeholder="Name"
            value={item.item_name}
            onChange={(e) =>
              handleItemChange(index, "item_name", e.target.value)
            }
          />
          <input
            placeholder="Code"
            value={item.item_code}
            onChange={(e) =>
              handleItemChange(index, "item_code", e.target.value)
            }
          />
          <input
            placeholder="Description"
            value={item.description}
            onChange={(e) =>
              handleItemChange(index, "description", e.target.value)
            }
          />
          <input
            type="number"
            placeholder="Price"
            value={item.price}
            onChange={(e) => handleItemChange(index, "price", e.target.value)}
          />
          <input
            type="number"
            placeholder="Qty"
            value={item.qty}
            onChange={(e) => handleItemChange(index, "qty", e.target.value)}
          />
          <input
            type="number"
            placeholder="Discount"
            value={item.discount}
            onChange={(e) =>
              handleItemChange(index, "discount", e.target.value)
            }
          />
          <input
            type="number"
            placeholder="Tax"
            value={item.tax}
            onChange={(e) => handleItemChange(index, "tax", e.target.value)}
          />
          {items.length > 1 && (
            <button onClick={() => removeItem(index)}>Remove</button>
          )}
        </div>
      ))}
      <button onClick={addItem}>+ Add Item</button>

      <br />
      <button style={{ marginTop: 20 }} onClick={handleSubmit}>
        ✅ Submit Receipt
      </button>
    </div>
  );
};

export default PurchaseReceiptPage;
