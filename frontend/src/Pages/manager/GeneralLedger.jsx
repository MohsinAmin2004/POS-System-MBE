import { useState, useEffect } from "react";
import SidebarManager from "./Sidebar_manager";

const ManagerGeneralLedger = () => {
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [specificDate, setSpecificDate] = useState(""); // New: Exact date filter
  const [modelFilter, setModelFilter] = useState(""); // New: Model filter
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [managerShopId, setManagerShopId] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decode JWT
      setManagerShopId(decodedToken.shop_id);
    }
  }, []);

  useEffect(() => {
    if (managerShopId) {
      fetchLedgerData();
    }
  }, [managerShopId]);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://pos-system-mbe.onrender.com/ledger");
      if (!response.ok) throw new Error("Failed to fetch data");
      const result = await response.json();
      setData(result.filter((item) => item.shop_id === managerShopId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => dateString.split("T")[0];

  const filteredData = data.filter((item) => {
    const itemDate = formatDate(item.date);
    const isWithinRange = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
    const isSpecificDateMatch = !specificDate || itemDate === specificDate;
    const isModelMatch = !modelFilter || item.model.toLowerCase().includes(modelFilter.toLowerCase());
    return isWithinRange && isSpecificDateMatch && isModelMatch;
  });

  return (
    <div>
      <SidebarManager />
      <div className="ledger-container">
        <h1 className="text-2xl font-bold mb-4">General Ledger</h1>
        
        <div className="filter-container">
          <label>Start Date:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <label>End Date:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <label>Specific Date:</label>
          <input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} />
          <label>Model:</label>
          <input type="text" placeholder="Search by model..." value={modelFilter} onChange={(e) => setModelFilter(e.target.value)} />
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
             {/* Total Ledger Worth Calculation */}
             <h3>
  Total Ledger Worth: PKR{" "}
  {filteredData
    .reduce((total, item) => total + (Number(item.total_price) || 0), 0)
    .toLocaleString("en-US")}
</h3>
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
          .filter-container {
            margin-bottom: 16px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          input {
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
        `}
      </style>
    </div>
  );
};

export default ManagerGeneralLedger;
