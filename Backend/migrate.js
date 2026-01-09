const mysql = require("mysql2/promise");

require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function runMigration() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to MySQL");

    // Check if party_type column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'party_type'
    `);

    if (columns.length === 0) {
      // Add new columns if they don't exist
      await connection.execute(`
        ALTER TABLE sales_orders
        ADD COLUMN party_type ENUM('Customer', 'Vendor', 'Farmer') DEFAULT 'Customer' AFTER id,
        ADD COLUMN party_id INT DEFAULT NULL AFTER party_type
        ADD COLUMN buyer_type ENUM('Retailer', 'Whole Saler') DEFAULT  "Retailer" AFTER party_id,
      `);
    } else {
    }

    // Update existing records if party_id is NULL
    await connection.execute(`
      UPDATE sales_orders SET party_type = 'Customer', party_id = customer_id WHERE customer_id IS NOT NULL AND party_id IS NULL
    `);

    // Drop old column if it exists
    const [customerColumns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'customer_id'
    `);

    if (customerColumns.length > 0) {
      // Get foreign key name
      const [fkRows] = await connection.execute(`
        SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'customer_id' AND REFERENCED_TABLE_NAME IS NOT NULL
      `);

      if (fkRows.length > 0) {
        const fkName = fkRows[0].CONSTRAINT_NAME;
        await connection.execute(
          `ALTER TABLE sales_orders DROP FOREIGN KEY \`${fkName}\``
        );
      }

      // Drop index if exists
      try {
        await connection.execute(
          `ALTER TABLE sales_orders DROP INDEX idx_sales_orders_customer_id`
        );
      } catch (e) {}

      await connection.execute(
        `ALTER TABLE sales_orders DROP COLUMN customer_id`
      );
    } else {
    }
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
