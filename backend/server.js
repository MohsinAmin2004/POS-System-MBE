const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Client } = require("pg");
const { DateTime } = require('luxon');

require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;

const SECRET_KEY = process.env.JWT_SECRET || "your_super_secret_key";

// const client = new Client({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     port: process.env.DB_PORT,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
// });

const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "pass",
    database: "Malik_Brother_Electronics"
    // ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
});


client.connect()
    .then(() => console.log("✅ Connected to PostgreSQL"))
    .catch(err => console.error("❌ Database connection error:", err));

app.use(cors());
app.use(express.json()); // For parsing JSON requests



const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1]; // Extract token after "Bearer"

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token." });
    }
};

// 🔹 Secure Route: Add Admin (Only accessible to authenticated users)
app.post("/add-admin", verifyToken, async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert into database
        const query = "INSERT INTO Admin (name, username, password) VALUES ($1, $2, $3) RETURNING *";
        const values = [name, username, hashedPassword];

        const result = await client.query(query, values);
        res.status(201).json({ message: "Admin added successfully", admin: result.rows[0] });

    } catch (error) {
        console.error("Error adding admin:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Manager Login Route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await client.query("SELECT * FROM Managers WHERE username = $1", [username]);
        

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const manager = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, manager.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: manager.manager_id, username: manager.username, role: "manager", shop_id: manager.shop_id }, SECRET_KEY, { expiresIn: "12h" });
        console.log(manager.shop_id);
        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("Manager login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Admin Login Route (Generates JWT Token)
app.post("/admin-login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await client.query("SELECT * FROM Admin WHERE username = $1", [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const admin = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT Token with 2-minute expiration
        const token = jwt.sign({ id: admin.admin_id, username: admin.username, role: "admin" }, SECRET_KEY, { expiresIn: "10m" });

        // localStorage.setItem("token", response.token);

        res.json({ message: "Login successful", token });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Route: Add Shop
app.post("/add-shop", async (req, res) => {
    const { name, location } = req.body;

    if (!name || !location) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const query = "INSERT INTO Shops (name, location) VALUES ($1, $2) RETURNING *";
        const values = [name, location];

        const result = await client.query(query, values);
        res.status(201).json({ message: "Shop added successfully", shop: result.rows[0] });
    } catch (error) {
        console.error("Error adding shop:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Route: Get All Shops
app.get("/shops", async (req, res) => {
    try {
        const result = await client.query("SELECT * FROM Shops ORDER BY shop_id DESC");
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching shops:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Middleware for authentication
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
};

// Get stock details
app.get('/stock', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM stock');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get stock details for a specific shop
app.get('/stock/:shop_id', async (req, res) => {
    const { shop_id } = req.params;

    try {
        const result = await client.query('SELECT * FROM stock WHERE shop_id = $1', [shop_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Add new stock item if it doesn't exist and log the change
app.post('/stock/add', async (req, res) => {
    const { model, brand, name, shop_id, quantity, purchasing_price, selling_price } = req.body;

    try {
        const existingStock = await client.query(
            'SELECT * FROM stock WHERE model = $1 AND shop_id = $2',
            [model, shop_id]
        );

        if (existingStock.rows.length === 0) {
            // Insert new stock item
            const newStock = await client.query(
                `INSERT INTO stock (model, brand, name, shop_id, quantity, purchasing_price, selling_price) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [model, brand, name, shop_id, quantity, purchasing_price, selling_price]
            );

            // Log the new stock addition in Stock_Edit_Log
            await client.query(
                `INSERT INTO stock_edit_log (model, shop_id, previous_quantity, new_quantity, edit_time, action_type) 
                 VALUES ($1, $2, $3, $4, NOW(), 'Added')`,
                [model, shop_id, 0, quantity] // Previous quantity is 0 since it's a new item
            );

            // Log entry in Stock Ledger
            await client.query(
                `INSERT INTO stock_ledger (model, shop_id, brand, name, quantity, purchasing_price) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [model, shop_id, brand, name, quantity, purchasing_price]
            );

            res.json(newStock.rows[0]);
        } else {
            res.status(400).json({ message: 'Stock item already exists' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Update stock and log changes
app.put('/stock/update', async (req, res) => {
    const stockItems = req.body.stock;
    if (!Array.isArray(stockItems)) {
        return res.status(400).json({ message: "Invalid request format. Expected an array." });
    }

    try {
        let updatedStock = [];

        for (const item of stockItems) {
            const { model, name, brand, shop_id, quantity, purchasing_price, selling_price } = item;

            const existingStock = await client.query(
                'SELECT * FROM stock WHERE model = $1 AND shop_id = $2',
                [model, shop_id]
            );

            if (existingStock.rows.length > 0) {
                const prevQuantity = existingStock.rows[0].quantity;
                const newQuantity = prevQuantity + quantity;

                const updateResult = await client.query(
                    `UPDATE stock 
                     SET model = $1, name = $2, brand = $3, quantity = $4, purchasing_price = $5, selling_price = $6 
                     WHERE model = $7 AND shop_id = $8 
                     RETURNING *`,
                    [model, name, brand, newQuantity, purchasing_price, selling_price, existingStock.rows[0].model, shop_id]
                );

                await client.query(
                    `INSERT INTO stock_edit_log (model, shop_id, previous_quantity, new_quantity, edit_time, action_type) 
                     VALUES ($1, $2, $3, $4, NOW(), 'Updated')`,
                    [model, shop_id, prevQuantity, newQuantity]
                );

                if (quantity != 0) {
                    await client.query(
                        `INSERT INTO stock_ledger (model, shop_id, brand, name, quantity, purchasing_price) 
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [model, shop_id, brand, name, quantity, purchasing_price]
                    );
                }

                updatedStock.push(updateResult.rows[0]);
            } else {
                updatedStock.push({ model, shop_id, message: "Stock item not found" });
            }
        }

        res.json({ updatedStock });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
// Fetch complete stock ledger (without filtering by date)
app.get("/ledger", async (req, res) => {
    try {
        const query = "SELECT ledger_id, date, model, brand, name, quantity, shop_id, purchasing_price, total_price FROM stock_ledger ORDER BY date DESC";
        const result = await client.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});


// Route: Fetch All Users (Admins and Managers)
app.get("/users", async (req, res) => {
    try {
        const admins = await client.query("SELECT * FROM admin");
        const managers = await client.query("SELECT * FROM managers");

        const users = [...admins.rows, ...managers.rows];
        res.json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/add-user", verifyToken, async (req, res) => {
    const { name, username, password, role, shop_id } = req.body;

    if (!name || !username || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        let query, values;

        if (role === "admin") {
            query = "INSERT INTO Admin (name, username, password) VALUES ($1, $2, $3) RETURNING *";
            values = [name, username, hashedPassword];
        } else if (role === "manager") {
            if (!shop_id) {
                return res.status(400).json({ error: "Shop ID is required for managers" });
            }
            query = "INSERT INTO Managers (name, username, password, shop_id) VALUES ($1, $2, $3, $4) RETURNING *";
            values = [name, username, hashedPassword, shop_id];
        } else {
            return res.status(400).json({ error: "Invalid role specified" });
        }

        const result = await client.query(query, values);
        res.status(201).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} added successfully`, user: result.rows[0] });

    } catch (error) {
        console.error(`Error adding ${role}:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/instalments", async (req, res) => {
    const query = `
        SELECT 
            i.instalment_id, 
            i.sale_id,
            i.cnic, 
            c.name, 
            c.phone_number, 
            c.job,
            c.fathername,
            i.total_instalments, 
            i.next_instalment_date, 
            i.overdue_status, 
            i.total_instalment_amount,  
            (i.total_instalment_amount - i.remaining_balance) AS paid_amount,  
            i.remaining_balance, 
            i.down_payment, 
            i.margin_percentage, 
            i.total_margin_amount, 
            i.total_instalment_amount,
            i.total_loan,
            i.surety_cnic,
            i.surety_name,
            i.surety_phone_number,
            i.surety_address,
            i.surety_job,
            i.surety_fathername,
            i.shop_id
        FROM Instalments i 
        JOIN Customers c ON i.cnic = c.cnic;
    `;

    try {
        const result = await client.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching instalments:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/unpaid_sales", async (req, res) => {
    const query = `
        SELECT 
            u.unpaid_id, 
            u.cnic, 
            u.sale_id,
            c.name, 
            c.phone_number,
            c.job,
            c.fathername, 
            u.total_unpaid_amount,               
            u.surety_cnic,
            u.surety_name,
            u.surety_phone_number,
            u.surety_address,
            u.surety_job,
            u.surety_fathername,
            u.shop_id
        FROM Unpaid_sales u
        JOIN Customers c ON u.cnic = c.cnic;
    `;

    try {
        const result = await client.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching instalments:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



// Get all stock data with shop name instead of shop_id
app.get("/check-stock", async (req, res) => {
    try {
        const stockData = await client.query(`
            SELECT 
                stock.model, 
                stock.brand, 
                stock.name, 
                stock.purchasing_price, 
                stock.selling_price, 
                stock.quantity,
                shops.name AS shop_name
            FROM stock
            JOIN shops ON stock.shop_id = shops.shop_id
        `);
        res.json(stockData.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});


// Get stock and customer data
app.get("/invoice", async (req, res) => {
    try {
        const stock = await client.query('SELECT * FROM Stock');
        const customers = await client.query('SELECT * FROM Customers');
        // console.log(stock.rows); 
        res.json({
            stock: stock.rows,
            customers: customers.rows
        });

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add customer if not found
app.post('/customer', async (req, res) => {
    const { cnic, name, phone_number, address, fathername, job } = req.body;
    try {
        const existingCustomer = await client.query('SELECT * FROM Customers WHERE cnic = $1', [cnic]);
        if (existingCustomer.rows.length > 0) {
            return res.json(existingCustomer.rows[0]);
        }
        const newCustomer = await client.query(
            'INSERT INTO Customers (cnic, name, phone_number, address, fathername, job) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [cnic, name, phone_number, address, fathername, job]
        );
        res.json(newCustomer.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post("/invoice-submission", async (req, res) => {
    const {
        cnic,
        items,
        total_amount,
        total_discount,
        final_payable,
        payment_status,
        installments,
        sold_by,
        surety_cnic,
        surety_address,
        surety_name,
        surety_phone_number,
        suretyFathername,
        suretyJob
    } = req.body;

    try {
        // Start transaction
        await client.query('BEGIN');
        let shopId = '1';
        for (const item of items){
            shopId = item.shop_id;
        }

        // Insert Sale
        const sale = await client.query(
            `INSERT INTO Sales (cnic, total_discount, total_payable, payment_status, date_of_selling, sold_by, shop_id) 
             VALUES ($1, $2, $3, $4, NOW(), $5, $6) RETURNING sale_id`,
            [cnic, total_discount, final_payable, payment_status, sold_by, shopId]
        );
        const saleId = sale.rows[0].sale_id;

        for (const item of items) {
            // Check stock availability
            const stockCheck = await client.query(
                'SELECT quantity FROM Stock WHERE model = $1 AND shop_id = $2',
                [item.model, item.shop_id]
            );

            if (stockCheck.rows.length === 0) {
                throw new Error(`Stock not found for model ${item.model} in shop ${item.shop_id}`);
            }

            if (stockCheck.rows[0].quantity < item.quantity) {
                throw new Error(`Not enough stock for model ${item.model}. Available: ${stockCheck.rows[0].quantity}, Required: ${item.quantity}`);
            }

            // Insert sale items
            await client.query(
                `INSERT INTO Sale_Items (sale_id, model, shop_id, quantity, selling_price, discount) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [saleId, item.model, item.shop_id, item.quantity, item.selling_price, item.discount]
            );

            // Update stock
            await client.query(
                `UPDATE Stock SET quantity = quantity - $1 WHERE model = $2 AND shop_id = $3`,
                [item.quantity, item.model, item.shop_id]
            );
        }

        // Handle Installments
        if (payment_status === 'Instalments' && installments) {
            await client.query(
                `INSERT INTO Instalments (
                    cnic, sale_id, total_instalments, next_instalment_date, total_instalment_amount, 
                    total_margin_amount, margin_percentage, down_payment, total_loan, remaining_balance, 
                    overdue_status, surety_cnic, surety_address, surety_name, surety_phone_number, shop_id, surety_fathername, surety_job
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
                [
                    cnic, saleId, installments.total_instalments, installments.next_instalment_date, installments.instalment_amount,
                    installments.margin_amount, installments.margin_percentage, installments.down_payment, installments.total_payment,
                    installments.remaining_balance, installments.overdue_status, surety_cnic, surety_address, surety_name, surety_phone_number, shopId, suretyFathername, suretyJob
                ]
            );
        }

        // Handle Unpaid Payments
        if (payment_status === 'Unpaid') {
            await client.query(
                `INSERT INTO Unpaid_SALES (
                    sale_id, cnic, total_unpaid_amount, status, surety_cnic, surety_address, surety_name, surety_phone_number, shop_id, surety_job, surety_fathername
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [saleId, cnic, final_payable, 1, surety_cnic, surety_address, surety_name, surety_phone_number, shopId, suretyFathername, suretyJob]
            );
        }

        // Commit transaction
        await client.query('COMMIT');

        res.json({ message: 'Invoice processed successfully', saleId });

    } catch (error) {
        await client.query('ROLLBACK');  // Rollback in case of any error
        console.error('Database Error:', error);
        res.status(400).json({ error: error.message });
    }
});


// Get Sale Details by Sale ID
app.get("/api/sale/:sale_id", async (req, res) => {

    try {
        const { sale_id } = req.params;

        // Fetch sale details
        const saleQuery = "SELECT * FROM sales WHERE sale_id = $1";
        const saleResult = await client.query(saleQuery, [sale_id]);

        if (saleResult.rows.length === 0) {
            return res.status(404).json({ error: "Sale not found" });
        }
        const sale = saleResult.rows[0];

        // Fetch customer details
        const customerQuery = "SELECT * FROM Customers WHERE cnic = $1";
        const customerResult = await client.query(customerQuery, [sale.cnic]);
        const customer = customerResult.rows[0] || null;

        // Fetch sale items
        const saleItemsQuery = `
            SELECT model, quantity, selling_price, discount 
            FROM sale_items 
            WHERE sale_id = $1`;
        const saleItemsResult = await client.query(saleItemsQuery, [sale_id]);
        const saleItems = saleItemsResult.rows;

        // Fetch installment details (if applicable)
        let installment = null;
        if (sale.payment_status === "Instalments") {
            const installmentQuery = "SELECT * FROM instalments WHERE sale_id = $1";
            const installmentResult = await client.query(installmentQuery, [sale_id]);
            installment = installmentResult.rows[0] || null;
        }

        // Fetch unpaid details (if applicable)
        let unpaid = null;
        if (sale.payment_status === "Unpaid") {
            const unpaidQuery = "SELECT * FROM unpaid_sales WHERE sale_id = $1";
            const unpaidResult = await client.query(unpaidQuery, [sale_id]);
            unpaid = unpaidResult.rows[0] || null;
        }

        // Return response
        res.json({
            sale,
            customer,
            saleItems,
            installment,
            unpaid,
        });
    } catch (error) {
        console.error("Error fetching sale details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get Products Sold by Sale ID
app.get("/sale-products/:sale_id", async (req, res) => {
    try {
        const { sale_id } = req.params;

        // Fetch products sold in the sale
        const productsQuery = `
            SELECT model, quantity, selling_price
            FROM sale_items
            WHERE sale_id = $1
        `;
        const productsResult = await client.query(productsQuery, [sale_id]);

        const dateQuery = `SELECT date_of_selling from SALES where sale_id = $1`;
        const dateResult = await client.query(dateQuery, [sale_id]);

        if (productsResult.rows.length === 0) {
            return res.status(404).json({ error: "No products found for this sale" });
        }

        res.json({
            sale_id,
            date: dateResult.rows[0]?.date_of_selling, // extract only the date
            products: productsResult.rows,
        });
        
    } catch (error) {
        console.error("Error fetching products for sale:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.get("/api/sales", async (req, res) => {
    try {
        const salesQuery = `
            SELECT s.sale_id, s.total_payable, s.payment_status, s.shop_id, s.date_of_selling, 
                   s.total_discount, c.name AS customer_name, c.phone_number, s.sold_by
            FROM sales s
            LEFT JOIN Customers c ON s.cnic = c.cnic
            ORDER BY s.date_of_selling DESC`;

        const salesResult = await client.query(salesQuery);
        res.json(salesResult.rows);
    } catch (error) {
        console.error("Error fetching all sales:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/api/delete-ledger", async (req, res) => {
    console.log("Inside");
    const { ledger_id } = req.body;

    try {
        await client.query("BEGIN"); // Start transaction
        console.log("Deleting ledger entry...");

        // Step 1: Check if Ledger Entry Exists
        const ledgerExists = await client.query("SELECT 1 FROM stock_ledger WHERE ledger_id = $1", [ledger_id]);
        if (ledgerExists.rowCount === 0) {
            return res.status(404).json({ error: "Ledger entry not found." });
        }
        console.log("Ledger entry found.");

        // Step 2: Delete Ledger Entry
        const result = await client.query("DELETE FROM stock_ledger WHERE ledger_id = $1 RETURNING *", [ledger_id]);
        console.log("Ledger entry deleted.");

        await client.query("COMMIT"); // Commit transaction
        res.json({ message: "Ledger entry deleted successfully!", deletedEntry: result.rows[0] });

    } catch (error) {
        await client.query("ROLLBACK"); // Rollback on error
        console.error("Error deleting ledger entry:", error);
        res.status(500).json({ error: "Failed to delete ledger entry." });
    }
});


// DELETE Sale and Restore Stock
app.post("/api/delete-sale", async (req, res) => {
    const { sale_id } = req.body;

    try {
        await client.query("BEGIN"); // Start transaction
        console.log("check 1");

        // Step 1: Check if Sale Exists
        const saleExists = await client.query("SELECT 1 FROM sales WHERE sale_id = $1", [sale_id]);
        if (saleExists.rowCount === 0) {
            return res.status(404).json({ error: "Sale not found." });
        }
        console.log("check 2");

        // Step 2: Get Sale Items and Restore Stock Quantities
        const saleItems = await client.query(
            "SELECT MODEL, quantity FROM sale_items WHERE sale_id = $1",
            [sale_id]
        );
        console.log("check 3");

        // for (const item of saleItems.rows) {
        //     await client.query(
        //         "UPDATE stock SET quantity = quantity + $1 WHERE MODEL = $2 AND EXISTS (SELECT 1 FROM stock WHERE MODEL = $2)",
        //         [item.quantity, item.model]
        //     );
        // }

        for (const item of saleItems.rows) {
            await client.query(
                "UPDATE stock SET quantity = quantity + $1 WHERE MODEL = $2",
                [item.quantity, item.model] // Use item.MODEL instead of item.stock_id
            );
        }
        
        console.log("check 4");

        // Step 3: Delete Related Data (Only if exists)
        await client.query("DELETE FROM instalment_payments WHERE sale_id = $1 AND EXISTS (SELECT 1 FROM instalment_payments WHERE sale_id = $1)", [sale_id]);
        console.log("check 5");
        await client.query("DELETE FROM instalments WHERE sale_id = $1 AND EXISTS (SELECT 1 FROM instalments WHERE sale_id = $1)", [sale_id]);
        console.log("check 6");
        await client.query("DELETE FROM sale_items WHERE sale_id = $1 AND EXISTS (SELECT 1 FROM sale_items WHERE sale_id = $1)", [sale_id]);
        console.log("check 7");
        await client.query("DELETE FROM unpaid_sales WHERE sale_id = $1 AND EXISTS (SELECT 1 FROM unpaid_sales WHERE sale_id = $1)", [sale_id]);
        console.log("check 8");
        await client.query("DELETE FROM sales WHERE sale_id = $1", [sale_id]); // Primary table
        console.log("check 9");

        await client.query("COMMIT"); // Commit transaction
        res.json({ message: "Sale deleted and stock updated successfully!" });
    } catch (error) {
        await client.query("ROLLBACK"); // Rollback on error
        console.error("Error deleting sale:", error);
        res.status(500).json({ error: "Failed to delete sale." });
    } finally {

    }
});


/**
 * GET /instalment/:instalmentId
 * Fetch instalment details by instalment_id
 */
app.get("/instalment/:instalmentId", async (req, res) => {
    try {
        const { instalmentId } = req.params;
        const result = await client.query(
            "SELECT i.*, C.name FROM instalments i right join CUSTOMERS C on i.cnic = C.cnic WHERE instalment_id = $1",
            [instalmentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Instalment not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /pay-instalment
 * Process instalment payment
 */
// app.post("/pay-instalment", async (req, res) => {
//     try {
//         const { instalment_id, sale_id, cnic, instalments_paid } = req.body;

//         // Fetch current instalment details
//         const instalmentResult = await client.query(
//             "SELECT * FROM instalments WHERE instalment_id = $1",
//             [instalment_id]
//         );

//         if (instalmentResult.rows.length === 0) {
//             return res.status(404).json({ error: "Instalment not found" });
//         }

//         const instalment = instalmentResult.rows[0];

//         const newTotalLoan =
//             instalment.total_loan - instalment.total_instalment_amount * instalments_paid;
//         const newTotalInstalments = instalment.total_instalments - instalments_paid;
//         const newNextInstalmentDate = new Date(instalment.next_instalment_date);
//         newNextInstalmentDate.setMonth(newNextInstalmentDate.getMonth() + instalments_paid);

//         // Update instalment record
//         await client.query(
//             "UPDATE instalments SET total_loan = $1, total_instalments = $2, next_instalment_date = $3 WHERE instalment_id = $4",
//             [
//                 newTotalLoan,
//                 newTotalInstalments,
//                 newNextInstalmentDate.toISOString().split("T")[0],
//                 instalment_id,
//             ]
//         );

//         // Insert into instalment_payments table
//         await client.query(
//             "INSERT INTO instalment_payments (sale_id, cnic, payment_date, next_instalment_date, payment_amount, remaining_balance) VALUES ($1, $2, $3, $4, $5, $6)",
//             [
//                 sale_id,
//                 cnic,
//                 new Date().toISOString().split("T")[0],
//                 newNextInstalmentDate.toISOString().split("T")[0],
//                 instalment.total_instalment_amount * instalments_paid,
//                 newTotalLoan,
//             ]
//         );

//         res.json({ message: "Instalment payment successful!" });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

function addMonthsToDate(date, monthsToAdd) {
    const newDate = new Date(date);
    const year = newDate.getFullYear();
    const month = newDate.getMonth();
    const day = newDate.getDate();

    // Calculate target month and year
    const targetMonth = month + monthsToAdd;
    const targetYear = year + Math.floor(targetMonth / 12);
    const normalizedMonth = targetMonth % 12;

    // Set to first of target month, then adjust to same day (or closest possible)
    const result = new Date(targetYear, normalizedMonth, 1);
    const maxDays = new Date(targetYear, normalizedMonth + 1, 0).getDate(); // last day of that month
    result.setDate(Math.min(day, maxDays));

    return result;
}


app.post("/pay-instalment", async (req, res) => {
    try {
        const { instalment_id, sale_id, cnic, payment_amount } = req.body;
        console.log(instalment_id);
        // Fetch current instalment details
        const instalmentResult = await client.query(
            "SELECT * FROM instalments WHERE instalment_id = $1",
            [instalment_id]
        );

        console.log(instalmentResult.rows[0]);

        if (instalmentResult.rows.length === 0) {
            return res.status(404).json({ error: "Instalment not found" });
        }
        

        const instalment = instalmentResult.rows[0];
        console.log(instalment);
        const payment = parseFloat(payment_amount);

        // Validate payment amount
        if (payment <= 0) {
            return res.status(400).json({ error: "Payment amount must be positive" });
        }

        // Calculate new loan balance
        const newTotalLoan = instalment.total_loan - payment;
        const paidOff = newTotalLoan <= 0;
        
        // Calculate installments covered by this payment
        console.log('payment: ', payment);
        console.log('instalment.total_instalment_amount: ',instalment.total_instalment_amount);
        console.log('instalment.total_instalments: ', instalment.total_instalments);

        const installmentsCovered = Math.min(
            Math.floor(payment / instalment.total_instalment_amount),
            instalment.total_instalments
        );
        
        // Calculate remaining installments after payment
        const newTotalInstallments = instalment.total_instalments - installmentsCovered;
        
        // Calculate new due date
        // 1. FIXED DATE INITIALIZATION
        let newNextInstalmentDate = instalment.next_instalment_date 
          ? new Date(instalment.next_instalment_date)
          : new Date();

        

        // 2. VALIDATE DATE BEFORE MANIPULATION
        if (isNaN(newNextInstalmentDate.getTime())) {
          newNextInstalmentDate = new Date();
        }
        console.log("Mein Sb se oper wala ho'n", newNextInstalmentDate);
        newNextInstalmentDate = addMonthsToDate(newNextInstalmentDate, installmentsCovered);
        if (newNextInstalmentDate instanceof Date) {
            console.log("It is a Date object");
        } else {
            console.log("It is NOT a Date object");
        }

        console.log("Mein Sb se oper wala ho'n", newNextInstalmentDate);


        // Handle full payoff
        if (paidOff) {
            const actualPayment = instalment.total_loan;
            const overpayment = payment - actualPayment;
            console.log("Entered in Paid Off Section");
            // Update instalment record
            await client.query('BEGIN');
            await client.query(
                `UPDATE instalments 
                 SET total_loan = 0, 
                     total_instalments = 0,
                     next_instalment_date = NULL,
                     total_instalment_amount = 0
                 WHERE instalment_id = $1`,
                [instalment_id]
            );
            console.log("Query 1 executed for instalments in paid off section");

            // Record payment
            await client.query(
                `INSERT INTO instalment_payments (
                    sale_id, cnic, payment_date, 
                    next_instalment_date, payment_amount, 
                    remaining_balance
                 ) VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    sale_id,
                    cnic,
                    new Date().toISOString().split("T")[0],
                    null,
                    actualPayment,
                    0
                ]
            );
            console.log("Query 2 executed for instalment payment in paid off section");
            await client.query('COMMIT');

            return res.json({ 
                message: "Loan fully paid off!",
                overpayment: overpayment > 0 ? overpayment : 0
            });
        }

        // Calculate new installment amount
        const newInstallmentAmount = newTotalLoan / newTotalInstallments;

        // 3. FIXED FINAL DUE DATE HANDLING
        let finalInstallments = newTotalInstallments;
        let finalInstallmentAmount = newInstallmentAmount;
        let finalDueDate = new Date(newNextInstalmentDate); // Clone the date
        console.log(finalDueDate);
        
        if (finalInstallments === 0 && newTotalLoan > 10) {
            finalInstallments = 1;
            finalInstallmentAmount = newTotalLoan;
            
            // Validate before manipulation
            if (isNaN(finalDueDate.getTime())) {
                finalDueDate = new Date();
            }
            finalDueDate.setMonth(finalDueDate.getMonth() + 1);
        }

        console.log("Updating instalment records check 1");
        console.log(finalDueDate);
        // Update instalment record
        await client.query(
            `UPDATE instalments 
             SET total_loan = $1, 
                 total_instalments = $2,
                 total_instalment_amount = $3,
                 next_instalment_date = $4
             WHERE instalment_id = $5`,
            [
                newTotalLoan,
                finalInstallments,
                finalInstallmentAmount,
                finalDueDate.toISOString().split("T")[0],
                instalment_id
            ]
        );

        console.log("Updating instalment payment records check 2");
        // Record payment
        await client.query(
            `INSERT INTO instalment_payments (
                sale_id, cnic, payment_date, 
                next_instalment_date, payment_amount, 
                remaining_balance
             ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                sale_id,
                cnic,
                new Date().toISOString().split("T")[0],
                finalDueDate.toISOString().split("T")[0],
                payment,
                newTotalLoan
            ]
        );
        console.log("Updating instalment records checks done");
        res.json({ 
            message: "Payment successful!",
            new_installment_amount: finalInstallmentAmount,
            remaining_balance: newTotalLoan,
            next_due_date: finalDueDate.toISOString().split("T")[0],
            installments_covered: installmentsCovered
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /unpaid-sale/:saleIdOrCnic
 * Fetch unpaid sale details by Sale ID or CNIC
 */
app.get("/unpaid-sale/:saleIdOrCnic", async (req, res) => {
    try {
        const { saleIdOrCnic } = req.params;

        // First, fetch the unpaid sale
        const saleResult = await client.query(
            "SELECT * FROM unpaid_sales WHERE sale_id::TEXT = $1 OR cnic = $1",
            [saleIdOrCnic]
        );

        if (saleResult.rows.length === 0) {
            return res.status(404).json({ error: "Unpaid sale not found" });
        }

        const unpaidSale = saleResult.rows[0];

        // Then, fetch the customer name based on CNIC
        const customerResult = await client.query(
            "SELECT name FROM customers WHERE cnic = $1",
            [unpaidSale.cnic]
        );

        const customerName = customerResult.rows.length > 0 ? customerResult.rows[0].name : null;

        // Add customer name to the response
        res.json({
            ...unpaidSale,
            customer_name: customerName
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


/**
 * POST /pay-unpaid-sale
 * Process unpaid sale payment
 */
app.post("/pay-unpaid-sale", async (req, res) => {
    try {
        const { sale_id } = req.body;

        await client.query(
            "UPDATE unpaid_sales SET total_unpaid_amount = 0 WHERE sale_id = $1",
            [sale_id]
        );

        res.json({ message: "Unpaid sale settled successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});