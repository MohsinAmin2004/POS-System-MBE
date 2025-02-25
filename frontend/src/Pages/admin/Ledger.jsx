import { useState, useEffect } from "react";
import SidebarAdmin from "./Sidebar";

const GeneralLedger = () => {
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [specificDate, setSpecificDate] = useState(""); // New: Exact date filter
  const [modelFilter, setModelFilter] = useState(""); // New: Model filter
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
    return dateString.split("T")[0];
  };

  const handleDelete = async (ledgerId) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      const response = await fetch("https://pos-system-mbe.onrender.com/api/delete-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ledger_id: ledgerId }),
      });

      if (!response.ok) throw new Error("Failed to delete entry");

      setData(data.filter((item) => item.ledger_id !== ledgerId));
    } catch (error) {
      alert("Error deleting entry: " + error.message);
    }
  };

  // Apply date range filtering + specific date + model filter
  const filteredData = data.filter((item) => {
    const itemDate = formatDate(item.date);
    
    // Date range filter
    const isWithinRange = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);

    // Specific date filter (Overrides range if a specific date is selected)
    const isSpecificDateMatch = !specificDate || itemDate === specificDate;

    // Model filter (case-insensitive match)
    const isModelMatch = !modelFilter || item.model.toLowerCase().includes(modelFilter.toLowerCase());

    return isWithinRange && isSpecificDateMatch && isModelMatch;
  });

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
      <div className="ledger-container">
        <h1 className="text-2xl font-bold mb-4">General Ledger</h1>

        {/* Filter Inputs */}
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

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Model</th>
              <th>Brand</th>
              <th>Name</th>
              <th>Quantity</th>
              <th>Purchasing Price</th>
              <th>Total Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.ledger_id}>
                  <td>{item.ledger_id}</td>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.model}</td>
                  <td>{item.brand}</td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>PKR {item.purchasing_price}</td>
                  <td>PKR {item.total_price}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(item.ledger_id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeneralLedger;
