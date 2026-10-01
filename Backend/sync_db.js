require("dotenv").config();
const db = require("./src/config/db");

async function run() {
  const conn = db.promise();
  try {
    // 1. Sync bill_no in sales master table from sales_com_001
    const [salesRows] = await conn.query("SELECT id, bill_no, reference_id FROM sales_com_001");
    for (const row of salesRows) {
      if (row.reference_id) {
        await conn.query("UPDATE sales SET bill_no = ? WHERE id = ?", [row.bill_no, row.reference_id]);
      }
    }
    console.log("Synced sales bill_no successfully.");

    // 2. Delete purchases from master that do not exist in purchases_com_001
    // First find valid references
    const [purchasesRows] = await conn.query("SELECT reference_id FROM purchases_com_001 WHERE reference_id IS NOT NULL");
    const validRefs = purchasesRows.map(r => r.reference_id);
    
    if (validRefs.length > 0) {
      await conn.query("DELETE FROM purchase_items WHERE purchase_id NOT IN (?)", [validRefs]);
      await conn.query("DELETE FROM purchase_payments WHERE purchases_id NOT IN (?)", [validRefs]);
      const [delRes] = await conn.query("DELETE FROM purchases WHERE id NOT IN (?)", [validRefs]);
      console.log(`Deleted ${delRes.affectedRows} orphaned records from master purchases.`);
    }

    // Also do the same for sales, just in case there are orphaned sales
    const validSalesRefs = salesRows.map(r => r.reference_id).filter(Boolean);
    if (validSalesRefs.length > 0) {
      const [delResSales] = await conn.query("DELETE FROM sales WHERE id NOT IN (?)", [validSalesRefs]);
      console.log(`Deleted ${delResSales.affectedRows} orphaned records from master sales.`);
    }

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
