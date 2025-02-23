import React, { useState, useEffect, useRef } from "react";
import './CSS/popup.css';
import SidebarManager from "./Sidebar_manager"; // Import the Sidebar
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from "../../assets/LOGO.png";

function InvoicePage() {
  const [id, setId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [addedProducts, setAddedProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);

  const [customerCNIC, setCustomerCNIC] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ cnic: "", name: "", phone_number: "", address: "", });
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const [paymentType, setPaymentType] = useState(""); // Default empty
  const [downPayment, setDownPayment] = useState(0);
  const [margin, setMargin] = useState(0);
  const [installments, setInstallments] = useState(1);
  const [totalBill, setTotalBill] = useState(0);
  const [toBePaid, setToBePaid] = useState(0);
  const [nextInstallmentDate, setNextInstallmentDate] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState(0);
  const [products, setProducts] = useState([]); // Store stock from API
  const [customers, setCustomers] = useState([]); // Store customers from API


  const printRef = React.useRef(null);
  // Surety-related state
  const [suretyCnic, setSuretyCnic] = useState("");
  const [suretyAddress, setSuretyAddress] = useState("");
  const [suretyName, setSuretyName] = useState("");
  const [suretyPhone, setSuretyPhone] = useState("");
  const [marginAmount, setMarginAmount] = useState(0);

  
  // Fetch data from API
  useEffect(() => {
    fetch("http://localhost:5000/invoice")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.stock);
        setCustomers(data.customers);
      })


      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Handle Product Search
  useEffect(() => {
    const filtered = products.filter((product) =>
      product.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  
  // Handle Customer Search
  const handleCustomerSearch = () => {
    const foundCustomer = customers.find((cust) => cust.cnic === customerCNIC);
    setSelectedCustomer(foundCustomer || null);
    setShowCustomerForm(!foundCustomer);

  };

  // Handle new customer input
  const handleNewCustomerInput = (field, value) => {
    setNewCustomer((prevCustomer) => ({
      ...prevCustomer,
      [field]: value,
    }));
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
  
  const handleSelectNewCustomer = async () => {
    newCustomer.cnic = customerCNIC;
    if (!newCustomer.name || !newCustomer.phone_number || !newCustomer.cnic || !newCustomer.address) {
      window.alert("All Fields Required");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCustomer),
      });
  
      const customerData = await response.json();
      
  
      if (!response.ok) {
        throw new Error(customerData.error || "Failed to add customer");
      }
  
      setSelectedCustomer(customerData);
      setShowCustomerForm(false);
    } catch (error) {
      
    }
  };
  
  

  // Handle search input
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    if (query) {
      const filtered = products.filter((p) =>
        p.model.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowDropdown(true); // Show dropdown when typing
    } else {
      setFilteredProducts([]);
      setShowDropdown(false);
    }
  };
  const searchRef = useRef(null);
  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle adding product to table
  const handleAddProduct = (product) => {
    setAddedProducts([...addedProducts, { ...product, sellingPrice: product.originalPrice, quantity: 1 }]);
    setSearchTerm("");
    setFilteredProducts([]);
  };

  // Handle removing a product
  const handleRemoveProduct = (model) => {
    setAddedProducts(addedProducts.filter(p => p.model !== model));
  };

  // Handle quantity and selling price updates
  const handleQuantityPriceChange = (index, field, value) => {
    const updatedProducts = [...addedProducts];

    if (field === "sellingPrice") {
      updatedProducts[index].sellingPrice = parseFloat(value) || 0;
    } else if (field === "quantity") {
      updatedProducts[index].quantity = Math.max(1, parseInt(value) || 1);
    }

    setAddedProducts(updatedProducts);
  };

  // Calculate total values
  const totalAmount = addedProducts.reduce((sum, p) => sum + p.selling_price * p.quantity, 0);
  const totalSellingPrice = addedProducts.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  const totalDiscount = totalAmount - totalSellingPrice;

  // Calculate Total Bill and Installments whenever values change
  useEffect(() => {
    if (paymentType === "loan") {
      const calculatedTotalBill = totalSellingPrice * (1 + margin / 100);
      const calculatedToBePaid = calculatedTotalBill - downPayment;
      const installmentAmt = calculatedToBePaid / installments;

      setTotalBill(calculatedTotalBill);
      setToBePaid(calculatedToBePaid);
      setInstallmentAmount(installmentAmt);

      // Calculate next installment date (next month)
      const today = new Date();
      const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
      setNextInstallmentDate(nextMonth.toISOString().split("T")[0]); // Format YYYY-MM-DD
    }
  }, [paymentType, downPayment, margin, installments]);
  

  const handleInvoiceSubmission = async () => {
    try {
      const invoiceData = {
        cnic: customerCNIC,
        items: addedProducts.map(product => ({
          model: product.model,
          shop_id: product.shop_id,
          quantity: product.quantity,
          selling_price: product.sellingPrice,
          discount: product.sellingPrice - product.selling_price || 0
        })),
        total_amount: totalAmount,
        total_discount: totalDiscount,
        final_payable: totalSellingPrice,
        payment_status: paymentType === "paid" ? "Paid" : paymentType === "payLater" ? "Unpaid" : "Instalments",
        installments: paymentType === "loan" ? {
          total_instalments: installments,
          next_instalment_date: nextInstallmentDate,
          instalment_amount: installmentAmount,
          margin_amount: marginAmount,
          margin_percentage: margin,
          down_payment: downPayment,
          total_payment: toBePaid,
          remaining_balance: totalAmount - downPayment,
          overdue_status: 1
        } : null,
        sold_by: "Seller Name", // Change accordingly
        surety_cnic: paymentType === "loan" || paymentType === "payLater" ? suretyCnic : null,
        surety_name: paymentType === "loan" || paymentType === "payLater" ? suretyName : null,
        surety_phone_number: paymentType === "loan" || paymentType === "payLater" ? suretyPhone : null,
        surety_address: paymentType === "loan" || paymentType === "payLater" ? suretyAddress : null
      };
  
      const response = await fetch("http://localhost:5000/invoice-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData)
      });
  
      const textResponse = await response.text(); // Read response as text first
  
      if (!response.ok) {
        throw new Error(`Error: ${textResponse || response.statusText}`);
      }
  
      const result = textResponse ? JSON.parse(textResponse) : {}; // Parse only if not empty
      console.log("Response received:", result);
      setId(result.saleId);
      alert("Invoice submitted successfully!");
      setShowInvoicePopup(true);
  
    } catch (error) {
      console.error("Error submitting invoice:", error);
      alert(error.message);
    }
  };
  

  return (
    <>
  <SidebarManager/>
  <div style={{ marginLeft: "250px" }}>
  <h1>Invoice Page</h1>
  <div className="searching-products" ref={searchRef} style={{ position: "relative", width: "99%" }}>
  <input
    type="text"
    placeholder="Search by Model Number"
    value={searchTerm}
    onChange={handleSearchChange}
    onFocus={() => setShowDropdown(true)} // Show dropdown when clicking
    style={{
      width: "99%",
      padding: "10px",
      fontSize: "16px",
      border: "1px solid #ccc",
      borderRadius: "4px"
    }}
  />
  {showDropdown && filteredProducts.length > 0 && (
    <ul
      className="suggestions"
      style={{
        position: "absolute",
        width: "100%",
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "4px",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        maxHeight: "200px",
        overflowY: "auto",
        padding: "0",
        margin: "0",
        zIndex: "1000"
      }}
    >
      {filteredProducts.map((product) => (
        <li
          key={product.model}
          onClick={() => handleAddProduct(product)}
          style={{
            listStyle: "none",
            padding: "10px",
            cursor: "pointer",
            borderBottom: "1px solid #eee",
            transition: "background-color 0.2s ease-in-out"
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#f5f5f5")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "white")}
        >
          {product.model} - {product.name}
        </li>
      ))}
    </ul>
  )}
</div>

      {/* Invoice Table */}
      <table border="1">
        <thead>
          <tr>
            <th>Model</th>
            <th>Product Name</th>
            <th>Original Price (PKR)</th>
            <th>Selling Price (PKR)</th>
            <th>Quantity</th>
            <th>Total Selling Price (PKR)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {addedProducts.map((product, index) => (
            <tr key={index}>
              <td>{product.model}</td>
              <td>{product.name}</td>
              
              <td>{product.selling_price} PKR</td>
              <td>
                <input
                  type="number"
                  value={product.sellingPrice  || 0}
                  onChange={(e) => handleQuantityPriceChange(index, "sellingPrice", e.target.value)}
                  min="0"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={product.quantity}
                  onChange={(e) => handleQuantityPriceChange(index, "quantity", e.target.value)}
                  min="1"
                />
              </td>
              <td>{(product.sellingPrice * product.quantity)  || 0} PKR</td>
              <td>
                <button onClick={() => handleRemoveProduct(product.model)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Invoice Totals */}
      <div className="totals">
        <p><strong>Total Amount:</strong> {totalAmount } PKR</p>
        <p><strong>Total Discount:</strong> {totalDiscount} PKR</p>
        <p><strong>Final Total:</strong> {totalSellingPrice} PKR</p>
      </div>

      {/* Customer Search Section */}
      <div className="customer-search">
        <input
          type="text"
          placeholder="Enter Customer CNIC"
          value={customerCNIC}
          onChange={(e) => setCustomerCNIC(e.target.value)}
        />
        <button onClick={handleCustomerSearch}>Search</button>
      </div>

      {/* New Customer Form (If Not Found) */}
      {showCustomerForm && (
        <div className="new-customer-form">
          <input
            type="text"
            placeholder="Enter Name"
            value={newCustomer.name}
            onChange={(e) => 
              {
                handleNewCustomerInput("name", e.target.value);
                handleNewCustomerInput("cnic", customerCNIC);
              }}
            
          />
          <input
            type="text"
            placeholder="Enter Phone Number"
            value={newCustomer.phone_number}
            onChange={(e) => handleNewCustomerInput("phone_number", e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter Address Address"
            value={newCustomer.address}
            onChange={(e) => handleNewCustomerInput("address", e.target.value)}
          />
          
          <button onClick={handleSelectNewCustomer}>Add Customer</button>
        </div>
      )}

      {/* Display Selected Customer Info */}
      {selectedCustomer && (
        <div className="customer-details">
          <p><strong>Name:</strong> {selectedCustomer.name}</p>
          <p><strong>CNIC:</strong> {selectedCustomer.cnic}</p>
          <p><strong>Phone:</strong> {selectedCustomer.phone_number}</p>
          <p><strong>Phone:</strong> {selectedCustomer.address}</p>
        </div>
      )}

<div className="payment-options">
      <label>
        <input
          type="radio"
          name="paymentType"
          value="paid"
          checked={paymentType === "paid"}
          onChange={() => setPaymentType("paid")}
        />
        Paid
      </label>

      <label>
        <input
          type="radio"
          name="paymentType"
          value="payLater"
          checked={paymentType === "payLater"}
          onChange={() => setPaymentType("payLater")}
        />
        Pay Later
      </label>

      <label>
        <input
          type="radio"
          name="paymentType"
          value="loan"
          checked={paymentType === "loan"}
          onChange={() => setPaymentType("loan")}
        />
        Loan Payment
      </label>

      {/* Display Payment Status */}
      {paymentType === "paid" && <p><strong>Status:</strong> Paid</p>}
      {paymentType === "payLater" && <p><strong>Status:</strong> Unpaid</p>}

      {/* Surety Information (Only for Unpaid or Loan Sales) */}
{(paymentType === "payLater" || paymentType === "loan") && (
  <div className="surety-info">
    <h3>Surety Information</h3>
    <input type="text" placeholder="Surety CNIC" value={suretyCnic} onChange={(e) => setSuretyCnic(e.target.value)} />
    <input type="text" placeholder="Surety Name" value={suretyName} onChange={(e) => setSuretyName(e.target.value)} />
    <input type="text" placeholder="Surety Phone" value={suretyPhone} onChange={(e) => setSuretyPhone(e.target.value)} />
    <input type="text" placeholder="Surety Address" value={suretyAddress} onChange={(e) => setSuretyAddress(e.target.value)} />
  </div>
)}

      {/* Loan Payment Fields */}
      {paymentType === "loan" && (
        <div className="loan-details">
          <label>
            Down Payment (PKR):
            <input
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
            />
          </label>

          <label>
            Margin (%):
            <input
              type="number"
              value={margin}
              onChange={(e) => setMargin(parseFloat(e.target.value) || 0)}
            />
          </label>

          <label>
            Installments (Months):
            <input
              type="number"
              value={installments}
              onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
              min="1"
            />
          </label>

          {/* Calculated Fields */}
          <p><strong>Total Bill (PKR):</strong> {totalBill.toFixed(2)}</p>
          <p><strong>To Be Paid (PKR):</strong> {toBePaid.toFixed(2)}</p>

          {/* Next Installment Details */}
          <label>
            Next Installment Payment Date:
            <input type="text" value={nextInstallmentDate} readOnly />
          </label>

          <label>
            Installment Amount (PKR):
            <input type="text" value={installmentAmount.toFixed(2)} readOnly />
          </label>
        </div>
      )}
    </div>
    <button onClick={handleInvoiceSubmission}>Generate Invoice</button>
    </div>      

    {showInvoicePopup && (
  <div className="invoice-popup">
    <div className="popup-content">
      <h2>Invoice Preview</h2>

      {/* Customer Details */}
    <div ref={printRef} className="receipt">
      {/* Add your logo here */}
                  <div className="logo-container">
                    <img src={logo} alt="Company Logo" width={150} height={150} className="receipt-logo" />
                  </div>
      <h4>Sale ID: {id}</h4>
      <h3>Customer Information</h3>
      {selectedCustomer ? (
        <div>
          <p><strong>Name:</strong> {selectedCustomer.name}</p>
          <p><strong>CNIC:</strong> {selectedCustomer.cnic}</p>
          <p><strong>Phone:</strong> {selectedCustomer.phone_number}</p>
          <p><strong>Address:</strong> {selectedCustomer.address}</p>
        </div>
      ) : (
        <p>No customer selected</p>
      )}

      {/* Invoice Table */}
      <h3>Products</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Model</th>
            <th>Product Name</th>
            <th>Original Price (PKR)</th>
            <th>Selling Price (PKR)</th>
            <th>Quantity</th>
            <th>Total (PKR)</th>
          </tr>
        </thead>
        <tbody>
          {addedProducts.map((product, index) => (
            <tr key={index}>
              <td>{product.model}</td>
              <td>{product.name}</td>
              <td>{product.selling_price} PKR</td>
              <td>{product.sellingPrice} PKR</td>
              <td>{product.quantity}</td>
              <td>{(product.sellingPrice * product.quantity).toFixed(2)} PKR</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Invoice Totals */}
      <h3>Invoice Summary</h3>
      <p><strong>Total Amount:</strong> {totalAmount} PKR</p>
      <p><strong>Total Discount:</strong> {totalDiscount} PKR</p>
      <p><strong>Final Payable:</strong> {totalSellingPrice} PKR</p>
      <p><strong>Payment Status:</strong> {paymentType}</p>

      {/* Surety Information (Only for Unpaid or Loan Sales) */}
      {(paymentType === "payLater" || paymentType === "loan") && (
        <>
          <h3>Surety Information</h3>
          <p><strong>Surety CNIC:</strong> {suretyCnic}</p>
          <p><strong>Surety Name:</strong> {suretyName}</p>
          <p><strong>Surety Phone:</strong> {suretyPhone}</p>
          <p><strong>Surety Address:</strong> {suretyAddress}</p>
        </>
      )}

      {/* Loan Payment Details */}
      {paymentType === "loan" && (
        <>
          <h3>Loan Payment Details</h3>
          <p><strong>Down Payment:</strong> {downPayment} PKR</p>
          <p><strong>Margin (%):</strong> {margin}%</p>
          <p><strong>Total Bill:</strong> {totalBill.toFixed(2)} PKR</p>
          <p><strong>To Be Paid:</strong> {toBePaid.toFixed(2)} PKR</p>
          <p><strong>Installments:</strong> {installments} months</p>
          <p><strong>Next Installment Date:</strong> {nextInstallmentDate}</p>
          <p><strong>Installment Amount:</strong> {installmentAmount.toFixed(2)} PKR</p>
        </>
      )}
    </div>
      {/* Buttons */}
      <div className="popup-buttons">
        <button onClick={handlePrintInvoice}>Print</button>
        <button onClick={() => setShowInvoicePopup(false)}>Close</button>
      </div>
    </div>
  </div>
)}


    </>
  );

};
export default InvoicePage;
