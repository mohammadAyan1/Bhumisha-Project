// models/sales.model.js
const mysql = require("mysql2/promise");
const pool = require("../config/db");

const { tn } = require("../services/tableName");
const { createCompanyTables } = require("../services/companyTables");

// Helper function to ensure reference_id column exists
async function ensureReferenceColumn(conn, tableName) {
  try {
    const [colCheck] = await conn.execute(
      `
            SELECT COUNT(*) AS count
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND COLUMN_NAME = 'reference_id'
            `,
      [tableName]
    );

    if (colCheck[0].count === 0) {
      await conn.execute(`
                ALTER TABLE \`${tableName}\`
                ADD COLUMN reference_id INT NULL,
                ADD INDEX idx_${tableName.replace(
                  /[^a-zA-Z0-9_]/g,
                  "_"
                )}_reference (reference_id)
            `);
    }
  } catch (error) {
    console.error(
      `Error ensuring reference_id column for ${tableName}:`,
      error
    );
    throw error;
  }
}

// Add this helper function at the top of your sales model file
function getFinancialYear(date = new Date()) {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1; // January is 0

  let financialYearStart, financialYearEnd;

  if (currentMonth >= 4) {
    // April to December - current year to next year
    financialYearStart = currentYear;
    financialYearEnd = currentYear + 1;
  } else {
    // January to March - previous year to current year
    financialYearStart = currentYear - 1;
    financialYearEnd = currentYear;
  }

  // Return last two digits
  const startShort = financialYearStart.toString().slice(-2);
  const endShort = financialYearEnd.toString().slice(-2);

  return `${startShort}-${endShort}`;
}

// Helper function to ensure total_discount_amount column exists
async function ensureTotalDiscountColumn(conn, tableName) {
  try {
    const [colCheck] = await conn.execute(
      `
            SELECT COUNT(*) AS count
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND COLUMN_NAME = 'total_discount_amount'
            `,
      [tableName]
    );

    if (colCheck[0].count === 0) {
      await conn.execute(`
                ALTER TABLE \`${tableName}\`
                ADD COLUMN total_discount_amount DECIMAL(15,2) DEFAULT 0.00
            `);
    }
  } catch (error) {
    console.error(
      `Error ensuring total_discount_amount column for ${tableName}:`,
      error
    );
    throw error;
  }
}

