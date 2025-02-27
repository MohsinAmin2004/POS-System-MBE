import { useState, useEffect } from "react";
import SidebarAdmin from "./Sidebar";
import "./CSS/AddUser.css"; // Import the CSS file

function AddUser() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "admin", // Default role
    shop_id: "",   // Required for managers only
  });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("https://pos-system-mbe.onrender.com/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Could not load users. Please try again later.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = sessionStorage.getItem("token"); // Get the stored token from local storage
    console.log("Token: ", token)

    if (!token) {
        setError("Unauthorized: No token found.");
        return;
    }

    try {
        const response = await fetch("https://pos-system-mbe.onrender.com/add-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Send the JWT token in the header
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to add user");
        }

        fetchUsers(); // Refresh user list
        setFormData({ name: "", username: "", password: "", role: "admin", shop_id: "" });
        setError(null);
    } catch (error) {
        console.error("Error adding user:", error);
        setError(error.message);
    }
};




  return (
    <div>
      <SidebarAdmin />
      <div className="user-container">
        <h2>Add User</h2>
        <form className="user-form" onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
          <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />

          <select name="role" value={formData.role} onChange={handleChange} className="role-dropdown">
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
          </select>

          {formData.role === "manager" && (
            <input type="number" name="shop_id" placeholder="Shop ID" value={formData.shop_id} onChange={handleChange} required />
          )}

          <button type="submit" className="add-user-btn">Add User</button>
        </form>

        <h3>User Accounts</h3>
        {error && <p className="error-message">{error}</p>}

        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Shop ID</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={index}>
                <td>{user.name}</td>
                <td>{user.username}</td>
                <td>{"shop_id" in user ? "Manager" : "Admin"}</td>
                <td>{user.shop_id || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AddUser;
