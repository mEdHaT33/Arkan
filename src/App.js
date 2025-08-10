import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ClientsPage from "./components/ClientsPage";
import OrdersPage from "./components/OrdersPage";
import FinancePage from "./components/FinancePage";
import PurchaseReceiptPage from "./components/PurchaseReceiptPage";
import CreateOrderPage from "./components/CreateOrderPage";
import OrderListPage from "./components/OrderListPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import DesignerManagerPage from "./components/DesignerManagerPage";
import DesignerTeamPage from "./components/DesignerTeamPage";
import DesignerManagerAcceptancePage from "./components/DesignerManagerAcceptancePage";

// Layout component that includes sidebar
const LayoutWithSidebar = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Don't show sidebar on login page
  if (location.pathname === "/login") {
    return children;
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div style={{ flex: 1 }}>
        {React.cloneElement(children, { isSidebarOpen })}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <LayoutWithSidebar>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <ClientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase-receipts"
            element={
              <ProtectedRoute>
                <PurchaseReceiptPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-order"
            element={
              <ProtectedRoute>
                <CreateOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-list"
            element={
              <ProtectedRoute>
                <OrderListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/designer-manager"
            element={
              <ProtectedRoute>
                <DesignerManagerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/designer-team"
            element={
              <ProtectedRoute>
                <DesignerTeamPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/designer-manager-approval"
            element={
              <ProtectedRoute>
                <DesignerManagerAcceptancePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </LayoutWithSidebar>
    </Router>
  );
}

export default App;
