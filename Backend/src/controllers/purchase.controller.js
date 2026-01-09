const db = require("../config/db");
const { tn } = require("../services/tableName");
const { normalize } = require("../services/companyCode");

// Helper functions for unit conversions
function convertToKG(quantity, unit) {
  const qty = Number(quantity) || 0;
  switch ((unit || "").toLowerCase()) {
    case "ton":
      return qty * 1000; // 1 ton = 1,000 KG
    case "quantal":
    case "quintal":
    case "qtl":
      return qty * 100; // 1 quintal = 100 KG
    case "kg":
      return qty; // Already in KG
    case "gram":
      return qty / 1000; // Convert grams to KG
    default:
      return qty; // Assume already in KG
  }
}

function getConversionFactor(unit) {
  switch ((unit || "").toLowerCase()) {
    case "ton":
      return 1000; // 1 ton = 1000 kg
    case "quantal":
    case "quintal":
    case "qtl":
      return 100; // 1 quintal = 100 kg
    case "kg":
      return 1; // Already in kg
    case "gram":
      return 0.001; // 1 gram = 0.001 kg
    default:
      return 1; // Default to kg
  }
}

function convertToGramsBackend(quantity, unit) {
  const qty = Number(quantity) || 0;
  switch ((unit || "").toLowerCase()) {
    case "ton":
      return qty * 1000 * 1000; // 1 ton = 1,000,000 grams
    case "quantal":
    case "quintal":
    case "qtl":
      return qty * 100 * 1000; // 1 quintal = 100,000 grams
    case "kg":
      return qty * 1000; // 1 kg = 1,000 grams
    case "gram":
      return qty;
    default:
      return qty; // Assume already in grams
  }
}

// Parse JSON when multipart sends fields in 'data'
function parseMixed(req) {
  if (req.body && typeof req.body === "object" && req.body.data) {
    try {
      return JSON.parse(req.body.data);
    } catch {
      return req.body;
    }
  }
  return req.body || {};
}

const safeNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const purchaseController = {
  create: async (req, res) => {
    const connection = db.promise();

    try {
      const code = normalize(req.headers["x-company-code"] || "");
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const purchasesTable = tn(code, "purchases");
      const itemsTable = tn(code, "purchase_items");
      const paymentsTable = tn(code, "purchase_payments");

      let body;
      try {
        body = JSON.parse(req.body.data);
      } catch (e) {
        return res.status(400).json({ error: "Invalid data format" });
      }

      const {
        party_type,
        vendor_id,
        farmer_id,
        vendor_name,
        firm_name,
        gst_no,
        bill_no,
        bill_date,
        items,
        status,
        farmer_name,
        unit,
        paid_amount = 0,
        discount_percent = 0,
        discount_amount = 0,
        payment_method = "Cash",
        payment_note = "",
        terms_condition = "",
        transport = 0,
        transport_rate = 0,
        companyId,
      } = body;

      // Validate companyId
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const company_id = Number(companyId);
      if (!company_id || isNaN(company_id)) {
        return res.status(400).json({ error: "Invalid companyId" });
      }

      // Validations
      if (!Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ error: "Items must be a non-empty array" });
      }
      if (!bill_no)
        return res.status(400).json({ error: "bill_no is required" });
      if (!bill_date)
        return res.status(400).json({ error: "bill_date is required" });
      if (!Number.isFinite(Date.parse(bill_date))) {
        return res.status(400).json({ error: "Invalid bill_date" });
      }
      if (!party_type || !["vendor", "farmer"].includes(party_type)) {
        return res
          .status(400)
          .json({ error: "party_type must be 'vendor' or 'farmer'" });
      }

      const billUrl = req.file ? `/public/uploads/${req.file.filename}` : null;
      await connection.query("START TRANSACTION");

      // 1. FIRST, ALTER ALL TABLES TO ADD REQUIRED COLUMNS INCLUDING company_id AND reference_id
      // ========================================================================================

      // Helper function to check if column exists
      const columnExists = async (tableName, columnName) => {
        try {
          const [columns] = await connection.query(
            `SHOW COLUMNS FROM \`${tableName}\` LIKE ?`,
            [columnName]
          );
          return columns.length > 0;
        } catch (err) {
          console.error(
            `Error checking column ${columnName} in ${tableName}:`,
            err.message
          );
          return false;
        }
      };

      // Helper function to check if table exists
      const tableExists = async (tableName) => {
        try {
          const [tables] = await connection.query(`SHOW TABLES LIKE ?`, [
            tableName,
          ]);
          return tables.length > 0;
        } catch (err) {
          console.error(`Error checking table ${tableName}:`, err.message);
          return false;
        }
      };

      // Create purchase_payments table if it doesn't exist (base table)
      const basePaymentsTableExists = await tableExists("purchase_payments");
      if (!basePaymentsTableExists) {
        const createBasePaymentsTableSQL = `
          CREATE TABLE purchase_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            purchases_id INT,
            party_type ENUM('vendor','farmer'),
            vendor_id INT,
            farmer_id INT,
            payment_date DATE,
            amount DECIMAL(10,2),
            method ENUM('None','Cash','Card','Online','Credit Card','UPI'),
            remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('Active','Inactive') DEFAULT 'Active',
            company_id INT DEFAULT NULL,
            reference_id INT DEFAULT NULL COMMENT 'ID from other table'
          )
        `;
        await connection.query(createBasePaymentsTableSQL);
      }

      // Create company-specific purchase_payments table if it doesn't exist
      const companyPaymentsTableExists = await tableExists(paymentsTable);
      if (!companyPaymentsTableExists) {
        const createCompanyPaymentsTableSQL = `
          CREATE TABLE \`${paymentsTable}\` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            purchases_id INT,
            party_type ENUM('vendor','farmer'),
            vendor_id INT,
            farmer_id INT,
            payment_date DATE,
            amount DECIMAL(10,2),
            method ENUM('Cash','Card','Online','Credit Card','UPI'),
            remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('Active','Inactive') DEFAULT 'Active',
            company_id INT DEFAULT NULL,
            reference_id INT DEFAULT NULL COMMENT 'ID from other table'
          )
        `;
        await connection.query(createCompanyPaymentsTableSQL);
      }

      // Alter purchases table for company-specific schema
      const purchaseColumnsToAdd = [
        {
          name: "paid_amount",
          sql: "ADD COLUMN paid_amount DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "discount_percent",
          sql: "ADD COLUMN discount_percent DECIMAL(10,2) DEFAULT 0",
        },
        {
          name: "discount_amount",
          sql: "ADD COLUMN discount_amount DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "gst_amount",
          sql: "ADD COLUMN gst_amount DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "taxable_amount",
          sql: "ADD COLUMN taxable_amount DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "base_amount",
          sql: "ADD COLUMN base_amount DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "payment_method",
          sql: "ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash'",
        },
        { name: "payment_note", sql: "ADD COLUMN payment_note TEXT" },
        { name: "terms_condition", sql: "ADD COLUMN terms_condition TEXT" },
        { name: "unit", sql: "ADD COLUMN unit VARCHAR(50) DEFAULT 'kg'" },
        {
          name: "transport",
          sql: "ADD COLUMN transport DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "transport_rate",
          sql: "ADD COLUMN transport_rate DECIMAL(15,3) DEFAULT 0",
        },
        { name: "company_id", sql: "ADD COLUMN company_id INT DEFAULT NULL" },
        {
          name: "reference_id",
          sql: "ADD COLUMN reference_id INT DEFAULT NULL COMMENT 'ID from other table'",
        },
      ];

      // Alter purchases tables (similar to your existing code)
      try {
        const [existingPurchaseColumns] = await connection.query(
          `SHOW COLUMNS FROM \`${purchasesTable}\``
        );
        const existingPurchaseColumnNames = existingPurchaseColumns.map(
          (col) => col.Field
        );

        for (const columnDef of purchaseColumnsToAdd) {
          if (!existingPurchaseColumnNames.includes(columnDef.name)) {
            await connection.query(
              `ALTER TABLE \`${purchasesTable}\` ${columnDef.sql}`
            );
          }
        }
      } catch (err) {
        console.error(`Error altering purchases table:`, err.message);
        // Try alternative approach
        try {
          for (const columnDef of purchaseColumnsToAdd) {
            const exists = await columnExists(purchasesTable, columnDef.name);
            if (!exists) {
              await connection.query(
                `ALTER TABLE \`${purchasesTable}\` ${columnDef.sql}`
              );
            }
          }
        } catch (alterErr) {
          if (!alterErr.message.includes("Duplicate column name")) {
            throw alterErr;
          }
        }
      }

      // Alter base purchases table
      try {
        const [existingRawPurchaseColumns] = await connection.query(
          `SHOW COLUMNS FROM purchases`
        );
        const existingRawPurchaseColumnNames = existingRawPurchaseColumns.map(
          (col) => col.Field
        );

        for (const columnDef of purchaseColumnsToAdd) {
          if (!existingRawPurchaseColumnNames.includes(columnDef.name)) {
            await connection.query(`ALTER TABLE purchases ${columnDef.sql}`);
          }
        }
      } catch (err) {
        console.error(`Error altering base purchases table:`, err.message);
        try {
          for (const columnDef of purchaseColumnsToAdd) {
            const exists = await columnExists("purchases", columnDef.name);
            if (!exists) {
              await connection.query(`ALTER TABLE purchases ${columnDef.sql}`);
            }
          }
        } catch (alterErr) {
          if (!alterErr.message.includes("Duplicate column name")) {
            throw alterErr;
          }
        }
      }

      // Alter purchase_items table for company-specific schema
      const itemColumnsToAdd = [
        {
          name: "quantity_in_kg",
          sql: "ADD COLUMN quantity_in_kg DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "discount_percent",
          sql: "ADD COLUMN discount_percent DECIMAL(10,2) DEFAULT 0",
        },
        {
          name: "discount_amount",
          sql: "ADD COLUMN discount_amount DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "gst_percent",
          sql: "ADD COLUMN gst_percent DECIMAL(10,2) DEFAULT 0",
        },
        {
          name: "gst_amount",
          sql: "ADD COLUMN gst_amount DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "base_amount",
          sql: "ADD COLUMN base_amount DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "amount_after_discount",
          sql: "ADD COLUMN amount_after_discount DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "final_amount",
          sql: "ADD COLUMN final_amount DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "taxable_amount",
          sql: "ADD COLUMN taxable_amount DECIMAL(15,3) DEFAULT 0",
        },
        {
          name: "unit_conversion_factor",
          sql: "ADD COLUMN unit_conversion_factor DECIMAL(15,3) DEFAULT 1",
        },
        {
          name: "transport_share",
          sql: "ADD COLUMN transport_share DECIMAL(15,3) DEFAULT 0",
        },
        { name: "company_id", sql: "ADD COLUMN company_id INT DEFAULT NULL" },
        {
          name: "reference_id",
          sql: "ADD COLUMN reference_id INT DEFAULT NULL COMMENT 'ID from other table'",
        },
      ];

      // Alter items tables (similar to your existing code)
      try {
        const [existingItemColumns] = await connection.query(
          `SHOW COLUMNS FROM \`${itemsTable}\``
        );
        const existingItemColumnNames = existingItemColumns.map(
          (col) => col.Field
        );

        for (const columnDef of itemColumnsToAdd) {
          if (!existingItemColumnNames.includes(columnDef.name)) {
            await connection.query(
              `ALTER TABLE \`${itemsTable}\` ${columnDef.sql}`
            );
          }
        }
      } catch (err) {
        console.error(`Error altering items table:`, err.message);
        try {
          for (const columnDef of itemColumnsToAdd) {
            const exists = await columnExists(itemsTable, columnDef.name);
            if (!exists) {
              await connection.query(
                `ALTER TABLE \`${itemsTable}\` ${columnDef.sql}`
              );
            }
          }
        } catch (alterErr) {
          if (!alterErr.message.includes("Duplicate column name")) {
            throw alterErr;
          }
        }
      }

      // Alter base purchase_items table
      try {
        const [existingRawItemColumns] = await connection.query(
          `SHOW COLUMNS FROM purchase_items`
        );
        const existingRawItemColumnNames = existingRawItemColumns.map(
          (col) => col.Field
        );

        for (const columnDef of itemColumnsToAdd) {
          if (!existingRawItemColumnNames.includes(columnDef.name)) {
            await connection.query(
              `ALTER TABLE purchase_items ${columnDef.sql}`
            );
          }
        }
      } catch (err) {
        console.error(`Error altering base purchase_items table:`, err.message);
        try {
          for (const columnDef of itemColumnsToAdd) {
            const exists = await columnExists("purchase_items", columnDef.name);
            if (!exists) {
              await connection.query(
                `ALTER TABLE purchase_items ${columnDef.sql}`
              );
            }
          }
        } catch (alterErr) {
          if (!alterErr.message.includes("Duplicate column name")) {
            throw alterErr;
          }
        }
      }

      // 2. NOW CALCULATE TOTALS AND PROCESS DATA
      // =========================================
      const formattedDate = new Date(bill_date).toISOString().split("T")[0];

      // Calculate totals including GST and Discount for each item
      let taxableAmount = 0;
      let gstAmount = 0;
      let totalAmount = 0;
      let baseAmount = 0;
      let totalDiscountAmount = 0;

      items.forEach((item) => {
        const quantity = Number(item.size || 0);
        const unitVal = item.unit || "kg";
        const ratePerKg = Number(item.rate || 0);

        // Convert quantity to KG for calculations
        const quantityInKg = convertToKG(quantity, unitVal);

        // Calculate base amount (KG × Rate per KG)
        const itemBaseAmount = quantityInKg * ratePerKg;
        baseAmount += itemBaseAmount;

        // Calculate item discount
        const discountPercent = Number(
          item.discount_rate || item.d1_percent || 0
        );
        const itemDiscountAmount = (itemBaseAmount * discountPercent) / 100;
        totalDiscountAmount += itemDiscountAmount;
        const itemAfterDiscount = itemBaseAmount - itemDiscountAmount;

        // Calculate item GST
        const gstPercent = Number(item.gst_percent || 0);
        const itemGstAmount = (itemAfterDiscount * gstPercent) / 100;

        taxableAmount += itemAfterDiscount;
        gstAmount += itemGstAmount;
        totalAmount += itemAfterDiscount + itemGstAmount;
      });

      // Add transport charges to total amount
      const transportCharges = safeNum(transport);
      totalAmount += transportCharges;

      // Apply overall discount if any
      const overallDiscountPercent = Number(discount_percent || 0);
      let overallDiscountAmount = 0;

      if (overallDiscountPercent > 0) {
        overallDiscountAmount = (totalAmount * overallDiscountPercent) / 100;
      } else if (discount_amount > 0) {
        overallDiscountAmount = Number(discount_amount || 0);
      }

      const finalTotalAmount = Math.max(0, totalAmount - overallDiscountAmount);

      // Resolve vendor/farmer
      let resolvedVendorId = null;
      let resolvedFarmerId = null;

      if (party_type === "vendor") {
        if (vendor_id) {
          resolvedVendorId = Number(vendor_id);
        } else if (vendor_name) {
          const [rows] = await connection.query(
            `SELECT id FROM vendors WHERE vendor_name=? AND company_id=?`,
            [vendor_name, company_id]
          );
          if (rows.length) {
            resolvedVendorId = rows[0].id;
          } else {
            const [ins] = await connection.query(
              `INSERT INTO vendors (vendor_name, firm_name, gst_no, status, company_id) VALUES (?, ?, ?, ?, ?)`,
              [
                vendor_name,
                firm_name || "",
                gst_no || null,
                "Active",
                company_id,
              ]
            );
            resolvedVendorId = ins.insertId;
          }
        } else {
          await connection.query("ROLLBACK");
          return res.status(400).json({
            error: "vendor_id or vendor_name required for vendor party",
          });
        }
      } else {
        const fName = farmer_id ? null : body.farmer_name || farmer_name;
        if (farmer_id) {
          resolvedFarmerId = Number(farmer_id);
        } else if (fName) {
          const [rows] = await connection.query(
            `SELECT id FROM farmers WHERE name=? AND company_id=?`,
            [String(fName).trim(), company_id]
          );
          if (rows.length) {
            resolvedFarmerId = rows[0].id;
          } else {
            const [ins] = await connection.query(
              `INSERT INTO farmers (name, status, balance, min_balance, company_id) VALUES (?, 'Active', 0.00, 5000.00, ?)`,
              [String(fName).trim(), company_id]
            );
            resolvedFarmerId = ins.insertId;
          }
        } else {
          await connection.query("ROLLBACK");
          return res.status(400).json({
            error: "farmer_id or farmer_name required for farmer party",
          });
        }
      }

      // Update PO status if linked (fixed - removed company_id condition)
      const po_id = body.po_id || body.linked_po_id;
      const po_item_ids = items.map((i) => i.po_item_id).filter(Boolean);
      if (po_id && po_item_ids.length > 0) {
        try {
          await connection.query(
            `UPDATE purchase_order_items SET status = 'Cancelled' WHERE id IN (?)`,
            [po_item_ids]
          );
        } catch (e) {
          if (
            e &&
            (e.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" ||
              e.code === "WARN_DATA_TRUNCATED" ||
              e.errno === 1265 ||
              e.sqlState === "01000")
          ) {
            await connection.query(
              `UPDATE purchase_order_items SET status = 'Inactive' WHERE id IN (?)`,
              [po_item_ids]
            );
          } else {
            throw e;
          }
        }
      }

      // 3. INSERT PURCHASE RECORD - COMPANY-SPECIFIC TABLE FIRST
      // =========================================================
      let insertColumns = [
        "vendor_id",
        "farmer_id",
        "party_type",
        "gst_no",
        "bill_no",
        "bill_date",
        "total_amount",
        "status",
        "bill_img",
      ];

      let insertValues = [
        resolvedVendorId,
        resolvedFarmerId,
        party_type,
        gst_no || null,
        bill_no,
        formattedDate,
        finalTotalAmount,
        status || "Active",
        billUrl,
      ];

      // Add additional columns
      try {
        const [finalColumns] = await connection.query(
          `SHOW COLUMNS FROM \`${purchasesTable}\``
        );
        const finalColumnNames = finalColumns.map((col) => col.Field);

        const optionalColumns = [
          { name: "taxable_amount", value: taxableAmount },
          { name: "gst_amount", value: gstAmount },
          { name: "base_amount", value: baseAmount },
          { name: "paid_amount", value: Number(paid_amount || 0) },
          { name: "discount_percent", value: Number(discount_percent || 0) },
          {
            name: "discount_amount",
            value: Number(overallDiscountAmount || 0),
          },
          { name: "unit", value: unit || "kg" },
          { name: "payment_method", value: payment_method },
          { name: "payment_note", value: payment_note },
          { name: "terms_condition", value: terms_condition },
          { name: "transport", value: safeNum(transport) },
          { name: "transport_rate", value: safeNum(transport_rate) },
          { name: "company_id", value: company_id },
        ];

        for (const col of optionalColumns) {
          if (finalColumnNames.includes(col.name)) {
            insertColumns.push(col.name);
            insertValues.push(col.value);
          }
        }
      } catch (err) {
        console.error(`Error checking columns:`, err.message);
        insertColumns.push("company_id");
        insertValues.push(company_id);
      }

      const placeholders = insertValues.map(() => "?").join(", ");

      // Insert into company-specific table FIRST
      const [purchaseResult] = await connection.query(
        `INSERT INTO \`${purchasesTable}\` (${insertColumns.join(", ")}) 
         VALUES (${placeholders})`,
        insertValues
      );

      const purchaseCompanyId = purchaseResult.insertId;

      // 4. INSERT INTO BASE TABLE WITH REFERENCE TO COMPANY-SPECIFIC TABLE
      // ===================================================================
      let rawInsertColumns = [...insertColumns];
      let rawInsertValues = [...insertValues];

      try {
        const [finalRawColumns] = await connection.query(
          `SHOW COLUMNS FROM purchases`
        );
        const finalRawColumnNames = finalRawColumns.map((col) => col.Field);

        const filteredColumns = [];
        const filteredValues = [];

        for (let i = 0; i < rawInsertColumns.length; i++) {
          if (finalRawColumnNames.includes(rawInsertColumns[i])) {
            filteredColumns.push(rawInsertColumns[i]);
            filteredValues.push(rawInsertValues[i]);
          }
        }

        rawInsertColumns = filteredColumns;
        rawInsertValues = filteredValues;
      } catch (err) {
        console.error(`Error checking base purchases columns:`, err.message);
      }

      // Add reference_id to base table
      if (rawInsertColumns.includes("reference_id")) {
        const refIndex = rawInsertColumns.indexOf("reference_id");
        rawInsertValues[refIndex] = purchaseCompanyId;
      } else {
        rawInsertColumns.push("reference_id");
        rawInsertValues.push(purchaseCompanyId);
      }

      const rawPlaceholders = rawInsertValues.map(() => "?").join(", ");

      const [purchaseBaseResult] = await connection.query(
        `INSERT INTO purchases (${rawInsertColumns.join(", ")}) 
         VALUES (${rawPlaceholders})`,
        rawInsertValues
      );

      const purchaseBaseId = purchaseBaseResult.insertId;

      // 5. UPDATE COMPANY-SPECIFIC TABLE WITH REFERENCE TO BASE TABLE
      // ==============================================================
      await connection.query(
        `UPDATE \`${purchasesTable}\` SET reference_id = ? WHERE id = ?`,
        [purchaseBaseId, purchaseCompanyId]
      );

      // 6. INSERT PURCHASE PAYMENT IF PAID_AMOUNT > 0
      // ==============================================
      let paymentCompanyId = null;
      let paymentBaseId = null;

      if (paid_amount > 0) {
        // Insert into company-specific purchase_payments table
        const [paymentCompanyResult] = await connection.query(
          `INSERT INTO \`${paymentsTable}\` 
           (purchases_id, party_type, vendor_id, farmer_id, payment_date, amount, method, remarks, status, company_id, reference_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            purchaseCompanyId,
            party_type,
            resolvedVendorId,
            resolvedFarmerId,
            formattedDate,
            Number(paid_amount),
            payment_method,
            payment_note,
            "Active",
            company_id,
            null,
          ]
        );

        paymentCompanyId = paymentCompanyResult.insertId;

        // Insert into base purchase_payments table
        const [paymentBaseResult] = await connection.query(
          `INSERT INTO purchase_payments 
           (purchases_id, party_type, vendor_id, farmer_id, payment_date, amount, method, remarks, status, company_id, reference_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            purchaseBaseId,
            party_type,
            resolvedVendorId,
            resolvedFarmerId,
            formattedDate,
            Number(paid_amount),
            payment_method,
            payment_note,
            "Active",
            company_id,
            null,
          ]
        );

        paymentBaseId = paymentBaseResult.insertId;

        // Update reference_ids to link payments between tables
        await connection.query(
          `UPDATE \`${paymentsTable}\` SET reference_id = ? WHERE id = ?`,
          [paymentBaseId, paymentCompanyId]
        );

        await connection.query(
          `UPDATE purchase_payments SET reference_id = ? WHERE id = ?`,
          [paymentCompanyId, paymentBaseId]
        );
      }

      // 7. INSERT PURCHASE ITEMS
      // ========================
      if (items.length > 0) {
        const totalBaseAmount = baseAmount;

        // Check what columns exist in items table
        let itemInsertColumns = [
          "purchase_id",
          "product_id",
          "rate",
          "size",
          "unit",
          "status",
        ];

        try {
          const [finalItemColumns] = await connection.query(
            `SHOW COLUMNS FROM \`${itemsTable}\``
          );
          const finalItemColumnNames = finalItemColumns.map((col) => col.Field);

          const optionalItemColumns = [
            { name: "quantity_in_kg" },
            { name: "discount_percent" },
            { name: "discount_amount" },
            { name: "gst_percent" },
            { name: "gst_amount" },
            { name: "base_amount" },
            { name: "amount_after_discount" },
            { name: "final_amount" },
            { name: "taxable_amount" },
            { name: "unit_conversion_factor" },
            { name: "transport_share" },
            { name: "company_id" },
            { name: "reference_id" },
          ];

          for (const col of optionalItemColumns) {
            if (finalItemColumnNames.includes(col.name)) {
              itemInsertColumns.push(col.name);
            }
          }
        } catch (err) {
          console.error(`Error checking items columns:`, err.message);
          itemInsertColumns.push("company_id");
          itemInsertColumns.push("reference_id");
        }

        const itemValues = [];
        const rawItemValues = [];

        items.forEach((i) => {
          const quantity = Number(i.size || 0);
          const unitVal = i.unit || "kg";
          const ratePerKg = Number(i.rate || 0);

          const quantityInKg = convertToKG(quantity, unitVal);
          const itemBaseAmount = quantityInKg * ratePerKg;

          let transportShare = 0;
          if (transportCharges > 0 && totalBaseAmount > 0) {
            transportShare =
              (itemBaseAmount / totalBaseAmount) * transportCharges;
          }

          const discountPercent = Number(i.discount_rate || i.d1_percent || 0);
          const itemDiscountAmount = (itemBaseAmount * discountPercent) / 100;
          const amountAfterDiscount = itemBaseAmount - itemDiscountAmount;

          const gstPercent = Number(i.gst_percent || 0);
          const itemGstAmount = (amountAfterDiscount * gstPercent) / 100;
          const finalAmount = amountAfterDiscount + itemGstAmount;
          const unitConversionFactor = getConversionFactor(unitVal);

          // Build values array for company-specific table
          const values = [
            purchaseCompanyId,
            Number(i.product_id),
            Number(i.rate || 0),
            Number(i.size || 0),
            unitVal || "kg",
            "Active",
          ];

          // Build values array for base table
          const rawValues = [
            purchaseBaseId,
            Number(i.product_id),
            Number(i.rate || 0),
            Number(i.size || 0),
            unitVal || "kg",
            "Active",
          ];

          // Add optional values
          if (itemInsertColumns.includes("quantity_in_kg"))
            values.push(quantityInKg);
          if (itemInsertColumns.includes("discount_percent"))
            values.push(discountPercent);
          if (itemInsertColumns.includes("discount_amount"))
            values.push(itemDiscountAmount);
          if (itemInsertColumns.includes("gst_percent"))
            values.push(gstPercent);
          if (itemInsertColumns.includes("gst_amount"))
            values.push(itemGstAmount);
          if (itemInsertColumns.includes("base_amount"))
            values.push(itemBaseAmount);
          if (itemInsertColumns.includes("amount_after_discount"))
            values.push(amountAfterDiscount);
          if (itemInsertColumns.includes("final_amount"))
            values.push(finalAmount);
          if (itemInsertColumns.includes("taxable_amount"))
            values.push(amountAfterDiscount);
          if (itemInsertColumns.includes("unit_conversion_factor"))
            values.push(unitConversionFactor);
          if (itemInsertColumns.includes("transport_share"))
            values.push(transportShare);
          if (itemInsertColumns.includes("company_id")) values.push(company_id);
          if (itemInsertColumns.includes("reference_id")) values.push(null);

          // Add optional values for base table
          if (itemInsertColumns.includes("quantity_in_kg"))
            rawValues.push(quantityInKg);
          if (itemInsertColumns.includes("discount_percent"))
            rawValues.push(discountPercent);
          if (itemInsertColumns.includes("discount_amount"))
            rawValues.push(itemDiscountAmount);
          if (itemInsertColumns.includes("gst_percent"))
            rawValues.push(gstPercent);
          if (itemInsertColumns.includes("gst_amount"))
            rawValues.push(itemGstAmount);
          if (itemInsertColumns.includes("base_amount"))
            rawValues.push(itemBaseAmount);
          if (itemInsertColumns.includes("amount_after_discount"))
            rawValues.push(amountAfterDiscount);
          if (itemInsertColumns.includes("final_amount"))
            rawValues.push(finalAmount);
          if (itemInsertColumns.includes("taxable_amount"))
            rawValues.push(amountAfterDiscount);
          if (itemInsertColumns.includes("unit_conversion_factor"))
            rawValues.push(unitConversionFactor);
          if (itemInsertColumns.includes("transport_share"))
            rawValues.push(transportShare);
          if (itemInsertColumns.includes("company_id"))
            rawValues.push(company_id);
          if (itemInsertColumns.includes("reference_id")) rawValues.push(null);

          itemValues.push(values);
          rawItemValues.push(rawValues);
        });

        // Create placeholders for batch insert
        const itemPlaceholders = itemInsertColumns.map(() => "?").join(", ");
        const allItemPlaceholders = itemValues
          .map(() => `(${itemPlaceholders})`)
          .join(", ");

        // Flatten arrays
        const flatItemValues = itemValues.flat();
        const flatRawItemValues = rawItemValues.flat();

        // Insert into company-specific items table
        const [companyItemsResult] = await connection.query(
          `INSERT INTO \`${itemsTable}\` (${itemInsertColumns.join(", ")}) 
           VALUES ${allItemPlaceholders}`,
          flatItemValues
        );

        const companyItemIds = [];
        if (companyItemsResult.insertId) {
          for (let i = 0; i < items.length; i++) {
            companyItemIds.push(companyItemsResult.insertId + i);
          }
        }

        // Insert into base items table
        const [baseItemsResult] = await connection.query(
          `INSERT INTO purchase_items (${itemInsertColumns.join(", ")}) 
           VALUES ${allItemPlaceholders}`,
          flatRawItemValues
        );

        const baseItemIds = [];
        if (baseItemsResult.insertId) {
          for (let i = 0; i < items.length; i++) {
            baseItemIds.push(baseItemsResult.insertId + i);
          }
        }

        // Update reference_ids to link items between tables
        for (let i = 0; i < items.length; i++) {
          if (companyItemIds[i] && baseItemIds[i]) {
            await connection.query(
              `UPDATE \`${itemsTable}\` SET reference_id = ? WHERE id = ?`,
              [baseItemIds[i], companyItemIds[i]]
            );

            await connection.query(
              `UPDATE purchase_items SET reference_id = ? WHERE id = ?`,
              [companyItemIds[i], baseItemIds[i]]
            );
          }
        }

        // Update product stock
        for (const i of items) {
          const [prodRows] = await connection.query(
            `SELECT id, size FROM products WHERE id = ? FOR UPDATE`,
            [i.product_id]
          );

          if (!prodRows.length) {
            await connection.query("ROLLBACK");
            return res
              .status(400)
              .json({ error: `product ${i.product_id} not found` });
          }

          const curr = Number(prodRows[0].size || 0);
          const incGrams = convertToGramsBackend(i.size, i.unit);

          if (!Number.isFinite(incGrams) || incGrams < 0) {
            await connection.query("ROLLBACK");
            return res
              .status(400)
              .json({ error: `invalid size for product ${i.product_id}` });
          }

          const newSize = curr + incGrams;

          await connection.query(`UPDATE products SET size = ? WHERE id = ?`, [
            newSize,
            i.product_id,
          ]);
        }
      }

      await connection.query("COMMIT");

      return res.status(201).json({
        message: "Purchase created successfully",
        purchase_id: purchaseCompanyId,
        purchase_base_id: purchaseBaseId,
        payment_id: paymentCompanyId,
        payment_base_id: paymentBaseId,
        bill_img: billUrl,
        totals: {
          base_amount: baseAmount,
          taxable_amount: taxableAmount,
          gst_amount: gstAmount,
          item_discount_amount: totalDiscountAmount,
          overall_discount_amount: overallDiscountAmount,
          total_discount_amount: totalDiscountAmount + overallDiscountAmount,
          transport_charges: transportCharges,
          total_amount: finalTotalAmount,
          paid_amount: Number(paid_amount || 0),
          balance_due: finalTotalAmount - Number(paid_amount || 0),
        },
      });
    } catch (err) {
      try {
        await connection.query("ROLLBACK");
      } catch {}
      console.error("Purchase creation error:", err);
      return res
        .status(400)
        .json({ error: err.message || "Failed to create purchase" });
    }
  },

  update: async (req, res) => {
    const connection = db.promise();
    try {
      const code = normalize(
        req.headers["x-company-code"] || req.body.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });
      const purchasesTable = tn(code, "purchases");
      const itemsTable = tn(code, "purchase_items");

      const { id } = req.params; // This is the company-specific table ID

      // First, get the reference_id from the company-specific table
      const [companyPurchase] = await connection.query(
        `SELECT id, reference_id FROM \`${purchasesTable}\` WHERE id = ?`,
        [id]
      );

      if (companyPurchase.length === 0) {
        return res.status(404).json({ error: "Purchase not found" });
      }

      const companyPurchaseId = companyPurchase[0].id;
      const basePurchaseId = companyPurchase[0].reference_id;

      const body = parseMixed(req);

      // Parse the body.data if it's a string (from FormData)
      let parsedBody = body;
      if (typeof body.data === "string") {
        try {
          parsedBody = JSON.parse(body.data);
        } catch (e) {
          console.error("Error parsing body.data:", e);
        }
      }

      const {
        party_type,
        vendor_id,
        farmer_id,
        vendor_name,
        farmer_name,
        firm_name,
        gst_no,
        bill_no,
        bill_date,
        status,
        items,
        paid_amount = 0,
        discount_percent = 0,
        discount_amount = 0,
        payment_method = "Cash",
        payment_note = "",
        terms_condition = "",
        transport = 0,
        transport_rate = 0,
        unit = "kg",
        companyId,
      } = parsedBody;

      // Validate companyId
      if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
      }

      const company_id = Number(companyId);
      if (!company_id || isNaN(company_id)) {
        return res.status(400).json({ error: "Invalid companyId" });
      }

      // Validations
      if (!bill_no)
        return res.status(400).json({ error: "bill_no is required" });
      if (!bill_date)
        return res.status(400).json({ error: "bill_date is required" });
      if (!Number.isFinite(Date.parse(bill_date))) {
        return res.status(400).json({ error: "Invalid bill_date" });
      }
      if (!party_type || !["vendor", "farmer"].includes(party_type)) {
        return res
          .status(400)
          .json({ error: "party_type must be 'vendor' or 'farmer'" });
      }

      await connection.query("START TRANSACTION");

      // Calculate new totals if items are provided
      let taxableAmount = 0;
      let gstAmount = 0;
      let totalAmount = 0;
      let baseAmount = 0;
      let totalDiscountAmount = 0;
      let transportCharges = safeNum(transport);

      if (Array.isArray(items) && items.length > 0) {
        items.forEach((item) => {
          const quantity = Number(item.size || 0);
          const unitVal = item.unit || "kg";
          const ratePerKg = Number(item.rate || 0);

          // Convert quantity to KG for calculations
          const quantityInKg = convertToKG(quantity, unitVal);

          // Calculate base amount (KG × Rate per KG)
          const itemBaseAmount = quantityInKg * ratePerKg;
          baseAmount += itemBaseAmount;

          // Calculate item discount
          const discountPercent = Number(
            item.discount_rate || item.d1_percent || 0
          );
          const itemDiscountAmount = (itemBaseAmount * discountPercent) / 100;
          totalDiscountAmount += itemDiscountAmount;
          const itemAfterDiscount = itemBaseAmount - itemDiscountAmount;

          // Calculate item GST
          const gstPercent = Number(item.gst_percent || 0);
          const itemGstAmount = (itemAfterDiscount * gstPercent) / 100;

          taxableAmount += itemAfterDiscount;
          gstAmount += itemGstAmount;
          totalAmount += itemAfterDiscount + itemGstAmount;
        });

        // Add transport charges
        totalAmount += transportCharges;

        // Apply overall discount if any
        const overallDiscountPercent = Number(discount_percent || 0);
        let overallDiscountAmount = 0;

        if (overallDiscountPercent > 0) {
          overallDiscountAmount = (totalAmount * overallDiscountPercent) / 100;
        } else if (discount_amount > 0) {
          overallDiscountAmount = Number(discount_amount || 0);
        }

        totalAmount = Math.max(0, totalAmount - overallDiscountAmount);
      }

      // Resolve vendor/farmer with company_id
      let resolvedVendorId = null;
      let resolvedFarmerId = null;

      if (party_type === "vendor") {
        if (vendor_id) {
          resolvedVendorId = Number(vendor_id);
        } else if (vendor_name) {
          const [rows] = await connection.query(
            `SELECT id FROM vendors WHERE vendor_name=? AND company_id=?`,
            [vendor_name, company_id]
          );
          if (rows.length) resolvedVendorId = rows[0].id;
          else {
            const [ins] = await connection.query(
              `INSERT INTO vendors (vendor_name, firm_name, gst_no, status, company_id) VALUES (?, ?, ?, ?, ?)`,
              [
                vendor_name,
                firm_name || "",
                gst_no || null,
                "Active",
                company_id,
              ]
            );
            resolvedVendorId = ins.insertId;
          }
        } else {
          await connection.query("ROLLBACK");
          return res.status(400).json({
            error: "vendor_id or vendor_name required for vendor party",
          });
        }
      } else {
        if (farmer_id) {
          resolvedFarmerId = Number(farmer_id);
        } else if (farmer_name) {
          const [rows] = await connection.query(
            `SELECT id FROM farmers WHERE name=? AND company_id=?`,
            [farmer_name, company_id]
          );
          if (rows.length) resolvedFarmerId = rows[0].id;
          else {
            const [ins] = await connection.query(
              `INSERT INTO farmers (name, status, balance, min_balance, company_id) VALUES (?, 'Active', 0.00, 5000.00, ?)`,
              [farmer_name, company_id]
            );
            resolvedFarmerId = ins.insertId;
          }
        } else {
          await connection.query("ROLLBACK");
          return res.status(400).json({
            error: "farmer_id or farmer_name required for farmer party",
          });
        }
      }

      const formattedDate = new Date(bill_date).toISOString().split("T")[0];
      const billUrl = req.file ? `/public/uploads/${req.file.filename}` : null;

      // 1. UPDATE PURCHASE HEADER IN COMPANY-SPECIFIC TABLE
      // ====================================================
      let setSql = `vendor_id=?, farmer_id=?, party_type=?, gst_no=?, bill_no=?, 
                  bill_date=?, status=?, paid_amount=?, discount_percent=?, 
                  discount_amount=?, payment_method=?, payment_note=?, terms_condition=?,
                  unit=?, transport=?, transport_rate=?, company_id=?`;

      const setVals = [
        resolvedVendorId,
        resolvedFarmerId,
        party_type,
        gst_no || null,
        bill_no,
        formattedDate,
        status || "Active",
        Number(paid_amount || 0),
        Number(discount_percent || 0),
        Number(discount_amount || 0),
        payment_method,
        payment_note,
        terms_condition,
        unit || "kg",
        transportCharges,
        safeNum(transport_rate),
        company_id,
      ];

      // Add financial columns if items are provided
      if (Array.isArray(items) && items.length > 0) {
        setSql += `, total_amount=?, taxable_amount=?, gst_amount=?, base_amount=?`;
        setVals.push(totalAmount, taxableAmount, gstAmount, baseAmount);
      }

      if (req.file) {
        setSql += ", bill_img=?";
        setVals.push(billUrl);
      }

      // Update company-specific table
      await connection.query(
        `UPDATE \`${purchasesTable}\` SET ${setSql} WHERE id=?`,
        [...setVals, companyPurchaseId]
      );

      // 2. UPDATE PURCHASE HEADER IN BASE TABLE
      // =========================================
      try {
        let baseSetSql = `vendor_id=?, farmer_id=?, party_type=?, gst_no=?, bill_no=?, 
                        bill_date=?, status=?, paid_amount=?, discount_percent=?, 
                        discount_amount=?, payment_method=?, payment_note=?, terms_condition=?,
                        unit=?, transport=?, transport_rate=?`;

        let baseSetVals = [
          resolvedVendorId,
          resolvedFarmerId,
          party_type,
          gst_no || null,
          bill_no,
          formattedDate,
          status || "Active",
          Number(paid_amount || 0),
          Number(discount_percent || 0),
          Number(discount_amount || 0),
          payment_method,
          payment_note,
          terms_condition,
          unit || "kg",
          transportCharges,
          safeNum(transport_rate),
        ];

        // Check if company_id column exists
        const [baseColumns] = await connection.query(
          `SHOW COLUMNS FROM purchases LIKE 'company_id'`
        );
        if (baseColumns.length > 0) {
          baseSetSql += `, company_id=?`;
          baseSetVals.push(company_id);
        }

        // Add financial columns if items are provided
        if (Array.isArray(items) && items.length > 0) {
          baseSetSql += `, total_amount=?, taxable_amount=?, gst_amount=?, base_amount=?`;
          baseSetVals.push(totalAmount, taxableAmount, gstAmount, baseAmount);
        }

        if (req.file) {
          baseSetSql += ", bill_img=?";
          baseSetVals.push(billUrl);
        }

        // Update base table using the reference_id
        await connection.query(
          `UPDATE purchases SET ${baseSetSql} WHERE id=?`,
          [...baseSetVals, basePurchaseId]
        );
      } catch (err) {
        console.error(`Error updating base purchases table:`, err.message);
        // Continue with transaction even if base table update fails
      }

      // 3. UPDATE ITEMS IF PROVIDED
      // ============================
      if (Array.isArray(items) && items.length > 0) {
        // Calculate total base amount for transport allocation
        const totalBaseAmount = baseAmount;

        // Get existing items with complete details from company-specific table
        const [existingRows] = await connection.query(
          `SELECT * FROM \`${itemsTable}\` WHERE purchase_id = ?`,
          [companyPurchaseId]
        );

        // Create maps for tracking
        const existingMap = {};
        const existingIds = [];

        for (const r of existingRows) {
          existingMap[r.id] = r;
          existingIds.push(r.id);
        }

        const incomingIds = [];

        // Process each incoming item
        for (const item of items) {
          const itemId = item.id ? Number(item.id) : null;
          const quantity = Number(item.size || 0);
          const unitVal = item.unit || "kg";
          const ratePerKg = Number(item.rate || 0);
          const prodId = Number(item.product_id);

          // Calculate item details
          const quantityInKg = convertToKG(quantity, unitVal);
          const itemBaseAmount = quantityInKg * ratePerKg;
          const discountPercent = Number(
            item.discount_rate || item.d1_percent || 0
          );
          const discountAmount = (itemBaseAmount * discountPercent) / 100;
          const amountAfterDiscount = itemBaseAmount - discountAmount;
          const gstPercent = Number(item.gst_percent || 0);
          const itemGstAmount = (amountAfterDiscount * gstPercent) / 100;
          const finalAmount = amountAfterDiscount + itemGstAmount;
          const unitConversionFactor = getConversionFactor(unitVal);

          // Calculate item's share of transport
          let transportShare = 0;
          if (transportCharges > 0 && totalBaseAmount > 0) {
            transportShare =
              (itemBaseAmount / totalBaseAmount) * transportCharges;
          }

          if (itemId) {
            incomingIds.push(itemId);
            const prev = existingMap[itemId];

            // Calculate quantity difference for inventory adjustment
            if (prev) {
              // Get previous quantity in grams
              const prevQuantityGrams = convertToGramsBackend(
                Number(prev.size || 0),
                prev.unit || "kg"
              );

              // Get new quantity in grams
              const newQuantityGrams = convertToGramsBackend(quantity, unitVal);

              // Calculate the difference (positive = adding, negative = removing)
              const quantityDifferenceGrams =
                newQuantityGrams - prevQuantityGrams;

              // Adjust product inventory based on quantity change
              if (quantityDifferenceGrams !== 0) {
                const [prodRows] = await connection.query(
                  `SELECT id, size FROM products WHERE id=? FOR UPDATE`,
                  [prodId]
                );

                if (!prodRows.length) {
                  await connection.query("ROLLBACK");
                  return res
                    .status(400)
                    .json({ error: `product ${prodId} not found` });
                }

                const curr = Number(prodRows[0].size || 0);
                const updated = curr + quantityDifferenceGrams;

                if (updated < 0) {
                  await connection.query("ROLLBACK");
                  return res.status(400).json({
                    error: `stock would go negative for product ${prodId}. Current: ${
                      curr / 1000
                    }kg, Trying to remove: ${
                      Math.abs(quantityDifferenceGrams) / 1000
                    }kg`,
                  });
                }

                await connection.query(
                  `UPDATE products SET size=? WHERE id=?`,
                  [updated, prodId]
                );
              }

              // Get the reference_id for this item
              const itemReferenceId = prev.reference_id;

              // Update item in company-specific table
              const updateCompanyItemSql = `
              UPDATE \`${itemsTable}\` SET 
              product_id=?, rate=?, size=?, unit=?, quantity_in_kg=?,
              discount_percent=?, discount_amount=?, gst_percent=?, gst_amount=?,
              base_amount=?, amount_after_discount=?, final_amount=?,
              taxable_amount=?, unit_conversion_factor=?, transport_share=?, status=?, company_id=?
              WHERE id=?
            `;

              const updateCompanyItemValues = [
                prodId,
                ratePerKg,
                quantity,
                unitVal,
                quantityInKg,
                discountPercent,
                discountAmount,
                gstPercent,
                itemGstAmount,
                itemBaseAmount,
                amountAfterDiscount,
                finalAmount,
                amountAfterDiscount, // taxable_amount
                unitConversionFactor,
                transportShare,
                item.status || "Active",
                company_id,
                itemId,
              ];

              await connection.query(
                updateCompanyItemSql,
                updateCompanyItemValues
              );

              // Update item in base table using reference_id
              if (itemReferenceId) {
                const updateBaseItemSql = `
                UPDATE purchase_items SET 
                product_id=?, rate=?, size=?, unit=?, quantity_in_kg=?,
                discount_percent=?, discount_amount=?, gst_percent=?, gst_amount=?,
                base_amount=?, amount_after_discount=?, final_amount=?,
                taxable_amount=?, unit_conversion_factor=?, transport_share=?, status=?, company_id=?
                WHERE id=?
              `;

                await connection.query(
                  updateBaseItemSql,
                  updateCompanyItemValues.slice(0, -1).concat(itemReferenceId)
                );
              }
            }
          } else {
            // Insert new item - first add to product inventory
            const incGrams = convertToGramsBackend(quantity, unitVal);
            const [prodRows] = await connection.query(
              `SELECT id, size FROM products WHERE id=? FOR UPDATE`,
              [prodId]
            );

            if (!prodRows.length) {
              await connection.query("ROLLBACK");
              return res
                .status(400)
                .json({ error: `product ${prodId} not found` });
            }

            const curr = Number(prodRows[0].size || 0);
            const updated = curr + incGrams;

            if (updated < 0) {
              await connection.query("ROLLBACK");
              return res.status(400).json({
                error: `stock would go negative for product ${prodId}. Current: ${
                  curr / 1000
                }kg, Trying to add: ${incGrams / 1000}kg`,
              });
            }

            await connection.query(`UPDATE products SET size=? WHERE id=?`, [
              updated,
              prodId,
            ]);

            // Insert into company-specific table
            const insertCompanyItemSql = `
            INSERT INTO \`${itemsTable}\` 
            (purchase_id, product_id, rate, size, unit, quantity_in_kg,
             discount_percent, discount_amount, gst_percent, gst_amount,
             base_amount, amount_after_discount, final_amount,
             taxable_amount, unit_conversion_factor, transport_share, status, company_id, reference_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

            const insertCompanyItemValues = [
              companyPurchaseId,
              prodId,
              ratePerKg,
              quantity,
              unitVal,
              quantityInKg,
              discountPercent,
              discountAmount,
              gstPercent,
              itemGstAmount,
              itemBaseAmount,
              amountAfterDiscount,
              finalAmount,
              amountAfterDiscount, // taxable_amount
              unitConversionFactor,
              transportShare,
              "Active",
              company_id,
              null, // reference_id will be set after base insert
            ];

            const [newCompanyItemResult] = await connection.query(
              insertCompanyItemSql,
              insertCompanyItemValues
            );

            const newCompanyItemId = newCompanyItemResult.insertId;

            // Insert into base table
            const insertBaseItemSql = `
            INSERT INTO purchase_items 
            (purchase_id, product_id, rate, size, unit, quantity_in_kg,
             discount_percent, discount_amount, gst_percent, gst_amount,
             base_amount, amount_after_discount, final_amount,
             taxable_amount, unit_conversion_factor, transport_share, status, company_id, reference_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

            const insertBaseItemValues = [
              basePurchaseId,
              prodId,
              ratePerKg,
              quantity,
              unitVal,
              quantityInKg,
              discountPercent,
              discountAmount,
              gstPercent,
              itemGstAmount,
              itemBaseAmount,
              amountAfterDiscount,
              finalAmount,
              amountAfterDiscount, // taxable_amount
              unitConversionFactor,
              transportShare,
              "Active",
              company_id,
              null, // reference_id will be set after company insert
            ];

            const [newBaseItemResult] = await connection.query(
              insertBaseItemSql,
              insertBaseItemValues
            );

            const newBaseItemId = newBaseItemResult.insertId;

            // Update reference_ids to link items between tables
            await connection.query(
              `UPDATE \`${itemsTable}\` SET reference_id = ? WHERE id = ?`,
              [newBaseItemId, newCompanyItemId]
            );

            await connection.query(
              `UPDATE purchase_items SET reference_id = ? WHERE id = ?`,
              [newCompanyItemId, newBaseItemId]
            );

            incomingIds.push(newCompanyItemId);
          }
        }

        // Delete removed items
        const toDelete = existingIds.filter(
          (eid) => !incomingIds.includes(eid)
        );

        if (toDelete.length > 0) {
          for (const delId of toDelete) {
            const r = existingMap[delId];
            if (r) {
              // Revert stock for deleted item
              const prevQuantityGrams = convertToGramsBackend(
                Number(r.size || 0),
                r.unit || "kg"
              );

              if (prevQuantityGrams > 0) {
                const [prodRows] = await connection.query(
                  `SELECT id, size FROM products WHERE id=? FOR UPDATE`,
                  [r.product_id]
                );

                if (prodRows.length) {
                  const curr = Number(prodRows[0].size || 0);
                  const updated = curr - prevQuantityGrams;

                  if (updated < 0) {
                    await connection.query("ROLLBACK");
                    return res.status(400).json({
                      error: `stock would go negative for product ${
                        r.product_id
                      } when deleting item. Current: ${
                        curr / 1000
                      }kg, Trying to remove: ${prevQuantityGrams / 1000}kg`,
                    });
                  }

                  await connection.query(
                    `UPDATE products SET size=? WHERE id=?`,
                    [updated, r.product_id]
                  );
                }
              }

              // Delete from company-specific table
              await connection.query(
                `DELETE FROM \`${itemsTable}\` WHERE id = ?`,
                [delId]
              );

              // Also delete from base table using reference_id
              if (r.reference_id) {
                await connection.query(
                  `DELETE FROM purchase_items WHERE id = ?`,
                  [r.reference_id]
                );
              }
            }
          }
        }
      }

      await connection.query("COMMIT");
      return res.json({
        message: "Purchase updated successfully",
        bill_img: billUrl || undefined,
        totals: {
          total_amount: totalAmount,
          taxable_amount: taxableAmount,
          gst_amount: gstAmount,
          base_amount: baseAmount,
          paid_amount: Number(paid_amount || 0),
          balance_due: totalAmount - Number(paid_amount || 0),
          transport: transportCharges,
        },
      });
    } catch (err) {
      try {
        await connection.query("ROLLBACK");
      } catch {}
      console.error("Purchase update error:", err);
      return res
        .status(400)
        .json({ error: err.message || "Failed to update purchase" });
    }
  },

  getAll: async (req, res) => {
    try {
      const connection = db.promise();
      const code = String(
        req.headers["x-company-code"] || req.query.company_code || ""
      ).toLowerCase();
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const purchasesTable = tn(code, "purchases");
      const itemsTable = tn(code, "purchase_items");

      const [purchases] = await connection.query(`
        SELECT
          p.id, p.bill_no, p.bill_date, p.total_amount, p.status, p.party_type, p.bill_img,
          p.paid_amount, p.discount_percent, p.discount_amount, p.gst_amount, p.taxable_amount,
          p.base_amount, p.payment_method, p.payment_note, p.terms_condition, p.unit as purchase_unit,
          v.vendor_name, v.firm_name, v.address as vendor_address, v.contact_number as vendor_contact,
          f.name AS farmer_name, f.contact_number as farmer_contact
        FROM \`${purchasesTable}\` p
        LEFT JOIN vendors v ON p.vendor_id = v.id
        LEFT JOIN farmers f ON p.farmer_id = f.id
        ORDER BY p.id DESC
      `);

      if (purchases.length === 0) return res.json([]);

      const purchaseIds = purchases.map((p) => p.id);
      const [items] = await connection.query(
        `
        SELECT 
          pi.*, 
          pr.product_name,
          pr.hsn_code,
          (pi.base_amount - pi.discount_amount) as taxable,
          (pi.base_amount - pi.discount_amount + pi.gst_amount) as final_amount
        FROM \`${itemsTable}\` pi
        JOIN products pr ON pi.product_id = pr.id
        WHERE pi.purchase_id IN (?)
        ORDER BY pi.id ASC
        `,
        [purchaseIds]
      );

      const purchasesWithItems = purchases.map((p) => {
        const party_name =
          p.party_type === "vendor" ? p.vendor_name : p.farmer_name;
        const contact_number =
          p.party_type === "vendor" ? p.vendor_contact : p.farmer_contact;
        const address = p.party_type === "vendor" ? p.vendor_address : null;

        // Calculate remaining amount
        const remaining_amount = p.total_amount - (p.paid_amount || 0);

        return {
          ...p,
          party_name,
          contact_number,
          address,
          remaining_amount,
          items: items.filter((i) => i.purchase_id === p.id),
        };
      });

      res.json(purchasesWithItems);
    } catch (err) {
      console.error("GetAll purchases error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const connection = db.promise();

      const code = String(
        req.headers["x-company-code"] || req.query.company_code || ""
      ).toLowerCase();
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const purchasesTable = tn(code, "purchases");
      const itemsTable = tn(code, "purchase_items");

      const [purchaseRows] = await connection.query(
        `
      SELECT 
        p.*,
        v.vendor_name, v.firm_name, v.address as vendor_address, 
        v.contact_number as vendor_contact, v.gst_no as vendor_gst_no,
        f.name AS farmer_name, f.contact_number as farmer_contact
      FROM \`${purchasesTable}\` p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN farmers f ON p.farmer_id = f.id
      WHERE p.id = ?
      `,
        [id]
      );

      if (purchaseRows.length === 0)
        return res.status(404).json({ message: "Purchase not found" });

      // Get items - FIXED: Use 'size' instead of 'available' since that's what exists
      let items = [];
      try {
        const [itemRows] = await connection.query(
          `SELECT 
          pi.*, 
          pr.product_name,
          pr.hsn_code,
          pr.size as current_stock,  // Using 'size' column instead of 'available'
          (pi.base_amount - pi.discount_amount) as taxable,
          (pi.base_amount - pi.discount_amount + pi.gst_amount) as final_amount
         FROM \`${itemsTable}\` pi
         JOIN products pr ON pi.product_id = pr.id
         WHERE pi.purchase_id = ?
         ORDER BY pi.id ASC`,
          [id]
        );
        items = itemRows;
      } catch (err) {
        console.error(
          "Error fetching items with financial details:",
          err.message
        );
        // Fallback to basic query
        const [itemRows] = await connection.query(
          `SELECT 
          pi.*, 
          pr.product_name,
          pr.hsn_code,
          pr.size as current_stock
         FROM \`${itemsTable}\` pi
         JOIN products pr ON pi.product_id = pr.id
         WHERE pi.purchase_id = ?
         ORDER BY pi.id ASC`,
          [id]
        );
        items = itemRows;
      }

      const purchase = purchaseRows[0];
      const party_name =
        purchase.party_type === "vendor"
          ? purchase.vendor_name
          : purchase.farmer_name;

      const contact_number =
        purchase.party_type === "vendor"
          ? purchase.vendor_contact
          : purchase.farmer_contact;

      const address =
        purchase.party_type === "vendor" ? purchase.vendor_address : null;

      const gst_no =
        purchase.party_type === "vendor" ? purchase.vendor_gst_no : null;

      // Calculate summary with safe defaults
      const total_amount = Number(purchase.total_amount || 0);
      const paid_amount = Number(purchase.paid_amount || 0);
      const remaining_amount = total_amount - paid_amount;
      const balance_due = remaining_amount > 0 ? remaining_amount : 0;

      // Calculate item-based totals if financial columns don't exist
      let base_amount = Number(purchase.base_amount || 0);
      let taxable_amount = Number(purchase.taxable_amount || 0);
      let gst_amount = Number(purchase.gst_amount || 0);
      let total_discount = Number(purchase.discount_amount || 0);

      // If financial columns don't exist, calculate from items
      if (!purchase.base_amount && items.length > 0) {
        items.forEach((item) => {
          const size = Number(item.size || 0);
          const unit = item.unit || "kg";
          const rate = Number(item.rate || 0);

          // Convert to KG if needed
          const quantityInKg = convertToKG(size, unit);
          const itemBase = quantityInKg * rate;

          base_amount += itemBase;

          // Calculate discount if available
          const discountPercent = Number(item.discount_percent || 0);
          const itemDiscount = (itemBase * discountPercent) / 100;
          const itemAfterDiscount = itemBase - itemDiscount;

          // Calculate GST if available
          const gstPercent = Number(item.gst_percent || 0);
          const itemGst = (itemAfterDiscount * gstPercent) / 100;

          taxable_amount += itemAfterDiscount;
          gst_amount += itemGst;
          total_discount += itemDiscount;
        });
      }

      res.json({
        ...purchase,
        party_name,
        contact_number,
        address,
        gst_no,
        remaining_amount,
        balance_due,
        items,
        summary: {
          total_items: items.length,
          total_quantity: items.reduce((sum, item) => {
            const size = Number(item.size || 0);
            const unit = item.unit || "kg";
            return sum + convertToKG(size, unit);
          }, 0),
          base_amount: base_amount,
          total_discount:
            total_discount + Number(purchase.discount_amount || 0),
          taxable_amount: taxable_amount || purchase.taxable_amount || 0,
          gst_amount: gst_amount || purchase.gst_amount || 0,
          total_amount: total_amount,
          paid_amount: paid_amount,
          balance_due: balance_due,
        },
      });
    } catch (err) {
      console.error("GetById purchase error:", err);

      // Provide more specific error message
      if (err.message.includes("Unknown column")) {
        return res.status(500).json({
          error: "Database column mismatch",
          details: err.message,
          suggestion:
            "Please check if all required columns exist in the products table",
        });
      }

      res.status(500).json({ error: err.message });
    }
  },

  // Get purchase for PO (for creating purchase from PO)
  getPOForPurchase: async (req, res) => {
    try {
      const { poId } = req.params;
      const connection = db.promise();

      const code = String(
        req.headers["x-company-code"] || req.query.company_code || ""
      ).toLowerCase();
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      // Get PO details
      const [poRows] = await connection.query(
        `SELECT * FROM purchase_orders WHERE id = ?`,
        [poId]
      );

      if (poRows.length === 0)
        return res.status(404).json({ message: "Purchase Order not found" });

      const po = poRows[0];

      // Get PO items
      const [items] = await connection.query(
        `SELECT poi.*, p.product_name, p.hsn_code 
         FROM purchase_order_items poi
         JOIN products p ON poi.product_id = p.id
         WHERE poi.purchase_order_id = ? AND poi.status = 'Active'`,
        [poId]
      );

      // Prepare response
      const response = {
        header: {
          party_type: po.party_type,
          vendor_id: po.vendor_id,
          farmer_id: po.farmer_id,
          vendor_name: po.vendor_name,
          farmer_name: po.farmer_name,
          address: po.address,
          mobile_no: po.mobile_no,
          gst_no: po.gst_no,
          terms_condition: po.terms_condition,
          party_balance: po.party_balance || 0,
          party_min_balance: po.party_min_balance || 0,
        },
        items: items.map((item) => ({
          po_item_id: item.id,
          product_id: item.product_id,
          item_name: item.product_name,
          hsn_code: item.hsn_code,
          pending_qty: item.quantity - (item.received_qty || 0),
          qty: item.quantity,
          rate: item.rate,
          discount_rate: item.discount_rate || 0,
          gst_percent: item.gst_percent || 0,
          unit: item.unit || "kg",
        })),
      };

      res.json(response);
    } catch (err) {
      console.error("Get PO for purchase error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Delete purchase
  delete: async (req, res) => {
    const connection = db.promise();
    try {
      const { id } = req.params;
      const code = normalize(
        req.headers["x-company-code"] || req.body.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const purchasesTable = tn(code, "purchases");
      const itemsTable = tn(code, "purchase_items");

      await connection.query("START TRANSACTION");

      // Get items to revert stock
      const [items] = await connection.query(
        `SELECT product_id, size, unit FROM \`${itemsTable}\` WHERE purchase_id = ?`,
        [id]
      );

      // Revert stock for each item
      for (const item of items) {
        const decGrams = convertToGramsBackend(-item.size, item.unit || "kg");
        const [prodRows] = await connection.query(
          `SELECT id, size FROM products WHERE id = ? FOR UPDATE`,
          [item.product_id]
        );

        if (prodRows.length) {
          const curr = Number(prodRows[0].size || 0);
          const updated = curr + decGrams; // Subtract from current stock

          if (updated < 0) {
            await connection.query("ROLLBACK");
            return res.status(400).json({
              error: `Cannot delete: stock would go negative for product ${item.product_id}`,
            });
          }

          await connection.query(`UPDATE products SET size = ? WHERE id = ?`, [
            updated,
            item.product_id,
          ]);
        }
      }

      // Delete items
      await connection.query(
        `DELETE FROM \`${itemsTable}\` WHERE purchase_id = ?`,
        [id]
      );

      // Delete purchase
      await connection.query(`DELETE FROM \`${purchasesTable}\` WHERE id = ?`, [
        id,
      ]);

      await connection.query("COMMIT");
      res.json({ message: "Purchase deleted successfully" });
    } catch (err) {
      try {
        await connection.query("ROLLBACK");
      } catch {}
      console.error("Purchase delete error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = purchaseController;
