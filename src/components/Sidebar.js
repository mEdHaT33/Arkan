import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Sidebar.css";

const Sidebar = ({ role }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      setIsHovered(true);
    }
  }, [isOpen]);

  const menuItems = {
    admin: [
      { to: "/manage-users", label: "Manage Users", icon: "👥" },
      { to: "/clients", label: "Clients/Vendors", icon: "📇" },
      { to: "/orders", label: "Orders", icon: "🧾" },
      { to: "/warehouse", label: "Warehouse", icon: "📦" },
      { to: "/finance", label: "Finance", icon: "💵" },
    ],
    "account manager": [
      { to: "/create-order", label: "Manage Orders", icon: "🧾" },
      { to: "/clients", label: "Clients", icon: "📇" },
      { to: "/order-list", label: "Order List", icon: "📇" },
    ],
    "designer manager": [
      { to: "/designer-manager", label: "Designer Manager", icon: "🎨" },
      {
        to: "/designer-manager-approval",
        label: "Manager Approvals",
        icon: "🎨",
      },
    ],
    designer: [{ to: "/designer-team", label: "Designer Team", icon: "✏️" }],
    finance: [
      { to: "/finance", label: "Finance", icon: "💵" },
      { to: "/receipts", label: "All Receipts", icon: "🧾" },
    ],
  };

  return (
    <>
      <div
        className="sidebar-hover-area"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`sidebar ${isHovered || isOpen ? "open" : "closed"}`}>
          <div className="sidebar-header">
            <h3 className="sidebar-title">Menu</h3>
            <button onClick={toggleSidebar} className="toggle-button">
              <svg
                className="toggle-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}
                />
              </svg>
            </button>
          </div>
          <ul className="sidebar-menu">
            {menuItems[role]?.map((item, index) => (
              <li key={index}>
                <Link to={item.to} className="menu-item">
                  <span className="menu-icon">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        className={`main-content ${isHovered || isOpen ? "shifted" : ""}`}
      ></div>
    </>
  );
};

export default Sidebar;
