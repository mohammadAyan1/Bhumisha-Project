const db = require("../config/db");
const { tn } = require("./tableName");

// Simple in-memory cache to avoid repeating expensive DDL checks per-request
const createdCodes = new Set();

function run(sql) {
  return new Promise((resolve, reject) =>
    db.query(sql, (e) => (e ? reject(e) : resolve()))
  );
}

// Check a column on a given table name (returns boolean)
function hasColumn(tableName, column) {
  return new Promise((resolve) => {
    db.query(
      `SHOW COLUMNS FROM \`${tableName}\` LIKE ?`,
      [column],
      (err, results) => {
        resolve(!err && results && results.length > 0);
      }
    );
  });
}

async function createCompanyTables(code) {
  // If we've already ensured tables for this code during this process, skip.
  if (createdCodes.has(code)) return;

  // First ensure the template/skeleton tables have the optional columns.
  // Altering the template once is much cheaper than ALTERing every company table on each request.
  try {
    const tplSales = "tpl_sales";
    const tplHasOtherAmount = await hasColumn(tplSales, "other_amount");
    const tplHasOtherNote = await hasColumn(tplSales, "other_note");

    if (!tplHasOtherAmount) {
      try {
        await run(
          `ALTER TABLE \`${tplSales}\` ADD COLUMN other_amount DECIMAL(10,2) DEFAULT 0.00`
        );
      } catch (e) {
        // swallow - template may not exist in dev, or permission issues; caller can handle later
      }
    }
    if (!tplHasOtherNote) {
      try {
        await run(
          `ALTER TABLE \`${tplSales}\` ADD COLUMN other_note VARCHAR(255) NULL`
        );
      } catch (e) {
        // swallow
      }
    }
    // Ensure purchases template has bill image column so per-company tables created with LIKE include it
    try {
      const tplPurchases = "tpl_purchases";
      const tplHasBillImg = await hasColumn(tplPurchases, "bill_img");
      if (!tplHasBillImg) {
        try {
          await run(
            `ALTER TABLE \`${tplPurchases}\` ADD COLUMN bill_img VARCHAR(255) NULL`
          );
        } catch (e) {
          // swallow - template may not exist or permission issues
        }
      }
    } catch (e) {
      // ignore template alteration errors
    }
  } catch (e) {
    // non-fatal: continue to attempt creating per-company tables
  }

  const ddl = [
    `CREATE TABLE IF NOT EXISTS \`${tn(
      code,
      "purchases"
    )}\` LIKE \`tpl_purchases\``,
    `CREATE TABLE IF NOT EXISTS \`${tn(
      code,
      "purchase_items"
    )}\` LIKE \`tpl_purchase_items\``,
    `CREATE TABLE IF NOT EXISTS \`${tn(code, "sales")}\` LIKE \`tpl_sales\``,
    `CREATE TABLE IF NOT EXISTS \`${tn(
      code,
      "sale_items"
    )}\` LIKE \`tpl_sale_items\``,
    `CREATE TABLE IF NOT EXISTS \`${tn(
      code,
      "sale_payments"
    )}\` LIKE \`tpl_sale_payments\``,
  ];

  for (const q of ddl) {
    try {
      await run(q);
    } catch (e) {
      // ignore individual create errors to keep this function idempotent and safe in request-path
    }
  }

  // mark as done for this runtime to avoid repeating DB introspection/DDL
  createdCodes.add(code);
}

module.exports = { createCompanyTables };
