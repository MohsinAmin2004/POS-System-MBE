import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CSS/Sidebar.css";
import logo from "../../assets/LOGO.png"; // Import your image

function SidebarManager() {
  const [managerName, setManagerName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Check session immediately
    const storedManager = sessionStorage.getItem("manager");

    if (!storedManager) {
      navigate("/"); // Redirect if session does not exist
    } else {
      const managerData = JSON.parse(storedManager);
      setManagerName(managerData.name || "Manager");
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <div className="sidebar">
      <img src={logo} alt="Logo" className="sidebar-logo" />
      <h2>Hello, {managerName}</h2>
      <ul>
        <li><Link to="/manager-add-stock">Add Stock</Link></li>
        <li><Link to="/manager-check-stock">Check Stock</Link></li>
        <li><Link to="/manager-Instalment-payment">Instalments Payment</Link></li>
        <li><Link to="/manager-Check-Instalment">Check Instalments</Link></li>
        <li><Link to="/manager-invoice">Invoice Page</Link></li>
        <li><Link to="/manager-stock-selling-history">Stock Selling History</Link></li>
        <li><Link to="/manager-ledger">General Ledger</Link></li>
        <li>
          <Link to="/" onClick={handleLogout}>Logout</Link>
        </li>
      </ul>
    </div>
  );
}

export default SidebarManager;
