import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config"; // Ensure this is correctly set

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://pos-system-mbe.onrender.com/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // ✅ Store token in sessionStorage
      sessionStorage.setItem("token", data.token);

      // ✅ Decode JWT to extract `shop_id`
      const tokenPayload = JSON.parse(atob(data.token.split(".")[1]));
      sessionStorage.setItem("shop_id", tokenPayload.shop_id);

      // ✅ Store session expiration timestamp (10 hours)
      const expiresAt = Date.now() + 10 * 60 * 60 * 1000;
      sessionStorage.setItem("expiresAt", expiresAt);

      navigate("/manager-invoice");
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Manager Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={styles.input}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />
      <button onClick={handleLogin} style={styles.button} disabled={loading}>
        {loading ? "Logging in..." : "Log In"}
      </button>
      <Link to="/admin-login" style={styles.link}>
        <button style={styles.button}>Admin Login</button>
      </Link>
    </div>
  );
}

const styles = {
  container: {
    width: "300px",
    margin: "100px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    textAlign: "center",
    backgroundColor: "#f9f9f9",
  },
  heading: {
    marginBottom: "20px",
    color: "#333",
  },
  input: {
    width: "90%",
    padding: "10px",
    marginBottom: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "10px",
  },
  link: {
    textDecoration: "none",
  },
};

export default Login;
