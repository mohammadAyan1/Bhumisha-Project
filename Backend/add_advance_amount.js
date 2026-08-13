require('dotenv').config();
const db = require('./src/config/db');

async function run() {
  try {
    const conn = await db.promise().getConnection();
    try {
      console.log("Adding advance_amount to customers...");
      await conn.query("ALTER TABLE customers ADD COLUMN advance_amount DECIMAL(15,2) DEFAULT 0");
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error(e);
    }
    
    try {
      console.log("Adding advance_amount to vendors...");
      await conn.query("ALTER TABLE vendors ADD COLUMN advance_amount DECIMAL(15,2) DEFAULT 0");
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error(e);
    }

    try {
      console.log("Adding advance_amount to farmers...");
      await conn.query("ALTER TABLE farmers ADD COLUMN advance_amount DECIMAL(15,2) DEFAULT 0");
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error(e);
    }
    
    console.log("Done adding advance_amount columns.");
    conn.release();
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

run();
