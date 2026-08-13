require("dotenv").config();
const db = require("./src/config/db");

async function run() {
  try {
    const conn = await db.promise().getConnection();
    try {
      console.log("Altering sales_order_items...");
      await conn.query("ALTER TABLE sales_order_items MODIFY COLUMN product_id INT NULL");
      
      const [rows] = await conn.query("SHOW COLUMNS FROM sales_order_items LIKE 'custom_product_name'");
      if (rows.length === 0) {
        await conn.query("ALTER TABLE sales_order_items ADD COLUMN custom_product_name VARCHAR(255) NULL AFTER product_id");
        console.log("Added custom_product_name column");
      } else {
        console.log("custom_product_name column already exists");
      }
    } finally {
      conn.release();
    }
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit();
}

run();
