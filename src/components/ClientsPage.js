import React, { useEffect, useState } from "react";
import "../styles/ClientPage.css";

const ClientPage = ({ isSidebarOpen }) => {
  const [clients, setClients] = useState([]);
  const [newClient, setNewClient] = useState({
    name: "",
    address: "",
    tax_id: "",
    phone: "",
    email: "",
    type: "Client",
    balance: 0,
  });
  const [editMode, setEditMode] = useState(null);
  const [editClient, setEditClient] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [balanceFilter, setBalanceFilter] = useState("All");

  const fetchClients = async () => {
    try {
      const response = await fetch(
        "https://arkanaltafawuq.com/arkan-system/get_clients.php"
      );
      const data = await response.json();
      if (data.success) {
        // Ensure balance is a number
        const clientsWithParsedBalance = data.clients.map((client) => ({
          ...client,
          balance: parseFloat(client.balance) || 0,
        }));
        setClients(clientsWithParsedBalance);
      } else {
        console.error("Failed to fetch clients: ", data.message);
      }
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async () => {
    try {
      const clientToAdd = {
        ...newClient,
        balance: parseFloat(newClient.balance) || 0,
      };
      const response = await fetch(
        "https://arkanaltafawuq.com/arkan-system/add_client.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientToAdd),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert("✅ Client added!");
        setNewClient({
          name: "",
          address: "",
          tax_id: "",
          phone: "",
          email: "",
          type: "Client",
          balance: 0,
        });
        fetchClients();
      } else {
        alert("❌ Failed to add client: " + data.message);
      }
    } catch (err) {
      console.error("Add client error", err);
      alert("❌ Server error");
    }
  };

  const handleEditClick = (client) => {
    setEditMode(client.id);
    setEditClient({ ...client, balance: client.balance.toString() });
  };

  const handleUpdateClient = async () => {
    try {
      const clientToUpdate = {
        id: editClient.id,
        name: editClient.name,
        type: editClient.type,
        address: editClient.address || "",
        tax_id: editClient.tax_id || "",
        phone: editClient.phone || "",
        email: editClient.email || "",
        balance: editClient.balance === "" ? null : editClient.balance
      };

      const response = await fetch(
        "https://arkanaltafawuq.com/arkan-system/edit_client.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clientToUpdate),
        }
      );
      
      const data = await response.json();
      if (data.success) {
        alert("✅ Client updated successfully!");
        setEditMode(null);
        fetchClients();
      } else {
        alert("❌ Update failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Update error", err);
      alert("❌ Server error: " + err.message);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      (client.name &&
        client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone && client.phone.includes(searchTerm)) ||
      (client.email && client.email.toLowerCase().includes(searchTerm));
    const matchesType = typeFilter === "All" || client.type === typeFilter;
    const matchesBalance =
      balanceFilter === "All" ||
      (balanceFilter === "Positive" && client.balance > 0) ||
      (balanceFilter === "Negative" && client.balance < 0) ||
      (balanceFilter === "Zero" && client.balance === 0);
    return matchesSearch && matchesType && matchesBalance;
  });

  return (
    <div className={`clients-container ${isSidebarOpen ? "shifted" : ""}`}>
      <div className="clients-card">
        <h2 className="clients-title">Clients & Vendors</h2>

        <h3 className="clients-subtitle">Add New Client/Vendor</h3>
        <div className="form-group">
          <input
            placeholder="Name"
            value={newClient.name}
            onChange={(e) =>
              setNewClient({ ...newClient, name: e.target.value })
            }
            className="form-input"
          />
          <input
            placeholder="Phone"
            value={newClient.phone}
            onChange={(e) =>
              setNewClient({ ...newClient, phone: e.target.value })
            }
            className="form-input"
          />
          <input
            placeholder="Email"
            value={newClient.email}
            onChange={(e) =>
              setNewClient({ ...newClient, email: e.target.value })
            }
            className="form-input"
          />
          <input
            placeholder="Address"
            value={newClient.address}
            onChange={(e) =>
              setNewClient({ ...newClient, address: e.target.value })
            }
            className="form-input"
          />
          <input
            placeholder="Tax ID"
            value={newClient.tax_id}
            onChange={(e) =>
              setNewClient({ ...newClient, tax_id: e.target.value })
            }
            className="form-input"
          />
          <input
            type="number"
            placeholder="Balance"
            value={newClient.balance}
            onChange={(e) =>
              setNewClient({ ...newClient, balance: e.target.value })
            }
            className="form-input"
          />
          <select
            value={newClient.type}
            onChange={(e) =>
              setNewClient({ ...newClient, type: e.target.value })
            }
            className="form-select"
          >
            <option value="Client">Client</option>
            <option value="Vendor">Vendor</option>
          </select>
          <button onClick={handleAddClient} className="form-button">
            <span className="button-icon">➕</span> Add
          </button>
        </div>

        <h3 className="clients-subtitle">Existing Clients/Vendors</h3>
        <div className="search-filter-group">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input search-input"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select filter-select"
          >
            <option value="All">All Types</option>
            <option value="Client">Client</option>
            <option value="Vendor">Vendor</option>
          </select>
          <select
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value)}
            className="form-select filter-select"
          >
            <option value="All">All Balances</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
            <option value="Zero">Zero</option>
          </select>
        </div>
        <div className="client-list">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className={`client-item ${
                  editMode === client.id ? "editing" : ""
                }`}
              >
                {editMode === client.id ? (
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Name"
                      value={editClient.name || ''}
                      onChange={(e) =>
                        setEditClient({ ...editClient, name: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={editClient.phone || ''}
                      onChange={(e) =>
                        setEditClient({ ...editClient, phone: e.target.value })
                      }
                      className="form-input"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={editClient.email || ''}
                      onChange={(e) =>
                        setEditClient({ ...editClient, email: e.target.value })
                      }
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={editClient.address || ''}
                      onChange={(e) =>
                        setEditClient({ ...editClient, address: e.target.value })
                      }
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Tax ID"
                      value={editClient.tax_id || ''}
                      onChange={(e) =>
                        setEditClient({ ...editClient, tax_id: e.target.value })
                      }
                      className="form-input"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Balance (leave empty to keep current)"
                      value={editClient.balance !== null ? editClient.balance : ''}
                      onChange={(e) =>
                        setEditClient({
                          ...editClient,
                          balance: e.target.value === '' ? null : e.target.value,
                        })
                      }
                      className="form-input"
                    />
                    <select
                      value={editClient.type || 'Client'}
                      onChange={(e) =>
                        setEditClient({ ...editClient, type: e.target.value })
                      }
                      className="form-select"
                      required
                    >
                      <option value="Client">Client</option>
                      <option value="Vendor">Vendor</option>
                    </select>
                    <button
                      onClick={handleUpdateClient}
                      className="client-button"
                    >
                      <span className="button-icon">💾</span> Save
                    </button>
                    <button
                      onClick={() => setEditMode(null)}
                      className="client-button cancel"
                    >
                      <span className="button-icon">✖️</span> Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="client-info">
                      <strong>{client.name}</strong> - {client.phone} -{" "}
                      {client.email} - {client.type} - 💰 Balance:{" "}
                      {client.balance}
                    </div>
                    <button
                      onClick={() => handleEditClick(client)}
                      className="client-button"
                    >
                      <span className="button-icon">✏️</span> Edit
                    </button>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="no-results">No clients or vendors found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientPage;
