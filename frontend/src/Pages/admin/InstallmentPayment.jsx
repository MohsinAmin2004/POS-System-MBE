import React, { useState } from "react";
import SidebarAdmin from "./Sidebar";

const API_BASE_URL = "http://localhost:5000"; // Your backend URL

const AdminInstalmentPayment = () => {
  const [instalmentId, setInstalmentId] = useState("");
  const [instalmentData, setInstalmentData] = useState(null);
  const [instalmentsToPay, setInstalmentsToPay] = useState("");
  const [billSearchTerm, setBillSearchTerm] = useState("");
  const [bill, setBill] = useState(null);

  // Fetch installment details by installment ID
  const handleSearch = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/instalment/${instalmentId}`);
      const data = await response.json();

      if (!response.ok) {
        alert(data.error);
        setInstalmentData(null);
        return;
      }

      setInstalmentData(data);
    } catch (error) {
      console.error("Error fetching installment:", error);
      alert("Failed to fetch installment details.");
    }
  };

  // Handle installment payment
  const handlePayment = async () => {
    if (!instalmentData || !instalmentsToPay) return;

    const instalmentsPaid = parseInt(instalmentsToPay, 10);
    if (instalmentsPaid <= 0 || instalmentsPaid > instalmentData.total_instalments) {
      alert("Invalid installment count");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/pay-instalment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instalment_id: instalmentData.instalment_id,
          sale_id: instalmentData.sale_id,
          cnic: instalmentData.cnic,
          instalments_paid: instalmentsPaid,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.error);
        return;
      }

      alert("Payment successful!");
      setInstalmentData(null);
      setInstalmentsToPay("");
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed.");
    }
  };

  // Fetch unpaid bill details by Sale ID or CNIC
  const handleBillSearch = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/unpaid-sale/${billSearchTerm}`);
      const data = await response.json();

      if (!response.ok) {
        alert(data.error);
        setBill(null);
        return;
      }

      setBill(data);
    } catch (error) {
      console.error("Error fetching unpaid bill:", error);
      alert("Failed to fetch unpaid sale.");
    }
  };

  // Handle unpaid bill payment
  const handleBillPayment = async () => {
    if (!bill) return;

    try {
      const response = await fetch(`${API_BASE_URL}/pay-unpaid-sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sale_id: bill.sale_id }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.error);
        return;
      }

      alert("Unpaid bill settled!");
      setBill(null);
    } catch (error) {
      console.error("Bill payment error:", error);
      alert("Failed to settle bill.");
    }
  };

  return (
    <div>
       <SidebarAdmin/> 
      <div style={{marginLeft: "250px"}}>
      <h2>Instalment Payment</h2>

      <input
        type="text"
        placeholder="Enter Instalment ID"
        value={instalmentId}
        onChange={(e) => setInstalmentId(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      {instalmentData && (
        <table border="1" style={{ marginTop: "20px", width: "100%" }}>
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Sale ID</th>
              <th>Name</th>
              <th>CNIC</th>
              <th>Total Instalments</th>
              <th>Next Instalment Date</th>
              <th>Total Loan</th>
              <th>Total Instalment Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{instalmentData.instalment_id}</td>
              <td>{instalmentData.sale_id}</td>
              <td>{instalmentData.name}</td>
              <td>{instalmentData.cnic}</td>
              <td>{instalmentData.total_instalments}</td>
              <td>{instalmentData.next_instalment_date}</td>
              <td>{instalmentData.total_loan}</td>
              <td>{instalmentData.total_instalment_amount}</td>
            </tr>
          </tbody>
        </table>
      )}

      {instalmentData && (
        <div style={{ marginTop: "20px" }}>
          <h3>Pay Instalments</h3>
          <input
            type="number"
            placeholder="Enter instalments to pay"
            value={instalmentsToPay}
            onChange={(e) => setInstalmentsToPay(e.target.value)}
          />
          <button onClick={handlePayment}>Pay</button>
        </div>
      )}

      <h2>Unpaid Sales</h2>
      <input
        type="text"
        placeholder="Enter Sale ID or CNIC"
        value={billSearchTerm}
        onChange={(e) => setBillSearchTerm(e.target.value)}
      />
      <button onClick={handleBillSearch}>Search</button>

      {bill && (
        <table border="1" style={{ marginTop: "20px", width: "100%" }}>
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>CNIC</th>
              <th>Amount Due</th>
              <th>Due Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{bill.sale_id}</td>
              <td>{bill.cnic}</td>
              <td>{bill.total_unpaid_amount}</td>
              <td>{bill.dueDate}</td>
              <td>
                <button onClick={handleBillPayment}>Pay</button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
    </div>
  );
};

export default AdminInstalmentPayment;
