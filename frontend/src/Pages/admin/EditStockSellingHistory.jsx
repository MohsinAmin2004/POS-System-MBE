import React, { useEffect, useState } from "react";
import SidebarAdmin from "./Sidebar";

const AdminEditStockSellingHistory = () => {
    const [sales, setSales] = useState([]);

    // Fetch Sales Data
    useEffect(() => {
        fetch("https://pos-system-mbe.onrender.com/api/sales")
            .then(response => response.json())
            .then(data => setSales(data))
            .catch(error => console.error("Error fetching sales:", error));
    }, []);

    // Delete Sale Function
    const deleteSale = async (sale_id) => {
        if (!window.confirm("Are you sure you want to delete this sale? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch("https://pos-system-mbe.onrender.com/api/delete-sale", {
                method: "POST", // Using POST instead of DELETE for flexibility
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sale_id }),
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                setSales(sales.filter(sale => sale.sale_id !== sale_id)); // Remove from UI
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            console.error("Error deleting sale:", error);
            alert("An error occurred while deleting the sale.");
        }
    };

    return (
        <div>
          <SidebarAdmin/>
          <div style={{marginLeft: "250px"}}>
            <h2>Stock Edit Page</h2>
            <table border="1">
                <thead>
                    <tr>
                        <th>Sale ID</th>
                        
                        <th>Total Payable Bill</th>
                        <th>Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => (
                        <tr key={sale.sale_id}>
                            <td>{sale.sale_id}</td>
                        
                            <td>{sale.total_payable}</td>
                            <td>{sale.date_of_selling?.slice(0, 10)}</td>
                            <td>
                                <button onClick={() => deleteSale(sale.sale_id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        </div>
    );
};

export default AdminEditStockSellingHistory;
