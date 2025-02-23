import { useState, useEffect } from "react";
import SidebarAdmin from "./Sidebar";

const GeneralLedger = () => {
  const [data, setData] = useState([]);
  const [searchDate, setSearchDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLedgerData = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5000/ledger");
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

  // Apply date filtering
  const filteredData = searchDate
    ? data.filter((item) => formatDate(item.date) === searchDate)
    : data;

  return (
    <div>
      <SidebarAdmin />
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
          input {
            padding: 8px;
            margin-bottom: 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
            width: 50%;
          }
        `}
      </style>
      <div className="ledger-container">
        <h1 className="text-2xl font-bold mb-4">General Ledger</h1>
        
        {/* Date Filter Input */}
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
        />

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

export default GeneralLedger;