const Sales = {
  getConnection: async () => {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      port: process.env.DB_PORT,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: false,
    });
    return conn;
  },

  // Generate next bill number like BILL-001, BILL-002 ...
  // getNewBillNo: async (code) => {
  //   // ensure per-company tables exist (idempotent)
  //   await createCompanyTables(code);
  //   const conn = await Sales.getConnection();
  //   try {
  //     const salesTable = tn(code, "sales");
  //     const [rows] = await conn.execute(
  //       `SELECT bill_no FROM \`${salesTable}\` ORDER BY id DESC LIMIT 1`
  //     );
  //     let lastNo = 0;
  //     if (rows.length && rows[0].bill_no) {
  //       const parts = String(rows[0].bill_no).split("-");
  //       lastNo = parseInt(parts[1], 10) || 0;
  //     }
  //     return `BILL-${String(lastNo + 1).padStart(3, "0")}`;
  //   } finally {
  //     await conn.end();
  //   }
  // },

  getNewBillNo: async (code) => {
    await createCompanyTables(code);
    const conn = await Sales.getConnection();
    try {
      const salesTable = tn(code, "sales");

      // Extract company prefix from code (remove numbers and underscores)
      // For code like "cmp_01", extract "CMP"
      const companyPrefix = code.replace(/[^a-zA-Z]/g, "").toUpperCase();

      // Get financial year
      const financialYear = getFinancialYear();

      // Get the last bill number for this company and financial year
      const [rows] = await conn.execute(
        `SELECT bill_no FROM \`${salesTable}\` 
       WHERE bill_no LIKE ? 
       ORDER BY id DESC LIMIT 1`,
        [`${companyPrefix}/${financialYear}/%`]
      );

      let sequenceNumber = 1;
      if (rows.length && rows[0].bill_no) {
        const lastBillNo = rows[0].bill_no;
        const match = lastBillNo.match(/\/(\d+)$/);
        if (match && match[1]) {
          sequenceNumber = parseInt(match[1], 10) + 1;
        }
      }

      // Format: CMP/25-26/001
      return `${companyPrefix}/${financialYear}/${String(
        sequenceNumber
      ).padStart(3, "0")}`;
    } finally {
      await conn.end();
    }
  },

  create: async (payload, code) => {
    const {
      party_type, // 'customer' | 'vendor' | 'farmer'
      customer_id = null,
      vendor_id = null,
      farmer_id = null,
      buyer_type = "retailer",
      bill_no,
      bill_date,
      payment_status = "Unpaid",
      payment_method = "Cash",
      remarks = null,
      other_amount = 0,
      other_note = null,
      status = "Active",
      items = [],
      cash_received = 0,
    } = payload;

    if (!bill_date) throw new Error("bill_date is required");
    if (!["customer", "vendor", "farmer"].includes(party_type)) {
      throw new Error("party_type must be customer|vendor|farmer");
    }
    const chosenId =
      party_type === "customer"
        ? customer_id
        : party_type === "vendor"
        ? vendor_id
        : party_type === "farmer"
        ? farmer_id
        : null;
    if (!chosenId) throw new Error(`${party_type}_id is required`);
    if (!Array.isArray(items) || items.length === 0)
      throw new Error("items[] required");

    const conn = await Sales.getConnection();
    try {
      await conn.beginTransaction();

      // Get company_id from companies table
      const [companyRows] = await conn.execute(
        `SELECT id FROM companies WHERE code = ?`,
        [code]
      );
      if (!companyRows.length) {
        throw new Error(`Company with code ${code} not found`);
      }
      const company_id = companyRows[0].id;

      // company table names
      const salesTable = tn(code, "sales");
      const saleItemsTable = tn(code, "sale_items");
      const paymentsTable = tn(code, "sale_payments");

      ///////////////!SECTION
      // Generate new bill number
      const companyPrefix = code.replace(/[^a-zA-Z]/g, "").toUpperCase();
      const financialYear = getFinancialYear(new Date(bill_date || new Date()));

      // Get the last sequence number for this company and financial year
      const [lastBillRows] = await conn.execute(
        `SELECT bill_no FROM \`${salesTable}\` 
       WHERE bill_no LIKE ? 
       ORDER BY 
         CAST(SUBSTRING_INDEX(bill_no, '/', -1) AS UNSIGNED) DESC,
         bill_no DESC 
       LIMIT 1`,
        [`${companyPrefix}/${financialYear}/%`]
      );

      let sequenceNumber = 1;
      if (lastBillRows.length && lastBillRows[0].bill_no) {
        const lastBillNo = lastBillRows[0].bill_no;
        const match = lastBillNo.match(/\/(\d+)$/);
        if (match && match[1]) {
          sequenceNumber = parseInt(match[1], 10) + 1;
        }
      }

      const finalBillNo = `${companyPrefix}/${financialYear}/${String(
        sequenceNumber
      ).padStart(3, "0")}`;
      ////////////////

      // Ensure company tables have reference_id column
      await ensureReferenceColumn(conn, salesTable);
      await ensureReferenceColumn(conn, saleItemsTable);
      await ensureReferenceColumn(conn, paymentsTable);

      // Check if total_discount_amount column exists in company sales table
      const [discountColCheck] = await conn.execute(
        `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = 'total_discount_amount'`,
        [salesTable]
      );

      // Add total_discount_amount column if not exists
      if (discountColCheck[0].count === 0) {
        await conn.execute(`
        ALTER TABLE \`${salesTable}\`
        ADD COLUMN total_discount_amount DECIMAL(12,2) DEFAULT 0.00
      `);
      }

      const [paidColCheck] = await conn.execute(
        `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = 'paid_amount'`,
        [salesTable]
      );

      // Add total_discount_amount column if not exists
      if (paidColCheck[0].count === 0) {
        await conn.execute(`
        ALTER TABLE \`${salesTable}\`
        ADD COLUMN paid_amount DECIMAL(12,2) DEFAULT 0.00
      `);
      }

      // Check if total_discount_amount column exists in master sales table
      const [masterDiscountColCheck] = await conn.execute(
        `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'sales'
       AND COLUMN_NAME = 'total_discount_amount'`
      );

      // Add total_discount_amount column if not exists in master table
      if (masterDiscountColCheck[0].count === 0) {
        await conn.execute(`
        ALTER TABLE sales
        ADD COLUMN total_discount_amount DECIMAL(12,2) DEFAULT 0.00
      `);
      }

      // Bill no generation - IMPROVED LOGIC
      // let finalBillNo = bill_no;
      let salesBill;
      if (!salesBill) {
        const [lastBill] = await conn.execute(
          `SELECT bill_no FROM sales 
         WHERE bill_no LIKE 'BILL-%'
         ORDER BY 
           CAST(SUBSTRING(bill_no, 6) AS UNSIGNED) DESC,
           bill_no DESC 
         LIMIT 1`
        );

        let nextNumber = 1;
        if (lastBill.length && lastBill[0].bill_no) {
          const billNumber = lastBill[0].bill_no;
          const match = billNumber.match(/BILL-(\d+)/);
          if (match && match[1]) {
            nextNumber = parseInt(match[1], 10) + 1;
          }
        }
        salesBill = `BILL-${String(nextNumber).padStart(3, "0")}`;
      }

      // Insert into COMPANY-SPECIFIC sales table (first) with total_discount_amount
      const [companySaleRes] = await conn.execute(
        `INSERT INTO \`${salesTable}\`
       (customer_id, vendor_id, farmer_id, party_type, buyer_type, bill_no, bill_date, 
        total_taxable, total_gst, total_discount_amount, total_amount, 
        payment_status, payment_method, remarks, other_amount, other_note, status, reference_id,paid_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, 0.00, 0.00, ?, ?, ?, ?, ?, ?, NULL,?)`,
        [
          party_type === "customer" ? chosenId : null,
          party_type === "vendor" ? chosenId : null,
          party_type === "farmer" ? chosenId : null,
          party_type,
          buyer_type,
          finalBillNo,
          bill_date,
          payment_status,
          payment_method,
          remarks,
          other_amount || 0,
          other_note || null,
          status,
          cash_received,
        ]
      );
      const company_sale_id = companySaleRes.insertId;

      // Now insert into MASTER sales table with reference_id and total_discount_amount
      const [masterSaleRes] = await conn.execute(
        `INSERT INTO sales
       (customer_id, vendor_id, farmer_id, party_type, buyer_type, bill_no, bill_date, 
        total_taxable, total_gst, total_discount_amount, total_amount, 
        payment_status, payment_method, remarks, other_amount, other_note, status, company_id, reference_id,paid_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, 0.00, 0.00, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
        [
          party_type === "customer" ? chosenId : null,
          party_type === "vendor" ? chosenId : null,
          party_type === "farmer" ? chosenId : null,
          party_type,
          buyer_type,
          finalBillNo,
          bill_date,
          payment_status,
          payment_method,
          remarks,
          other_amount || 0,
          other_note || null,
          status,
          company_id,
          company_sale_id, // reference_id points to company table record
          cash_received,
        ]
      );
      const master_sale_id = masterSaleRes.insertId;

      // Update company table with reference to master
      await conn.execute(
        `UPDATE \`${salesTable}\` SET reference_id = ? WHERE id = ?`,
        [master_sale_id, company_sale_id]
      );

      // Insert items and decrement stock
      let total_taxable = 0,
        total_gst = 0,
        total_discount_amount = 0,
        total_amount = 0;

      for (const item of items) {
        if (!item.product_id || !item.qty) continue;

        const productDetails = item?.salesProductItemDetails?.[item.product_id];

        const [prodRows] = await conn.execute(
          `SELECT
          id,
          total AS rate,
          CAST(NULLIF(REPLACE(gst, '%', ''), '') AS DECIMAL(5,2)) AS gst_percent,
          size
        FROM products
        WHERE id=? FOR UPDATE`,
          [item.product_id]
        );
        if (!prodRows.length)
          throw new Error(`product ${item.product_id} not found`);

        const prod = prodRows[0];
        const currentSizeNum = Number(prod.size || 0);

        // Use qty_in_grams if provided, otherwise fall back to qty (assuming grams)
        const qtyInGrams = Number(item.qty_in_grams || item.qty || 0);
        const qty = Number(item.qty || 0); // Keep original qty for display/calculation

        if (!Number.isFinite(qtyInGrams) || qtyInGrams <= 0)
          throw new Error(`invalid quantity for product ${item.product_id}`);
        if (qtyInGrams > currentSizeNum) {
          throw new Error(
            `insufficient stock for product ${item.product_id}: available ${currentSizeNum} grams, requested ${qtyInGrams} grams`
          );
        }

        // Use rate per kg (item.rate) for calculations, not display_rate
        // Convert qty in grams to kg for calculations: qtyInGrams / 1000
        const qtyInKg = qtyInGrams / 1000;
        const ratePerKg = Number(item.rate ?? prod.rate ?? 0);
        const discount_rate = Number(item.discount_rate ?? 0);
        const discount_amount = Number(
          item.discount_amount ?? (ratePerKg * qtyInKg * discount_rate) / 100
        );
        const taxable_amount = Number(ratePerKg * qtyInKg - discount_amount);
        const gst_percent = Number(item.gst_percent ?? prod.gst_percent ?? 0);
        const gst_amount = Number((taxable_amount * gst_percent) / 100);
        const net_total = Number(taxable_amount + gst_amount);
        const unit = item.unit || "PCS";

        // Check if product_detail column exists in company table
        const [colCheck] = await conn.execute(
          `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = 'product_detail'`,
          [saleItemsTable]
        );

        // If not exists, add the column
        if (colCheck[0].count === 0) {
          await conn.execute(`
          ALTER TABLE \`${saleItemsTable}\`
          ADD COLUMN product_detail JSON NULL
        `);
        }

        // Insert into COMPANY-SPECIFIC sale_items table
        const [companyItemRes] = await conn.execute(
          `INSERT INTO \`${saleItemsTable}\`
         (sale_id, product_id, rate, qty, discount_rate, discount_amount, taxable_amount, gst_percent, gst_amount, net_total, unit, status, product_detail, reference_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, NULL)`,
          [
            company_sale_id,
            item.product_id,
            ratePerKg,
            qty,
            discount_rate,
            discount_amount,
            taxable_amount,
            gst_percent,
            gst_amount,
            net_total,
            unit,
            JSON.stringify(productDetails),
          ]
        );
        const company_item_id = companyItemRes.insertId;

        // Insert into MASTER sale_items table
        const [masterItemRes] = await conn.execute(
          `INSERT INTO sale_items
         (sale_id, product_id, rate, qty, discount_rate, discount_amount, taxable_amount, gst_percent, gst_amount, net_total, unit, status, product_detail, company_id, reference_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)`,
          [
            master_sale_id,
            item.product_id,
            ratePerKg,
            qty,
            discount_rate,
            discount_amount,
            taxable_amount,
            gst_percent,
            gst_amount,
            net_total,
            unit,
            JSON.stringify(productDetails),
            company_id,
            company_item_id,
          ]
        );
        const master_item_id = masterItemRes.insertId;

        // Update company table with reference to master
        await conn.execute(
          `UPDATE \`${saleItemsTable}\` SET reference_id = ? WHERE id = ?`,
          [master_item_id, company_item_id]
        );

        // Update stock
        const newSize = currentSizeNum - qtyInGrams;
        await conn.execute(`UPDATE products SET size = ? WHERE id = ?`, [
          String(newSize),
          item.product_id,
        ]);

        total_taxable += taxable_amount;
        total_gst += gst_amount;
        total_discount_amount += discount_amount;
        total_amount += net_total;
      }

      // Update totals on both tables with total_discount_amount
      const addl = Math.max(0, Number(other_amount || 0));
      const finalTotalAmount = total_amount + addl;

      // Update COMPANY table with total_discount_amount
      await conn.execute(
        `UPDATE \`${salesTable}\` 
       SET total_taxable=?, total_gst=?, total_discount_amount=?, total_amount=?, other_amount=?, other_note=? 
       WHERE id=?`,
        [
          total_taxable.toFixed(2),
          total_gst.toFixed(2),
          total_discount_amount.toFixed(2),
          finalTotalAmount.toFixed(2),
          addl.toFixed(2),
          other_note || null,
          company_sale_id,
        ]
      );

      // Update MASTER table with total_discount_amount
      await conn.execute(
        `UPDATE sales 
       SET total_taxable=?, total_gst=?, total_discount_amount=?, total_amount=?, other_amount=?, other_note=? 
       WHERE id=?`,
        [
          total_taxable.toFixed(2),
          total_gst.toFixed(2),
          total_discount_amount.toFixed(2),
          finalTotalAmount.toFixed(2),
          addl.toFixed(2),
          other_note || null,
          master_sale_id,
        ]
      );

      // Previous due calculation (party-aware)
      // Ensure per-company payments table exists (idempotent)
      await conn.execute(
        `CREATE TABLE IF NOT EXISTS \`${paymentsTable}\` LIKE \`tpl_sale_payments\``
      );

      // Add reference_id column to payments table if not exists
      await ensureReferenceColumn(conn, paymentsTable);

      const [[agg]] = await conn.query(
        `SELECT
        COALESCE((
          SELECT SUM(s.total_amount)
          FROM \`${salesTable}\` s
          WHERE s.${party_type}_id = ? AND (s.status IS NULL OR s.status <> 'Cancelled')
        ), 0) AS total_sales,
        COALESCE((
          SELECT SUM(p.amount)
          FROM \`${paymentsTable}\` p
          WHERE p.party_type = ? AND p.${party_type}_id = ?
        ), 0) AS total_payments`,
        [chosenId, party_type, chosenId]
      );

      const total_sales = Number(agg?.total_sales || 0);
      const total_payments = Number(agg?.total_payments || 0);
      const previous_due = Math.max(total_sales - total_payments, 0);

      // gross_due = previous_due + current sale total
      const gross_due =
        previous_due +
        Number(total_amount || 0) +
        Math.max(0, Number(other_amount || 0));

      // Payment insert (any party) - Handle cash payment
      const cash = Number(cash_received || 0);
      if (cash > 0) {
        // Insert into COMPANY-SPECIFIC payments table
        const [companyPaymentRes] = await conn.execute(
          `INSERT INTO \`${paymentsTable}\` (sale_id, party_type, customer_id, vendor_id, farmer_id, payment_date, amount, method, remarks, reference_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
          [
            company_sale_id,
            party_type,
            party_type === "customer" ? chosenId : null,
            party_type === "vendor" ? chosenId : null,
            party_type === "farmer" ? chosenId : null,
            bill_date,
            cash.toFixed(2),
            payment_method || "Cash",
            remarks || null,
          ]
        );
        const company_payment_id = companyPaymentRes.insertId;

        // Insert into MASTER payments table
        const [masterPaymentRes] = await conn.execute(
          `INSERT INTO sale_payments (sale_id, party_type, customer_id, vendor_id, farmer_id, payment_date, amount, method, remarks, company_id, reference_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            master_sale_id,
            party_type,
            party_type === "customer" ? chosenId : null,
            party_type === "vendor" ? chosenId : null,
            party_type === "farmer" ? chosenId : null,
            bill_date,
            cash.toFixed(2),
            payment_method || "Cash",
            remarks || null,
            company_id,
            company_payment_id,
          ]
        );
        const master_payment_id = masterPaymentRes.insertId;

        // Update company table with reference to master
        await conn.execute(
          `UPDATE \`${paymentsTable}\` SET reference_id = ? WHERE id = ?`,
          [master_payment_id, company_payment_id]
        );
      }

      // Check if this sale came from an SO and update SO status if needed
      const so_id = payload.so_id;
      if (so_id) {
        const [soItemsLeft] = await conn.query(
          `SELECT COUNT(*) as count FROM sales_order_items
         WHERE sales_order_id = ? AND (status IS NULL OR status != 'Completed')`,
          [so_id]
        );

        if (soItemsLeft[0].count === 0) {
          await conn.execute(
            `UPDATE sales_orders SET status = 'Completed' WHERE id = ?`,
            [so_id]
          );
        }
      }

      // New due and payment status
      const new_due = Math.max(gross_due - cash, 0);
      let final_payment_status = "Unpaid";
      if (new_due <= 0 && (cash > 0 || gross_due === 0)) {
        final_payment_status = "Paid";
      } else if (cash > 0 && new_due > 0) {
        final_payment_status = "Partial";
      }

      // Persist payment_status in both tables
      await conn.execute(
        `UPDATE \`${salesTable}\` SET payment_status=? WHERE id=?`,
        [final_payment_status, company_sale_id]
      );

      await conn.execute(`UPDATE sales SET payment_status=? WHERE id=?`, [
        final_payment_status,
        master_sale_id,
      ]);

      await conn.commit();
      return {
        id: master_sale_id,
        company_sale_id: company_sale_id,
        bill_no: finalBillNo,
        total_taxable,
        total_gst,
        total_discount_amount,
        total_amount,
        previous_due,
        cash_received: cash,
        new_due,
        payment_status: final_payment_status,
      };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      await conn.end();
    }
  },

  update: async (sale_id, payload, code) => {
    const {
      party_type,
      customer_id = null,
      vendor_id = null,
      farmer_id = null,
      buyer_type = "retailer",
      bill_no,
      bill_date,
      payment_status = "Unpaid",
      payment_method = "Cash",
      remarks = null,
      other_amount = 0,
      other_note = null,
      status = "Active",
      items = [],
      cash_received = 0,
    } = payload;

    if (!bill_date) throw new Error("bill_date is required");
    if (!["customer", "vendor", "farmer"].includes(party_type)) {
      throw new Error("party_type must be customer|vendor|farmer");
    }

    const chosenId =
      party_type === "customer"
        ? customer_id
        : party_type === "vendor"
        ? vendor_id
        : party_type === "farmer"
        ? farmer_id
        : null;

    if (!chosenId) throw new Error(`${party_type}_id is required`);
    if (!Array.isArray(items) || items.length === 0)
      throw new Error("items[] required");
    //////////////////////!SECTION
    const finalBillNo = bill_no || existingSale.bill_no;
    /////////////////////!SECTION

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Get company_id from companies table
      const [companyRows] = await conn.execute(
        `SELECT id FROM companies WHERE code = ?`,
        [code]
      );
      if (!companyRows.length) {
        throw new Error(`Company with code ${code} not found`);
      }
      const company_id = companyRows[0].id;

      // Determine table names (adjust based on your naming convention)
      const salesTable = `sales_cmp_${code.replace("cmp_", "")}`;
      const saleItemsTable = `sale_items_cmp_${code.replace("cmp_", "")}`;
      const paymentsTable = `sale_payments_cmp_${code.replace("cmp_", "")}`;

      // Fetch existing sale and items
      const [existingSaleRows] = await conn.execute(
        `SELECT * FROM \`${salesTable}\` WHERE id = ?`,
        [sale_id]
      );

      if (!existingSaleRows.length) {
        throw new Error(`Sale with ID ${sale_id} not found`);
      }

      const existingSale = existingSaleRows[0];
      const masterSaleId = existingSale.reference_id;

      // Fetch existing items and restore stock
      const [existingItems] = await conn.execute(
        `SELECT * FROM \`${saleItemsTable}\` WHERE sale_id = ?`,
        [sale_id]
      );

      // Restore stock
      for (const item of existingItems) {
        const [prodRows] = await conn.execute(
          `SELECT id, size FROM products WHERE id = ? FOR UPDATE`,
          [item.product_id]
        );

        if (prodRows.length) {
          const prod = prodRows[0];
          const currentSize = Number(prod.size || 0);
          const qtyInGrams = Number(item.qty || 0) * 1000;

          await conn.execute(`UPDATE products SET size = ? WHERE id = ?`, [
            String(currentSize + qtyInGrams),
            item.product_id,
          ]);
        }
      }

      // Delete existing items and payments
      await conn.execute(
        `DELETE FROM \`${saleItemsTable}\` WHERE sale_id = ?`,
        [sale_id]
      );

      await conn.execute(`DELETE FROM sale_items WHERE sale_id = ?`, [
        masterSaleId,
      ]);

      await conn.execute(`DELETE FROM \`${paymentsTable}\` WHERE sale_id = ?`, [
        sale_id,
      ]);

      await conn.execute(`DELETE FROM sale_payments WHERE sale_id = ?`, [
        masterSaleId,
      ]);

      // Process new items
      let total_taxable = 0,
        total_gst = 0,
        total_discount_amount = 0,
        total_amount = 0;

      for (const item of items) {
        if (!item.product_id || !item.qty) continue;

        const [prodRows] = await conn.execute(
          `SELECT
        id,
        total AS rate,
        CAST(NULLIF(REPLACE(gst, '%', ''), '') AS DECIMAL(5,2)) AS gst_percent,
        size
      FROM products
      WHERE id = ? FOR UPDATE`,
          [item.product_id]
        );

        if (!prodRows.length)
          throw new Error(`Product ${item.product_id} not found`);

        const prod = prodRows[0];
        const currentSizeNum = Number(prod.size || 0);

        // Convert quantity to grams
        let qtyInGrams = 0;
        if (item.qty_in_grams) {
          qtyInGrams = Number(item.qty_in_grams);
        } else {
          const unit = item.unit || "kg";
          const qty = Number(item.qty || 0);

          const conversionRates = {
            ton: 1000000,
            quantal: 100000,
            kg: 1000,
            gram: 1,
          };

          qtyInGrams = qty * (conversionRates[unit.toLowerCase()] || 1000);
        }

        if (qtyInGrams > currentSizeNum) {
          throw new Error(
            `Insufficient stock for product ${item.product_id}: available ${currentSizeNum} grams, requested ${qtyInGrams} grams`
          );
        }

        // Calculations
        const qtyInKg = qtyInGrams / 1000;
        const ratePerKg = Number(item.rate || prod.rate || 0);
        const discount_rate = Number(item.discount_rate || 0);
        const discount_amount = Number(
          (ratePerKg * qtyInKg * discount_rate) / 100
        );
        const taxable_amount = Number(ratePerKg * qtyInKg - discount_amount);
        const gst_percent = Number(item.gst_percent || prod.gst_percent || 0);
        const gst_amount = Number((taxable_amount * gst_percent) / 100);
        const net_total = Number(taxable_amount + gst_amount);

        // Insert items (company and master tables)
        const [companyItemRes] = await conn.execute(
          `INSERT INTO \`${saleItemsTable}\`
       (sale_id, product_id, rate, qty, discount_rate, discount_amount, taxable_amount, gst_percent, gst_amount, net_total, unit, status, product_detail, reference_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, NULL)`,
          [
            sale_id,
            item.product_id,
            ratePerKg,
            item.qty,
            discount_rate,
            discount_amount,
            taxable_amount,
            gst_percent,
            gst_amount,
            net_total,
            item.unit || "kg",
            JSON.stringify(item.salesProductItemDetails || {}),
          ]
        );

        const [masterItemRes] = await conn.execute(
          `INSERT INTO sale_items
       (sale_id, product_id, rate, qty, discount_rate, discount_amount, taxable_amount, gst_percent, gst_amount, net_total, unit, status, product_detail, company_id, reference_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)`,
          [
            masterSaleId,
            item.product_id,
            ratePerKg,
            item.qty,
            discount_rate,
            discount_amount,
            taxable_amount,
            gst_percent,
            gst_amount,
            net_total,
            item.unit || "kg",
            JSON.stringify(item.salesProductItemDetails || {}),
            company_id,
            companyItemRes.insertId,
          ]
        );

        // Update reference
        await conn.execute(
          `UPDATE \`${saleItemsTable}\` SET reference_id = ? WHERE id = ?`,
          [masterItemRes.insertId, companyItemRes.insertId]
        );

        // Update stock
        await conn.execute(`UPDATE products SET size = ? WHERE id = ?`, [
          String(currentSizeNum - qtyInGrams),
          item.product_id,
        ]);

        // Update totals
        total_taxable += taxable_amount;
        total_gst += gst_amount;
        total_discount_amount += discount_amount;
        total_amount += net_total;
      }

      // Calculate final totals
      const addl = Math.max(0, Number(other_amount || 0));
      const finalTotalAmount = total_amount + addl;

      // Calculate payment status
      const [[agg]] = await conn.query(
        `SELECT
      COALESCE((
        SELECT SUM(s.total_amount)
        FROM \`${salesTable}\` s
        WHERE s.${party_type}_id = ? 
          AND s.id != ?
          AND (s.status IS NULL OR s.status <> 'Cancelled')
      ), 0) AS previous_sales,
      COALESCE((
        SELECT SUM(p.amount)
        FROM \`${paymentsTable}\` p
        WHERE p.party_type = ? 
          AND p.${party_type}_id = ?
          AND p.sale_id != ?
      ), 0) AS previous_payments`,
        [chosenId, sale_id, party_type, chosenId, sale_id]
      );

      const previous_sales = Number(agg?.previous_sales || 0);
      const previous_payments = Number(agg?.previous_payments || 0);
      const previous_due = Math.max(previous_sales - previous_payments, 0);
      const gross_due = previous_due + finalTotalAmount;
      const new_due = Math.max(gross_due - cash_received, 0);

      let final_payment_status = "Unpaid";
      if (new_due <= 0 && (cash_received > 0 || gross_due === 0)) {
        final_payment_status = "Paid";
      } else if (cash_received > 0 && new_due > 0) {
        final_payment_status = "Partial";
      }

      // Update sales tables
      await conn.execute(
        `UPDATE \`${salesTable}\` 
     SET 
       customer_id = ?,
       vendor_id = ?,
       farmer_id = ?,
       party_type = ?,
       buyer_type = ?,
       bill_no = ?,
       bill_date = ?,
       total_taxable = ?,
       total_gst = ?,
       total_discount_amount = ?,
       total_amount = ?,
       payment_status = ?,
       payment_method = ?,
       remarks = ?,
       other_amount = ?,
       other_note = ?,
       status = ?,
       paid_amount = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
        [
          party_type === "customer" ? chosenId : null,
          party_type === "vendor" ? chosenId : null,
          party_type === "farmer" ? chosenId : null,
          party_type,
          buyer_type,
          bill_no || existingSale.bill_no,
          bill_date,
          total_taxable.toFixed(2),
          total_gst.toFixed(2),
          total_discount_amount.toFixed(2),
          finalTotalAmount.toFixed(2),
          final_payment_status,
          payment_method || "None",
          remarks || null,
          addl.toFixed(2),
          other_note || null,
          status || "Active",
          cash_received.toFixed(2),
          sale_id,
        ]
      );

      await conn.execute(
        `UPDATE sales 
     SET 
       customer_id = ?,
       vendor_id = ?,
       farmer_id = ?,
       party_type = ?,
       buyer_type = ?,
       bill_no = ?,
       bill_date = ?,
       total_taxable = ?,
       total_gst = ?,
       total_discount_amount = ?,
       total_amount = ?,
       payment_status = ?,
       payment_method = ?,
       remarks = ?,
       other_amount = ?,
       other_note = ?,
       status = ?,
       company_id = ?,
       paid_amount = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
        [
          party_type === "customer" ? chosenId : null,
          party_type === "vendor" ? chosenId : null,
          party_type === "farmer" ? chosenId : null,
          party_type,
          buyer_type,
          bill_no || existingSale.bill_no,
          bill_date,
          total_taxable.toFixed(2),
          total_gst.toFixed(2),
          total_discount_amount.toFixed(2),
          finalTotalAmount.toFixed(2),
          final_payment_status,
          payment_method || "None",
          remarks || null,
          addl.toFixed(2),
          other_note || null,
          status || "Active",
          company_id,
          cash_received.toFixed(2),
          masterSaleId,
        ]
      );

      // Insert payment if cash_received > 0
      if (cash_received > 0) {
        const [companyPaymentRes] = await conn.execute(
          `INSERT INTO \`${paymentsTable}\` 
       (sale_id, party_type, customer_id, vendor_id, farmer_id, payment_date, amount, method, remarks, reference_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
          [
            sale_id,
            party_type,
            party_type === "customer" ? chosenId : null,
            party_type === "vendor" ? chosenId : null,
            party_type === "farmer" ? chosenId : null,
            bill_date,
            cash_received.toFixed(2),
            payment_method || "None",
            remarks || null,
          ]
        );

        const [masterPaymentRes] = await conn.execute(
          `INSERT INTO sale_payments 
       (sale_id, party_type, customer_id, vendor_id, farmer_id, payment_date, amount, method, remarks, company_id, reference_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            masterSaleId,
            party_type,
            party_type === "customer" ? chosenId : null,
            party_type === "vendor" ? chosenId : null,
            party_type === "farmer" ? chosenId : null,
            bill_date,
            cash_received.toFixed(2),
            payment_method || "None",
            remarks || null,
            company_id,
            companyPaymentRes.insertId,
          ]
        );

        await conn.execute(
          `UPDATE \`${paymentsTable}\` SET reference_id = ? WHERE id = ?`,
          [masterPaymentRes.insertId, companyPaymentRes.insertId]
        );
      }

      await conn.commit();

      return {
        sale_id: sale_id,
        master_sale_id: masterSaleId,
        total_taxable: total_taxable.toFixed(2),
        total_gst: total_gst.toFixed(2),
        total_discount_amount: total_discount_amount.toFixed(2),
        total_amount: finalTotalAmount.toFixed(2),
        previous_due: previous_due.toFixed(2),
        cash_received: cash_received.toFixed(2),
        new_due: new_due.toFixed(2),
        payment_status: final_payment_status,
      };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      if (conn) conn.release();
    }
  },

  getAll: async (code) => {
    // ensure per-company tables exist (idempotent)
    await createCompanyTables(code);
    const conn = await Sales.getConnection();
    try {
      const salesTable = tn(code, "sales");
      const [rows] = await conn.execute(
        `SELECT
           s.*,
           COALESCE(c.name, v.firm_name, f.name)                                  AS party_name,
           COALESCE(c.address, v.address, NULL)                                     AS party_address,
           COALESCE(c.phone, v.contact_number, f.contact_number)                    AS party_phone,
           COALESCE(c.GST_No, v.gst_no, NULL)                                       AS party_gst,
           COALESCE(c.balance, v.balance, f.balance)                                AS party_balance,
           COALESCE(c.min_balance, v.min_balance, f.min_balance)                    AS party_min_balance
         FROM \`${salesTable}\` s
         LEFT JOIN customers c ON s.customer_id = c.id
         LEFT JOIN vendors   v ON s.vendor_id   = v.id
         LEFT JOIN farmers   f ON s.farmer_id   = f.id
         ORDER BY s.id DESC`
      );
      return rows;
    } finally {
      await conn.end();
    }
  },

  // Single sale with party fields
  getById: async (id, code) => {
    // ensure per-company tables exist (idempotent)
    await createCompanyTables(code);
    const conn = await Sales.getConnection();
    try {
      const salesTable = tn(code, "sales");
      const saleItemsTable = tn(code, "sale_items");

      const [saleRows] = await conn.execute(
        `SELECT
           s.*,
           COALESCE(c.name, v.vendor_name, f.name)                                  AS party_name,
           COALESCE(c.address, v.address, NULL)                                     AS party_address,
           COALESCE(c.phone, v.contact_number, f.contact_number)                    AS party_phone,
           COALESCE(c.GST_No, v.gst_no, NULL)                                       AS party_gst,
           COALESCE(c.balance, v.balance, f.balance)                                AS party_balance,
           COALESCE(c.min_balance, v.min_balance, f.min_balance)                    AS party_min_balance
         FROM \`${salesTable}\` s
         LEFT JOIN customers c ON s.customer_id = c.id
         LEFT JOIN vendors   v ON s.vendor_id   = v.id
         LEFT JOIN farmers   f ON s.farmer_id   = f.id
         WHERE s.id=?`,
        [id]
      );
      if (!saleRows.length) return null;

      const [items] = await conn.execute(
        `SELECT si.*, p.product_name AS item_name, p.hsn_code
         FROM \`${saleItemsTable}\` si
         JOIN products p ON si.product_id = p.id
         WHERE si.sale_id=?
         ORDER BY si.id ASC`,
        [id]
      );

      return { ...saleRows[0], items };
    } finally {
      await conn.end();
    }
  },

  // Delete sale (no stock restore by choice)
  delete: async (id, code) => {
    const conn = await Sales.getConnection();
    try {
      await conn.beginTransaction();
      const salesTable = tn(code, "sales");
      const saleItemsTable = tn(code, "sale_items");
      await conn.execute(`DELETE FROM \`${saleItemsTable}\` WHERE sale_id=?`, [
        id,
      ]);
      const [res] = await conn.execute(
        `DELETE FROM \`${salesTable}\` WHERE id=?`,
        [id]
      );
      await conn.commit();
      return res;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      await conn.end();
    }
  },

  // Party-specific fetch (legacy helper) - company-aware
  getByCustomerId: async (customer_id, code = null) => {
    const conn = await Sales.getConnection();
    try {
      const salesTable = code ? tn(code, "sales") : "sales";
      const saleItemsTable = code ? tn(code, "sale_items") : "sale_items";
      const [rows] = await conn.execute(
        `SELECT s.*, c.name AS party_name
         FROM \`${salesTable}\` s
         LEFT JOIN customers c ON s.customer_id = c.id
         WHERE s.customer_id=?
         ORDER BY s.id DESC`,
        [customer_id]
      );

      for (const sale of rows) {
        const [items] = await conn.execute(
          `SELECT si.*, p.product_name AS item_name, p.hsn_code
           FROM \`${saleItemsTable}\` si
           JOIN products p ON si.product_id = p.id
           WHERE si.sale_id=?`,
          [sale.id]
        );
        sale.items = items;
      }
      return rows;
    } finally {
      await conn.end();
    }
  },
};

module.exports = Sales;
