import { useEffect, useState } from "react";
import Sidebar from "./Sidebar"; // Import sidebar

function AddShop() {
  const [shopName, setShopName] = useState("");
  const [shopLocation, setShopLocation] = useState("");
  const [shops, setShops] = useState([]);
  const [username, setUsername] = useState(""); // Store logged-in user

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username"); // Get username from session
    if (storedUsername) {
      setUsername(storedUsername);
    }

    fetchShops();
  }, []);

  // Fetch Shops from API
  const fetchShops = async () => {
    try {
      const response = await fetch("https://pos-system-mbe.onrender.com/shops");
      const data = await response.json();
      setShops(data);
    } catch (error) {
      console.error("Error fetching shops:", error);
    }
  };

  // Handle Adding a Shop
  const handleSubmit = async () => {
    if (!shopName || !shopLocation) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("https://pos-system-mbe.onrender.com/add-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shopName, location: shopLocation }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Shop added successfully!");
        setShopName("");
        setShopLocation("");
        fetchShops(); // Refresh shop list
      } else {
        alert(data.error || "Failed to add shop.");
      }
    } catch (error) {
      console.error("Error adding shop:", error);
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "250px", padding: "20px", width: "100%" }}> {/* ✅ 250px margin applied */}
        <h2>Add Shop</h2>
        {username && <p>Welcome, <b>{username}</b>!</p>} {/* Display username */}

        <input
          type="text"
          placeholder="Shop Name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <input
          type="text"
          placeholder="Shop Location"
          value={shopLocation}
          onChange={(e) => setShopLocation(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button
          onClick={handleSubmit}
          style={{ width: "20%", padding: "10px", backgroundColor: "grey", color: "black", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Enter
        </button>

        {/* Table to Display Shops */}
        {shops.length > 0 && (
          <table border="1" style={{ width: "100%", marginTop: "20px", textAlign: "center", borderCollapse: "collapse" }}> {/* ✅ Centered text */}
            <thead>
              <tr style={{ backgroundColor: "#f4f4f4", color: "black", textAlign: "center" }}>
                <th>Shop Name</th>
                <th>Shop Location</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr key={shop.shop_id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td>{shop.name}</td>
                  <td>{shop.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AddShop;
