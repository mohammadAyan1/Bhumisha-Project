require("dotenv").config();
const db = require("./src/config/db");
async function run() {
  const connection = db.promise();
  try {
    const [sales] = await connection.query("SELECT id, bill_no, status FROM sales");
    console.log("Master sales:", sales);
    const [salesCom001] = await connection.query("SELECT id, bill_no, status, reference_id FROM sales_com_001");
    console.log("Sales COM_001:", salesCom001);
    
    const [purchasesCom001] = await connection.query("SELECT id, bill_no, status, reference_id FROM purchases_com_001");
    console.log("Purchases COM_001:", purchasesCom001);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
