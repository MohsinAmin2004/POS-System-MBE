import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

const AdminCheckInstalments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [instalments, setInstalments] = useState([]);
  const [unpaidSales, setUnpaidSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suretyInfo, setSuretyInfo] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const instalmentRes = await fetch("http://localhost:5000/instalments");
      const unpaidSalesRes = await fetch("http://localhost:5000/unpaid_sales");

      const instalmentData = await instalmentRes.json();
      const unpaidSalesData = await unpaidSalesRes.json();

      setInstalments(instalmentData);
      setUnpaidSales(unpaidSalesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredInstalments = instalments.filter((customer) =>
    customer.cnic.includes(searchTerm) ||
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnpaidSales = unpaidSales.filter((customer) =>
    customer.cnic.includes(searchTerm) ||
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkOverdueStatus = (nextInstalmentDate) => {
    const today = new Date();
    const instalmentDate = new Date(nextInstalmentDate);
    return instalmentDate < today ? "Overdue" : "On Time";
  };

  const viewSuretyInfo = (surety) => {
    setSuretyInfo(surety);
  };

  const closeSuretyInfo = () => {
    setSuretyInfo(null);
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "250px", padding: "20px", width: "100%" }}>
        <h2>Check Instalments & Unpaid Sales</h2>
        <input
          type="text"
          placeholder="Search by CNIC or Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "300px", padding: "8px", marginBottom: "20px", border: "1px solid #ccc", borderRadius: "4px" }}
        />

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <h3>Instalments</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f4f4f4", textAlign: "center" }}>
                  <th>Loan ID</th>
                  <th>Sale ID</th>
                  <th>Name</th>
                  <th>CNIC</th>
                  <th>Phone</th>
                  <th>Total Instalments Remaining</th>
                
                  <th>Next Instalment Date</th>
                  <th>Per Instalment Amount</th>
                  <th>Remaining Payment</th>
                  <th>Status</th>
                  <th>Surety Name</th>
                  <th>Surety CNIC</th>
                  <th>Surety Phone Number</th>
                  <th>Surety Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstalments.map((customer) => (
                  <tr key={customer.instalment_id} style={{ textAlign: "center" }}>
                    <td>{customer.instalment_id}</td>
                    <td>{customer.sale_id}</td>
                    <td>{customer.name}</td>
                    <td>{customer.cnic}</td>
                    <td>{customer.phone_number}</td>
                    <td>{customer.total_instalments}</td>
                    <td>{customer.next_instalment_date?.split("T")[0] || "N/A"}</td>
                    <td>{customer.total_instalment_amount}</td>
                    <td>{Number(customer.total_loan || 0).toFixed(2)}</td>
                    <td style={{ color: checkOverdueStatus(customer.next_instalment_date) === "Overdue" ? "red" : "green" }}>
                      {checkOverdueStatus(customer.next_instalment_date)}
                    </td>
                    <td>{customer.surety_name}</td>
                    <td>{customer.surety_cnic}</td>
                    <td>{customer.surety_phone_number}</td>
                    <td>{customer.surety_address}</td>
                    
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ marginTop: "40px" }}>Unpaid Sales</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f4f4f4", textAlign: "center" }}>
                  <th>Unpaid Sale ID</th>
                  <th>Sale ID</th>
                  <th>Name</th>
                  <th>CNIC</th>
                  <th>Phone</th>
                  <th>Total Payable</th>
                  <th>Status</th>
                  <th>Surety Name</th>
                  <th>Surety CNIC</th>
                  <th>Surety Phone Number</th>
                  <th>Surety Address</th>

                </tr>
              </thead>
              <tbody>
                {filteredUnpaidSales.map((customer) => (
                  <tr key={customer.unpaid_id} style={{ textAlign: "center" }}>
                    <td>{customer.unpaid_id}</td>
                    <td>{customer.sale_id}</td>
                    <td>{customer.name}</td>
                    <td>{customer.cnic}</td>
                    <td>{customer.phone_number}</td>
                    <td>{Number(customer.total_unpaid_amount || 0).toFixed(2)}</td>
                    <td style={{ color: "red" }}>Overdue</td>
                    <td>{customer.surety_name}</td>
                    <td>{customer.surety_cnic}</td>
                    <td>{customer.surety_phone_number}</td>
                    <td>{customer.surety_address}</td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {suretyInfo && (
          <div className="surety-popup">
            <h3>Surety Information</h3>
            <p><strong>Name:</strong> {suretyInfo.surety_name}</p>
            <p><strong>CNIC:</strong> {suretyInfo.surety_cnic}</p>
            <p><strong>Phone:</strong> {suretyInfo.surety_phone_number}</p>
            <p><strong>Address:</strong> {suretyInfo.surety_address}</p>
            <button onClick={closeSuretyInfo}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCheckInstalments;
