import React, { useEffect, useState } from "react";
import axios from "axios";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "user",
    email: "",
    phone: "",
  });

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        "https://arkanaltafawuq.com/arkan-system/get_users.php"
      );
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async () => {
    try {
      const response = await axios.post(
        "https://arkanaltafawuq.com/arkan-system/add_user.php",
        form
      );
      if (response.data.success) {
        alert("User added successfully!");
        setForm({
          username: "",
          password: "",
          role: "user",
          email: "",
          phone: "",
        });
        fetchUsers();
      } else {
        alert("Failed to add user: " + response.data.message);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Error adding user");
    }
  };

  const deleteUser = async (id, username) => {
    if (
      !window.confirm(`Are you sure you want to delete user "${username}"?`)
    ) {
      return;
    }
    try {
      const response = await axios.post(
        "https://arkanaltafawuq.com/arkan-system/delete_user.php",
        { id }
      );
      if (response.data.success) {
        alert("User deleted successfully!");
        fetchUsers();
      } else {
        alert("Failed to delete user: " + response.data.message);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>User Management</h2>

      <div style={{ marginBottom: "20px" }}>
        <h3>Add New User</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="account manager">Account Manager</option>
            <option value="designer manager">Designer Manager</option>
            <option value="designer">Designer</option>
            <option value="finance">Finance</option>
          </select>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <input
            type="text"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <button
            onClick={addUser}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Add User
          </button>
        </div>
      </div>

      <div>
        <h3>Existing Users</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  borderBottom: "1px solid #dee2e6",
                }}
              >
                Username
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  borderBottom: "1px solid #dee2e6",
                }}
              >
                Role
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  borderBottom: "1px solid #dee2e6",
                }}
              >
                Email
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  borderBottom: "1px solid #dee2e6",
                }}
              >
                Phone
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  borderBottom: "1px solid #dee2e6",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  {user.username}
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  {user.role}
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  {user.email}
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  {user.phone}
                </td>
                <td
                  style={{ padding: "12px", borderBottom: "1px solid #dee2e6" }}
                >
                  <button
                    onClick={() => deleteUser(user.id, user.username)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
