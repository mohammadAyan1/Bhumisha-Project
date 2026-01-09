const mysql = require("mysql2/promise");
require("dotenv").config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    database: process.env.DB_NAME || "bhumisha",
  });

  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`tpl_sale_payments\` (
        id INT NOT NULL AUTO_INCREMENT,
        sale_id INT NOT NULL,
        party_type VARCHAR(32) DEFAULT NULL,
        customer_id INT DEFAULT NULL,
        vendor_id INT DEFAULT NULL,
        farmer_id INT DEFAULT NULL,
        payment_date DATE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        method ENUM('Cash','Card','Online','Credit Card','UPI') DEFAULT 'Cash',
        remarks TEXT,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_payments_sale (sale_id),
        KEY idx_payments_customer (customer_id),
        KEY idx_payments_customer_paydate (customer_id, payment_date),
        KEY idx_payments_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    console.error("Failed to create tpl_sale_payments:", e.message || e);
    process.exitCode = 2;
  } finally {
    await conn.end();
  }
}

if (require.main === module) run();

module.exports = { run };
