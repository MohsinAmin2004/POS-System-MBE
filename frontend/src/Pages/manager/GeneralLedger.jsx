import { useState, useEffect } from "react";
import SidebarManager from "./Sidebar_manager"; // Import the Sidebar

const ManagerGeneralLedger = () => {
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLedgerData = async () => {
      setLoading(true);
      try {
        const response = await fetch("https://pos-system-mbe.onrender.com/ledger");
        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLedgerData();
  }, []);

  // Format date to YYYY-MM-DD (remove time)
  const formatDate = (dateString) => {
    return dateString.split("T")[0]; // Extract YYYY-MM-DD part
  };

  // Apply date range filtering
  const filteredData = data.filter((item) => {
    const itemDate = formatDate(item.date);
    return (
      (!startDate || itemDate >= startDate) &&
      (!endDate || itemDate <= endDate)
    );
  });

  return (
    <div>
      <SidebarManager />
      <style>
        {`
          .ledger-container {
            margin-left: 250px;
            padding: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .date-filter-container {
            margin-bottom: 16px;
            display: flex;
            gap: 10px;
          }
          input {
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
        `}
      </style>
      <div className="ledger-container">
        <h1 className="text-2xl font-bold mb-4">General Ledger</h1>
        
        {/* Date Range Filter */}
        <div className="date-filter-container">
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Model</th>
              <th>Brand</th>
              <th>Name</th>
              <th>Quantity</th>
              <th>Purchasing Price</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <tr key={index}>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.model}</td>
                  <td>{item.brand}</td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>PKR {item.purchasing_price}</td>
                  <td>PKR {item.total_price}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerGeneralLedger;
