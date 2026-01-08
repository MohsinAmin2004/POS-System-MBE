import React, { useState, useEffect } from "react";
import SidebarManager from "./Sidebar";

const SalesReport = () => {
  // --- State for API Request (Timeline) ---
  const [timeline, setTimeline] = useState({
    year: new Date().getFullYear(),
    month: "",
    day: "",
  });

  // --- State for Data & UI ---
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- State for Filters ---
  const [filters, setFilters] = useState({
    paymentStatus: "",
    shopName: "",
    brand: "",
    productName: "", // Column specific search
    model: ""        // Column specific search
  });

  // --- KPI State ---
  const [kpis, setKpis] = useState({
    totalSelling: 0,
    totalPurchasing: 0,
    totalProfit: 0
  });

  // --- Fetch Data from API ---
  const fetchReport = async () => {
    if (!timeline.year) {
      alert("Please enter a year");
      return;
    }

    setLoading(true);
    try {
      // Build Query String
      let query = `?year=${timeline.year}`;
      if (timeline.month) query += `&month=${timeline.month}`;
      if (timeline.day) query += `&day=${timeline.day}`;

      const response = await fetch(`https://pos-system-mbe.onrender.com/sales-report${query}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setReportData(data);
      } else {
        setReportData([]);
      }
    } catch (error) {
      console.error("Error fetching sales report:", error);
      setReportData([]);
    }
    setLoading(false);
  };

  // --- Filtering Logic ---
  const getFilteredData = () => {
    return reportData.filter((item) => {
      // 1. Payment Type Filter
      const statusMatch = filters.paymentStatus === "" || item.sale_type === filters.paymentStatus;
      
      // 2. Shop Name Filter
      const shopMatch = filters.shopName === "" || item.shop_name === filters.shopName;

      // 3. Brand Filter (Search)
      const brandMatch = filters.brand === "" || 
        item.brand.toLowerCase().includes(filters.brand.toLowerCase());

      // 4. Column Search: Product Name
      const productMatch = filters.productName === "" || 
        item.product_name.toLowerCase().includes(filters.productName.toLowerCase());

      // 5. Column Search: Model
      const modelMatch = filters.model === "" || 
        item.model.toLowerCase().includes(filters.model.toLowerCase());

      return statusMatch && shopMatch && brandMatch && productMatch && modelMatch;
    });
  };

  const filteredData = getFilteredData();

  // --- KPI Calculation (Based on Filtered Data) ---
  useEffect(() => {
    const totalSell = filteredData.reduce((sum, item) => sum + Number(item.total_selling_price || 0), 0);
    const totalBuy = filteredData.reduce((sum, item) => sum + Number(item.total_purchasing_price || 0), 0);
    
    setKpis({
      totalSelling: totalSell,
      totalPurchasing: totalBuy,
      totalProfit: totalSell - totalBuy
    });
  }, [filters, reportData]); // Recalculate when filters or data change

  // --- Handlers ---
  const handleTimelineChange = (e) => {
    setTimeline({ ...timeline, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Extract Unique Shop Names for Dropdown
  const uniqueShops = [...new Set(reportData.map(item => item.shop_name))];

  return (
    <div style={{ display: "flex" }}>
      <SidebarManager />
      <div style={{ marginLeft: "250px", padding: "20px", width: "100%" }}>
        <h2>Sales & Profit Report</h2>

        {/* --- 1. Timeline Request Section --- */}
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f4f4f4", borderRadius: "8px" }}>
          <h4>Step 1: Request Timeline</h4>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="number"
              name="year"
              placeholder="Year (e.g. 2025)"
              value={timeline.year}
              onChange={handleTimelineChange}
              style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
            />
            <input
              type="number"
              name="month"
              placeholder="Month (1-12)"
              value={timeline.month}
              onChange={handleTimelineChange}
              style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
            />
            <input
              type="number"
              name="day"
              placeholder="Day (1-31)"
              value={timeline.day}
              onChange={handleTimelineChange}
              style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
            />
            <button 
              onClick={fetchReport}
              style={{ padding: "8px 16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Get Report
            </button>
          </div>
        </div>

        {/* --- 2. KPI Section --- */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div style={{ flex: 1, padding: "20px", backgroundColor: "#e3f2fd", borderRadius: "8px", textAlign: "center" }}>
            <h3>{kpis.totalSelling.toLocaleString()}</h3>
            <p>Total Revenue (Selling Price)</p>
          </div>
          <div style={{ flex: 1, padding: "20px", backgroundColor: "#ffebee", borderRadius: "8px", textAlign: "center" }}>
            <h3>{kpis.totalPurchasing.toLocaleString()}</h3>
            <p>Total Cost (Purchasing Price)</p>
          </div>
          <div style={{ flex: 1, padding: "20px", backgroundColor: "#e8f5e9", borderRadius: "8px", textAlign: "center" }}>
            <h3 style={{ color: kpis.totalProfit >= 0 ? "green" : "red" }}>
              {kpis.totalProfit.toLocaleString()}
            </h3>
            <p>Net Profit</p>
          </div>
        </div>

        {/* --- 3. Filters Row --- */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <select
            name="paymentStatus"
            value={filters.paymentStatus}
            onChange={handleFilterChange}
            style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          >
            <option value="">All Payment Types</option>
            <option value="Paid">Paid</option>
            <option value="Instalments">Instalments</option>
            <option value="Unpaid">Unpaid</option>
          </select>

          <select
            name="shopName"
            value={filters.shopName}
            onChange={handleFilterChange}
            style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          >
            <option value="">All Shops</option>
            {uniqueShops.map((shop, index) => (
              <option key={index} value={shop}>{shop}</option>
            ))}
          </select>

          <input
            type="text"
            name="brand"
            placeholder="Filter by Brand..."
            value={filters.brand}
            onChange={handleFilterChange}
            style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px", flex: 1 }}
          />
        </div>

        {/* --- 4. Data Table --- */}
        {loading ? (
          <p>Loading report data...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f4f4f4", textAlign: "center" }}>
                <th style={{ padding: "10px" }}>Shop Name</th>
                
                {/* Column with specific search: Product Name */}
                <th style={{ padding: "10px" }}>
                  <div>Product Name</div>
                  <input
                    type="text"
                    name="productName"
                    value={filters.productName}
                    onChange={handleFilterChange}
                    placeholder="Search Product..."
                    style={{ marginTop: "5px", width: "90%", padding: "4px", fontSize: "12px" }}
                  />
                </th>

                {/* Column with specific search: Model */}
                <th style={{ padding: "10px" }}>
                   <div>Model</div>
                   <input
                    type="text"
                    name="model"
                    value={filters.model}
                    onChange={handleFilterChange}
                    placeholder="Search Model..."
                    style={{ marginTop: "5px", width: "90%", padding: "4px", fontSize: "12px" }}
                  />
                </th>

                <th style={{ padding: "10px" }}>Brand</th>
                <th style={{ padding: "10px" }}>Qty Sold</th>
                <th style={{ padding: "10px" }}>Sale Type</th>
                <th style={{ padding: "10px" }}>Total Cost</th>
                <th style={{ padding: "10px" }}>Total Revenue</th>
                <th style={{ padding: "10px" }}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => {
                  const profit = Number(item.total_selling_price) - Number(item.total_purchasing_price);
                  return (
                    <tr key={index} style={{ textAlign: "center", borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "10px" }}>{item.shop_name}</td>
                      <td style={{ padding: "10px" }}>{item.product_name}</td>
                      <td style={{ padding: "10px" }}>{item.model}</td>
                      <td style={{ padding: "10px" }}>{item.brand}</td>
                      <td style={{ padding: "10px" }}>{item.quantity_sold}</td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ 
                          padding: "4px 8px", 
                          borderRadius: "4px", 
                          backgroundColor: item.sale_type === "Installment" ? "#fff3cd" : "#d4edda",
                          color: item.sale_type === "Installment" ? "#856404" : "#155724"
                        }}>
                          {item.sale_type}
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>{Number(item.total_purchasing_price).toLocaleString()}</td>
                      <td style={{ padding: "10px" }}>{Number(item.total_selling_price).toLocaleString()}</td>
                      <td style={{ padding: "10px", fontWeight: "bold", color: profit >= 0 ? "green" : "red" }}>
                        {profit.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                    No records found. Please adjust timeline or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SalesReport;