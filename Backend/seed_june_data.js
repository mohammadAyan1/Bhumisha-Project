require('dotenv').config();
const db = require('./src/config/db');

async function seed() {
  const promiseDb = db.promise();
  try {
    // 1. Create a dummy customer
    const [custRes] = await promiseDb.query(`INSERT INTO customers (name, firm_name, phone, created_at, status) VALUES ('June Customer', 'June Firm', '9876543210', '2026-06-01 10:00:00', 'active')`);
    const custId = custRes.insertId;

    // 2. Create a dummy farmer
    const [farmRes] = await promiseDb.query(`INSERT INTO farmers (name, contact_number, created_at, status) VALUES ('June Farmer', '9876543211', '2026-06-02 10:00:00', 'active')`);
    const farmId = farmRes.insertId;

    // 3. Create a dummy vendor
    const [vendRes] = await promiseDb.query(`INSERT INTO vendors (vendor_name, firm_name, contact_number, created_at, status) VALUES ('June Vendor', 'June Vendor Firm', '9876543212', '2026-06-03 10:00:00', 'active')`);
    const vendId = vendRes.insertId;

    // 4. Create a category
    const [catRes] = await promiseDb.query(`INSERT INTO categories (name, status) VALUES ('June Category', 'active')`);
    const catId = catRes.insertId;

    // 5. Create a product
    const [prodRes] = await promiseDb.query(`INSERT INTO products (product_name, category_id, size, unit, purchase_rate, total, gst) VALUES ('June Product', ?, 1, 'kg', 80, 100, 18)`, [catId]);
    const prodId = prodRes.insertId;

    // 6. Generate Sales in June
    const ts = Date.now();
    for (let i = 1; i <= 5; i++) {
        const d = `2026-06-0${i} 12:00:00`;
        const billNo = `SJ-${ts}-${i}`;
        const [saleRes] = await promiseDb.query(
            `INSERT INTO sales (customer_id, bill_no, bill_date, party_type, total_taxable, total_gst, payment_status, total_amount, status, created_at) VALUES (?, ?, ?, 'customer', 1000, 180, 'paid', 1180, 'active', ?)`,
            [custId, billNo, d, d]
        );
        const saleId = saleRes.insertId;
        
        await promiseDb.query(
            `INSERT INTO sale_items (sale_id, product_id, rate, qty, total, taxable_amount, gst_percent, gst_amount, net_total, status, created_at) VALUES (?, ?, 100, 10, 1000, 1000, 18, 180, 1180, 'active', ?)`,
            [saleId, prodId, d]
        );
        
        await promiseDb.query(
            `INSERT INTO sale_payments (sale_id, party_type, customer_id, payment_date, amount, method, status, created_at) VALUES (?, 'customer', ?, ?, 1180, 'cash', 'active', ?)`,
            [saleId, custId, d, d]
        );
    }
    
    // 7. Generate Purchases in June
    for (let i = 1; i <= 5; i++) {
        const d = `2026-06-1${i} 12:00:00`;
        const billNo = `PJ-${ts}-${i}`;
        const [purRes] = await promiseDb.query(
            `INSERT INTO purchases (vendor_id, bill_no, bill_date, party_type, total_amount, status, created_at) VALUES (?, ?, ?, 'vendor', 800, 'active', ?)`,
            [vendId, billNo, d, d]
        );
        const purId = purRes.insertId;
        
        await promiseDb.query(
            `INSERT INTO purchase_items (purchase_id, product_id, rate, size, total, unit, status, created_at) VALUES (?, ?, 80, 10, 800, 'kg', 'active', ?)`,
            [purId, prodId, d]
        );
    }
    
    console.log("June dummy data generated successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
