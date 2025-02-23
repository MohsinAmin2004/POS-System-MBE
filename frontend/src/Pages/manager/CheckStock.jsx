import { useEffect, useState } from "react";
import './CSS/CheckStock.CSS'
import SidebarManager from "./Sidebar_manager"; // Import the Sidebar

function CheckStockPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterShop, setFilterShop] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      const response = await fetch("https://pos-system-mbe.onrender.com/check-stock"); // Adjust URL if necessary
      const data = await response.json();
      setStockData(data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  const handleRemoveItem = (model) => {
    setStockData((prevStock) => prevStock.filter((item) => item.model !== model));
  };

  const filteredStock = stockData.filter((item) =>
    (filterShop === "" || item.shop_name.toLowerCase().includes(filterShop.toLowerCase())) &&
    (filterBrand === "" || item.brand.toLowerCase().includes(filterBrand.toLowerCase())) &&
    (searchTerm === "" ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-container">
      <SidebarManager /> {/* Sidebar Component */}
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
            placeholder="Filter by Shop"
            value={filterShop}
            onChange={(e) => setFilterShop(e.target.value)}
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
              <th>Shop</th>
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
                <td>{item.shop_name}</td>
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
