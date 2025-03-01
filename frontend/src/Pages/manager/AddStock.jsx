import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarManager from "./Sidebar_manager";


function ManagerAddStockPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [stockDatabase, setStockDatabase] = useState([]);
  const [selectedStock, setSelectedStock] = useState([]);
  const [newItem, setNewItem] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/admin-login");
      return;
    }

    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    const managerShopId = decodedToken.shop_id;

    try {
      const response = await fetch(`https://pos-system-mbe.onrender.com/stock/${managerShopId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setStockDatabase(data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setStockDatabase([]);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (!Array.isArray(stockDatabase)) return;
    const matches = stockDatabase.filter((item) => item?.model?.toLowerCase().includes(value.toLowerCase()));
    setFilteredSuggestions(matches);
  };

  const handleSelectStock = (item) => {
    if (!selectedStock.some((stock) => stock.model === item.model)) {
      setSelectedStock((prev) => [...prev, { ...item, addedQuantity: 0 }]);
    }
    setSearchTerm("");
    setFilteredSuggestions([]);
  };

  const handleQuantityChange = (model, delta) => {
    setSelectedStock((prev) =>
      prev.map((item) =>
        item.model === model
          ? { ...item, addedQuantity: Math.max(0, item.addedQuantity + delta) } // Ensure it doesn't go below 0
          : item
      )
    );
  };
  

  const handleAddNewItem = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("Error: Authentication required. Please log in again.");
      navigate("/admin-login");
      return;
    }

    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    const managerShopId = decodedToken.shop_id;

    if (
      newItem?.model?.trim() &&
      newItem?.name?.trim() &&
      newItem?.brand?.trim() &&
      newItem?.purchasePrice &&
      newItem?.sellingPrice &&
      newItem?.quantity
    ) {
      try {
        const payload = {
          model: newItem.model.trim(),
          brand: newItem.brand.trim(),
          name: newItem.name.trim(),
          shop_id: managerShopId,
          quantity: parseInt(newItem.quantity),
          purchasing_price: parseFloat(newItem.purchasePrice),
          selling_price: parseFloat(newItem.sellingPrice),
        };

        const response = await fetch("https://pos-system-mbe.onrender.com/stock/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to add stock");

        setMessage("New stock added successfully!");
        fetchStockData();
        setNewItem(null);
      } catch (error) {
        console.error("Add stock error:", error);
        setMessage(error.message);
      }
    } else {
      alert("Please fill all fields correctly before adding the item.");
    }
  };

  const handleConfirmStock = async () => {
    const managerShopId = sessionStorage.getItem("shop_id");
  
    if (!managerShopId) {
      alert("Error: Shop ID not found. Please log in again.");
      return;
    }
  
    console.log(selectedStock);
  
    try {
      const filteredStock = selectedStock
        .filter((item) => item.shop_id === parseInt(managerShopId)) // Ensure updates are only for manager's shop
        .map(({ model, name, brand, addedQuantity, purchasing_price, selling_price }) => ({
          model,
          name,
          brand,
          shop_id: parseInt(managerShopId),
          quantity: addedQuantity,
          purchasing_price,
          selling_price,
        }));
  
      console.log("Stock being sent:", filteredStock);
  
      const response = await fetch("https://pos-system-mbe.onrender.com/stock/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({ stock: filteredStock }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update stock: ${errorData.message}`);
      }
  
      setMessage("Stock updated successfully!");
      setSelectedStock([]); // Clear selected stock after update
      fetchStockData(); // Refresh stock data
    } catch (error) {
      console.error("Stock update error:", error);
      handleAuthError(error);
    }
  };
  
  
  

return (
  <div style={{ marginLeft: "250px" }}>
  <SidebarManager/>
  <div>
    <h2>Stock Management</h2>
    <input type="text" placeholder="Search Stock by Model" value={searchTerm} onChange={(e) => handleSearch(e.target.value)} />
    {filteredSuggestions.length > 0 && (
      <ul>
        {filteredSuggestions.map((item) => (
          <li key={item.model} onClick={() => handleSelectStock(item)}>
            {item.model} - {item.name}
          </li>
        ))}
      </ul>
    )}
    <table border="1">
      <thead>
        <tr>
          <th>Model</th>
          <th>Brand</th>
          <th>Name</th>
          <th>Purchase Price</th>
          <th>Selling Price</th>
          <th>Shop</th>
          <th>Available Quantity</th>
          <th>Quantity Change</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {selectedStock.map((item, index) => (
          <tr key={index}>
            <td>{item.model}</td>
            <td>{item.brand}</td>
            <td>{item.name}</td>

            {/* Editable Purchase Price */}
            <td>
              <input
                type="number"
                value={item.purchasing_price || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedStock((prev) =>
                    prev.map((stock, i) =>
                      i === index ? { ...stock, purchasing_price: value } : stock
                    )
                  );
                }}
              />
            </td>

            {/* Editable Selling Price */}
            <td>
              <input
                type="number"
                value={item.selling_price || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedStock((prev) =>
                    prev.map((stock, i) =>
                      i === index ? { ...stock, selling_price: value } : stock
                    )
                  );
                }}
              />
            </td>

            <td>{item.shop}</td>
            <td>{item.isNew ? "-" : item.quantity}</td>
            <td>{item.addedQuantity}</td>
            <td>
              <button onClick={() => handleQuantityChange(item.model, 1)}>+</button>
              <button onClick={() => handleQuantityChange(item.model, -1)}>-</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {!newItem && <button onClick={() => setNewItem({ model: searchTerm, brand: "", name: "", purchasePrice: "", sellingPrice: "", shop: "", quantity: "" })}>Add New Item</button>}
    {newItem && (
      <div>
        <h3>Add New Item</h3>
        <input 
          type="text" 
          placeholder="Model" 
          value={newItem.model} 
          onChange={(e) => setNewItem((prev) => ({ ...prev, model: e.target.value }))}
        />

        <input 
          type="text" 
          placeholder="Brand" 
          value={newItem.brand} 
          onChange={(e) => setNewItem((prev) => ({ ...prev, brand: e.target.value }))}
        />

        <input 
          type="text" 
          placeholder="Name" 
          value={newItem.name} 
          onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
        />

        <input 
          type="number" 
          placeholder="Purchase Price" 
          value={newItem.purchasePrice} 
          onChange={(e) => setNewItem((prev) => ({ ...prev, purchasePrice: e.target.value }))}
        />

        <input 
          type="number" 
          placeholder="Selling Price" 
          value={newItem.sellingPrice} 
          onChange={(e) => setNewItem((prev) => ({ ...prev, sellingPrice: e.target.value }))}
        />

        
        

        <input 
          type="number" 
          placeholder="Quantity" 
          value={newItem.quantity} 
          onChange={(e) => setNewItem((prev) => ({ ...prev, quantity: e.target.value }))}
        />
        


        <button onClick={handleAddNewItem}>Confirm New Item</button>
      </div>
    )}
    {selectedStock.length > 0 && <button onClick={handleConfirmStock}>Confirm Stock Update</button>}
    {message && <p>{message}</p>}
  </div>
  </div>
);
}

export default ManagerAddStockPage;
