// const mysql = require("mysql2");

// const db = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   port: process.env.DB_PORT,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   dateStrings: true,
//   timezone: "Z",
// });

// db.connect((err) => {
//   if (err) throw err;
//   console.log("MySQL Connection Successful!");
// });

// module.exports = db;

const mysql = require("mysql2");

if (!process.env.MYSQL_PUBLIC_URL) {
  console.error("❌ MYSQL_PUBLIC_URL is missing");
  process.exit(1);
}

const db = mysql.createConnection(process.env.MYSQL_PUBLIC_URL);

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
    process.exit(1);
  }
  console.log("✅ MySQL connected using PUBLIC URL");
});

module.exports = db;
