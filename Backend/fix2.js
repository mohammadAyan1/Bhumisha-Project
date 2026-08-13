const fs = require('fs');
const files = [
  'd:/Bhumisha-Project/Backend/src/models/sales.model.js',
  'd:/Bhumisha-Project/Backend/src/models/saleItems.model.js',
  'd:/Bhumisha-Project/Backend/src/models/salePayments.model.js',
  'd:/Bhumisha-Project/Backend/src/controllers/sales.controller.js'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/if \(conn && typeof conn\.release === 'function'\) conn\.release\(\); else if \(conn\) conn\.end\(\);/g, "if (conn) { try { if (typeof conn.release === 'function') { conn.release(); } else if (typeof conn.end === 'function') { conn.end(); } } catch (e) { if (typeof conn.end === 'function') { conn.end(); } } }");
  content = content.replace(/if \(conn\) conn\.release\(\);/g, "if (conn) { try { if (typeof conn.release === 'function') { conn.release(); } else if (typeof conn.end === 'function') { conn.end(); } } catch (e) { if (typeof conn.end === 'function') { conn.end(); } } }");
  fs.writeFileSync(file, content);
  console.log('Fixed ' + file);
});
