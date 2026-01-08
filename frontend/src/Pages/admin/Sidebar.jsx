import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./CSS/Sidebar.css";
import logo from "../../assets/LOGO.png";

function SidebarAdmin() {
  const [adminName, setAdminName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch admin details from session storage
    const adminData = sessionStorage.getItem("admin");

    if (!adminData) {
      navigate("/"); // Redirect if no session data
    } else {
      const parsedData = JSON.parse(adminData);
      setAdminName(parsedData.name || "Admin"); // Default to "Admin" if name is missing
    }
  }, [navigate]);

  return (
    <div className="sidebar">
      <a href="/admin-invoice">
        <img src={logo} alt="Logo" className="sidebar-logo" />
      </a>
      <h2>Admin Panel</h2>
      <h3>Welcome, {adminName}!</h3>
      <ul>
        <li><Link to="/add-shop">Add Shop</Link></li>
        <li><Link to="/add-user">Add User</Link></li>
        <li><Link to="/admin-add-stock">Manage Stock</Link></li>
        <li><Link to="/admin-check-stock">Check Stock</Link></li>
        <li><Link to="/admin-stock-selling-history">Stock Selling History</Link></li>
        <li><Link to="/admin-edit-stock-selling-history">Edit Stock Selling History</Link></li>
        <li><Link to="/admin-check-instalment">Instalments and Unpaid Sales</Link></li>
        <li><Link to="/admin-Instalment-payment">Instalments and Unapid Sales Payment</Link></li>
        <li><Link to="/admin-invoice">Invoice</Link></li>
        <li><Link to="/admin-ledger">General Ledger</Link></li>
        <li><Link to="/admin-selling-report">Sales Report</Link></li>
        <li>
          <Link to="/" onClick={() => {
            sessionStorage.removeItem("admin");
            navigate("/"); // Redirect to login on logout
          }}>Logout</Link>
        </li>
      </ul>
    </div>
  );
}

export default SidebarAdmin;
