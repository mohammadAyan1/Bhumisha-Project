const mysql = require('mysql2/promise');
async function check() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'Ayan$$78', database: 'bhumisha' });
  const [rows] = await conn.execute("DESCRIBE sales_com_001");
  console.log(rows.filter(r => ['eway_bill_no', 'transport', 'transport_id', 'vehicle_no'].includes(r.Field)));
  const [rows2] = await conn.execute("SELECT eway_bill_no, transport, transport_id, vehicle_no FROM sales_com_001 ORDER BY id DESC LIMIT 1");
  console.log('Latest sale data:', rows2);
  process.exit(0);
}
check();
