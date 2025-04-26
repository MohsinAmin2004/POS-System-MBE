import React, { useState, useRef } from "react";
import SidebarAdmin from "./Sidebar";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from "../../assets/LOGO.png"; // Adjust path based on your folder structure
const API_BASE_URL = "https://pos-system-mbe.onrender.com"; // Your backend URL

const InstalmentPayment = () => {
  const [instalmentId, setInstalmentId] = useState("");
  const [instalmentData, setInstalmentData] = useState(null);
  const [instalmentsToPay, setInstalmentsToPay] = useState("");
  const [billSearchTerm, setBillSearchTerm] = useState("");
  const [bill, setBill] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showUnpaidBillReceipt, setShowUnpaidBillReceipt] = useState(false);
  const [unpaidreceiptData, setUnpaidReceiptData] = useState(null);
  const printRef = useRef();

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

      // Show receipt with relevant info
      setReceiptData({
        instalment_id: instalmentData.instalment_id,
        sale_id: instalmentData.sale_id,
        name: instalmentData.name,
        cnic: instalmentData.cnic,
        instalments_paid: instalmentsPaid,
        total_amount_paid: instalmentsPaid * instalmentData.total_instalment_amount,
        date: new Date().toLocaleString(),
      });
      setShowReceipt(true);

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


      console.log(bill.sale_id);
      console.log

      //// Show receipt with relevant info
      setUnpaidReceiptData({
        sale_id: bill.sale_id,
        CNIC: bill.cnic,
        paid_amount: bill.total_unpaid_amount,
        date: new Date().toLocaleString(),
        name: bill.customer_name,
      });

      console.log("Hello G", unpaidreceiptData);

      setShowUnpaidBillReceipt(true);

    } catch (error) {
      console.error("Bill payment error:", error);
      alert("Failed to settle bill.");
    }
  };

  const handlePrintReceipt = async () => {
    const element = printRef.current;
    if (!element) return;

    const canvas = await html2canvas(element);
    const data = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4'
    });

    pdf.addImage(data, 'PNG', 40, 10, 250, 300);
    pdf.save('receipt.pdf');
  };

  const ProductsTable = ({ saleId }) => {
    const [products, setProducts] = useState([]);
    const [date, setDate] = useState([]);
  
    React.useEffect(() => {
      const fetchProducts = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/sale-products/${saleId}`);
          const data = await response.json();
          if (response.ok) {
            setProducts(data.products); // assuming your API returns { products: [...] }
            setDate(data.date);
          } else {
            console.error(data.error || "Failed to fetch products");
          }
        } catch (error) {
          console.error("Error fetching products:", error);
        }
      };
  
      fetchProducts();
    }, [saleId]);
  
    if (products.length === 0) {
      return <p>No products found for this sale.</p>;
    }
  
    return (
      <div style={{ marginTop: "20px" }}>
      <p><strong>Date of Purchase:</strong> {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      
        <h4>Products Purchased</h4>
        <table border="1" style={{ width: "100%", marginTop: "10px" }}>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Price (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td>{product.model}</td>
                <td>{product.quantity}</td>
                <td>{product.selling_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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

      {/* Receipt Popup for Instalments */}
      {showReceipt && receiptData && (
      <div className="invoice-popup">
        <div className="popup-content">
          <h2>Payment Receipt</h2>

          <div ref={printRef} className="receipt" style={{ backgroundColor: "white", padding: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <img src={logo} alt="Company Logo" width={150} height={150} />
            </div>
            <h4>Instalment Payment Receipt</h4>
            <p><strong>Instalment ID:</strong> {receiptData.instalment_id}</p>
            <p><strong>Sale ID:</strong> {receiptData.sale_id}</p>
            <p><strong>Name:</strong> {receiptData.name}</p>
            <p><strong>CNIC:</strong> {receiptData.cnic}</p>
            <p><strong>Instalments Paid:</strong> {receiptData.instalments_paid}</p>
            <p><strong>Total Amount Paid:</strong> {receiptData.total_amount_paid} PKR</p>
            <p><strong>Payment Date:</strong> {receiptData.date}</p>

            {/* New: Products Table */}
            <ProductsTable saleId={receiptData.sale_id} />
          </div>

          <div style={{ marginTop: "20px" }}>
            <button onClick={handlePrintReceipt}>Download Receipt</button>
            <button onClick={() => setShowReceipt(false)} style={{ marginLeft: "10px" }}>Close</button>
          </div>
        </div>
      </div>
    )}

    {/* Receipt Popup for Instalments */}
    {showUnpaidBillReceipt && unpaidreceiptData && (
      <div className="invoice-popup">
        <div className="popup-content">
          <h2>Payment Receipt</h2>

          <div ref={printRef} className="receipt" style={{ backgroundColor: "white", padding: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <img src={logo} alt="Company Logo" width={150} height={150} />
            </div>
            <h4>Unpaid Bill Payment Receipt</h4>
            <p><strong>Sale ID:</strong> {unpaidreceiptData.sale_id}</p>
            <p><strong>Name:</strong> {unpaidreceiptData.name}</p>
            <p><strong>CNIC:</strong> {unpaidreceiptData.CNIC}</p>
            <p><strong>Total Amount Paid:</strong> {unpaidreceiptData.paid_amount} PKR</p>
            <p><strong>Payment Date:</strong> {unpaidreceiptData.date}</p>

            {/* New: Products Table */}
            <ProductsTable saleId={unpaidreceiptData.sale_id} />
          </div>

          <div style={{ marginTop: "20px" }}>
            <button onClick={handlePrintReceipt}>Download Receipt</button>
            <button onClick={() => setShowReceipt(false)} style={{ marginLeft: "10px" }}>Close</button>
          </div>
        </div>
      </div>
    )}

      </div>
    </div>
  );
};

export default InstalmentPayment;
