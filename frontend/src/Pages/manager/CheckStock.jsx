import { useEffect, useState } from "react";
import "./CSS/CheckStock.css";
import SidebarManager from "./Sidebar_manager";

function CheckStockPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [stockData, setStockData] = useState([]);
  const [managerShopId, setManagerShopId] = useState(null);
  const [shopMap, setShopMap] = useState({});

  useEffect(() => {
    // Extract manager's shop ID from token
    const token = sessionStorage.getItem("token");
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      setManagerShopId(decodedToken.shop_id);
    }
  }, []);

  useEffect(() => {
    fetchShopData();
  }, []);

  useEffect(() => {
    if (managerShopId && Object.keys(shopMap).length > 0) {
      fetchStockData();
    }
  }, [managerShopId, shopMap]);

  const fetchShopData = async () => {
    try {
      const response = await fetch("https://pos-system-mbe.onrender.com/shops");
      const data = await response.json();
      
      // Create a mapping of shop name to shop_id
      const shopMapping = {};
      data.forEach((shop) => {
        shopMapping[shop.name] = shop.shop_id;
      });

      setShopMap(shopMapping);
    } catch (error) {
      console.error("Error fetching shop data:", error);
    }
  };

  const fetchStockData = async () => {
    try {
      const response = await fetch("https://pos-system-mbe.onrender.com/check-stock");
      const data = await response.json();

      // Map shop names to IDs and filter stock data based on manager's shop_id
      const filteredData = data.filter(
        (item) => shopMap[item.shop_name] === managerShopId
      );

      setStockData(filteredData);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  const filteredStock = stockData.filter(
    (item) =>
      (filterBrand === "" || item.brand.toLowerCase().includes(filterBrand.toLowerCase())) &&
      (searchTerm === "" ||
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-container">
      <SidebarManager />
      <div className="content">
        <h2>Check Stock</h2>

        {/* Filters */}
        <div className="filters">
          <input
            type="text"
            placeholder="Search by Model or Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by Brand"
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
          />
        </div>

        {/* Stock Table */}
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Brand</th>
              <th>Name</th>
              <th>Purchase Price</th>
              <th>Selling Price</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.map((item) => (
              <tr key={item.model}>
                <td>{item.model}</td>
                <td>{item.brand}</td>
                <td>{item.name}</td>
                <td>{item.purchasing_price}</td>
                <td>{item.selling_price}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CheckStockPage;
