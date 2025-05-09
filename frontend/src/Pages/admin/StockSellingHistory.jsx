import React, { useEffect, useState, useRef } from "react";
import { DateTime } from "luxon";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import logo from "../../assets/LOGO.png";
import SidebarAdmin from "./Sidebar";
const SalesTable = () => {
    const [sales, setSales] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);
    const [showInvoicePopup, setShowInvoicePopup] = useState(false);
    const printRef = useRef();

    useEffect(() => {
        fetch("https://pos-system-mbe.onrender.com/api/sales")
            .then(response => response.json())
            .then(data => setSales(data))
            .catch(error => console.error("Error fetching sales:", error));
    }, []);

    const viewSaleDetails = (sale_id) => {
        fetch(`https://pos-system-mbe.onrender.com/api/sale/${sale_id}`)
            .then(response => response.json())
            .then(data => {
                setSelectedSale(data);
                setShowInvoicePopup(true);  // Show popup
            })
            .catch(error => console.error("Error fetching sale details:", error));
    };

    const handlePrintInvoice = async() => {
      const element = printRef.current;
      console.log(element);
    
      if(!element){
        return;
      }
    
      const canvas = await html2canvas(element);
      const data = canvas.toDataURL('image/png');
    
      const pdf = new jsPDF(
        {
          orientation:'portrait',
          unit: "px",
          format: "a4"
        }
      );
    
      pdf.addImage(data, 'PNG', 40, 20, 250, 400);
      pdf.save('invoice.pdf');
    
    
    }
    const [searchCustomer, setSearchCustomer] = useState("");
    const [selectedShop, setSelectedShop] = useState("All");
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("All");

    // Unique shops and statuses for dropdowns
    const uniqueShops = [...new Set(sales.map(sale => sale.shop_id))];
    const uniqueStatuses = [...new Set(sales.map(sale => sale.payment_status))];

    // Filter logic
    const filteredSales = sales.filter(sale => {
        const matchesShop = selectedShop === "All" || String(sale.shop_id) === selectedShop;
        const matchesCustomer = sale.customer_name.toLowerCase().includes(searchCustomer.toLowerCase());
        const matchesStatus = selectedPaymentStatus === "All" || sale.payment_status === selectedPaymentStatus;
        return matchesShop && matchesCustomer && matchesStatus;
    });

    return (
        <div>
            <SidebarAdmin/>
            <div style={{ marginLeft: "250px" }}>
            <h2>All Sales</h2>
            <div style={{ marginBottom: "20px" }}>
                <label>
                    Filter by Shop ID:
                    <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} style={{ margin: "0 10px" }}>
                        <option value="All">All</option>
                        {uniqueShops.map(shop => (
                            <option key={shop} value={shop}>{shop}</option>
                        ))}
                    </select>
                </label>

                <label>
                    Payment Status:
                    <select value={selectedPaymentStatus} onChange={(e) => setSelectedPaymentStatus(e.target.value)} style={{ margin: "0 10px" }}>
                        <option value="All">All</option>
                        {uniqueStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </label>

                <label>
                    Search Customer:
                    <input
                        type="text"
                        placeholder="Enter customer name"
                        value={searchCustomer}
                        onChange={(e) => setSearchCustomer(e.target.value)}
                        style={{ marginLeft: "10px", padding: "5px" }}
                    />
                </label>
            </div>

            <table border="1">
                <thead>
                    <tr>
                        <th>Sale ID</th>
                        <th>Customer Name</th>
                        <th>Phone</th>
                        <th>Total Payable</th>
                        <th>Payment Status</th>
                        <th>Date</th>
                        <th>Sold By</th>
                        <th>Shop</th>
                        <th>Action</th>
                        
                    </tr>
                </thead>
                <tbody>
                {filteredSales.map(sale => (

                        <tr key={sale.sale_id}>
                            <td>{sale.sale_id}</td>
                            <td>{sale.customer_name}</td>
                            <td>{sale.phone_number}</td>
                            <td>{sale.total_payable}</td>
                            <td>{sale.payment_status}</td>
                            <td>{new Date(sale.date_of_selling).toLocaleDateString()}</td>
                            <td>{sale.sold_by}</td>
                            <td>{sale.shop_id}</td>
                            <td>
                                <button onClick={() => viewSaleDetails(sale.sale_id)}>View</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Invoice Popup */}
            {showInvoicePopup && selectedSale && (
                <div className="invoice-popup">
                    <div className="popup-content">
                        <h2>Invoice Preview</h2>

                        <div ref={printRef} className="receipt">
                            <div className="logo-container">
                                <img src={logo} alt="Company Logo" width={150} height={150} className="receipt-logo" />
                            </div>
                            <h4>Sale ID: {selectedSale.sale.sale_id}</h4>

                            <h3>Customer Information</h3>
                            {selectedSale.customer ? (
                                <div>
                                    <p><strong>Name:</strong> {selectedSale.customer.name}</p>
                                    <p><strong>CNIC:</strong> {selectedSale.customer.cnic}</p>
                                    <p><strong>Phone:</strong> {selectedSale.customer.phone_number}</p>
                                    <p><strong>Address:</strong> {selectedSale.customer.address}</p>
                                </div>
                            ) : (
                                <p>No customer selected</p>
                            )}

                            <h3>Products</h3>
                            <table border="1">
                                <thead>
                                    <tr>
                                        <th>Model</th>
                                        <th>Quantity</th>
                                        <th>Original Price (PKR)</th>
                                        <th>Selling Price (PKR)</th>
                                        <th>Discount</th>
                                        <th>Total (PKR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSale.saleItems.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.model}</td>
                                            <td>{item.quantity}</td>
                                            <td>{(Number(item.selling_price) - Number(item.discount))} PKR</td>
                                            <td>{item.selling_price} PKR</td>
                                            <td>{-Number(item.discount)} PKR</td>
                                            <td>{(item.selling_price * item.quantity - item.discount).toFixed(2)} PKR</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <h3>Invoice Summary</h3>
                            <p><strong>Total Payable:</strong> {selectedSale.sale.total_payable} PKR</p>
                            <p><strong>Total Discount:</strong> {selectedSale.sale.total_discount} PKR</p>
                            <p><strong>Payment Status:</strong> {selectedSale.sale.payment_status}</p>

                            {/* Installment Details */}
                            {selectedSale.installment && (
                                <>

                                    <h3>Surety Details</h3>
                                    <p><strong>Surety Name:</strong> {selectedSale.installment.surety_name}</p>
                                    <p><strong>Surety CNIC:</strong> {selectedSale.installment.surety_cnic}</p>
                                    <p><strong>Surety Address:</strong> {selectedSale.installment.surety_address}</p>
                                    <p><strong>Surety Phone Number:</strong> {selectedSale.installment.surety_phone_number}</p>
                                    

                                    <h3>Installment Details</h3>
                                    <p><strong>Down Payment:</strong> {selectedSale.installment.down_payment}</p>
                                    <p><strong>Margin:</strong> {selectedSale.installment.margin_percentage}%</p>
                                    
                                    <p><strong>Total Loan:</strong> {selectedSale.installment.total_loan}</p>
                                    
                                    <p><strong>Remaining Loan Amount to be paid:</strong> {selectedSale.installment.remaining_balance}</p>
                                    <p><strong>Instalments Remaining:</strong> {selectedSale.installment.total_instalments} Months</p>
                                    <p><strong>Next Installment Date:</strong> {selectedSale.installment.next_instalment_date?.slice(0, 10)}</p>

                                </>
                            )}

                            {/* Unpaid Details */}
                            {selectedSale.unpaid && (
                                <>

                                    <h3>Surety Details</h3>
                                    <p><strong>Surety Name:</strong> {selectedSale.unpaid.surety_name}</p>
                                    <p><strong>Surety CNIC:</strong> {selectedSale.unpaid.surety_cnic}</p>
                                    <p><strong>Surety Address:</strong> {selectedSale.unpaid.surety_address}</p>
                                    <p><strong>Surety Phone Number:</strong> {selectedSale.unpaid.surety_phone_number}</p>
                                    

                                    <h3>Unpaid Details</h3>
                                    <p><strong>Total Unpaid Amount:</strong> {selectedSale.unpaid.total_unpaid_amount}</p>
                                </>
                            )}
                        </div>

                        <div className="popup-buttons">
                            <button onClick={handlePrintInvoice}>Print</button>
                            <button onClick={() => setShowInvoicePopup(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Styles */}
            <style>
                {`
                .invoice-popup {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .popup-content {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    max-width: 600px;
                    width: 100%;
                    text-align: center;
                }

                .popup-buttons {
                    margin-top: 20px;
                }

                .popup-buttons button {
                    margin: 5px;
                    padding: 10px;
                    cursor: pointer;
                }

                .receipt {
                    text-align: left;
                }

                .logo-container {
                    text-align: center;
                    margin-bottom: 10px;
                }
                `}
            </style>
        </div>
        </div>
    );
};

export default SalesTable;
