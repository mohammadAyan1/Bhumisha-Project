// controllers/sales.controller.js
const Sales = require("../models/sales.model");
// const SaleItems = require("../models/saleItems.model");
const { normalize } = require("../services/companyCode");
const Company = require("../models/company.model");
const { generateSoToSaleResponse } = require("../services/convertSoToSale");

// Add this helper function in your sales controller or a separate utility file
function getFinancialYear(date = new Date()) {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1; // January is 0

  // Financial year runs from April (month 4) to March (month 3)
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

const SalesController = {
  async createSale(req, res) {
    try {
      // require company code header/body
      const code = normalize(
        req.headers["x-company-code"] || req.body.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });
      const {
        party_type, // 'customer' | 'vendor' | 'farmer'
        customer_id,
        vendor_id,
        farmer_id,
        bill_no,
        bill_date,
        items,
        status = "Active",
        payment_status = "Unpaid",
        payment_method = "Cash",
        remarks = null,
        other_amount = 0,
        other_note = null,
        cash_received = 0,
      } = req.body;

      const buyer_type = req.body.buyer_type?.toLowerCase().replace(/\s+/g, "");

      if (!bill_date || !Array.isArray(items) || !items.length) {
        return res
          .status(400)
          .json({ error: "bill_date and items[] required" });
      }
      if (!["customer", "vendor", "farmer"].includes(party_type)) {
        return res.status(400).json({
          error: "party_type must be 'customer' | 'vendor' | 'farmer'",
        });
      }
      const chosenId =
        party_type === "customer"
          ? customer_id
          : party_type === "vendor"
          ? vendor_id
          : party_type === "farmer"
          ? farmer_id
          : null;
      if (!chosenId) {
        return res.status(400).json({ error: `${party_type}_id is required` });
      }

      const result = await Sales.create(
        {
          party_type,
          customer_id,
          vendor_id,
          farmer_id,
          buyer_type,
          bill_no,
          bill_date,
          status,
          payment_status,
          payment_method,
          remarks,
          other_amount,
          other_note,
          items,
          cash_received: Number(cash_received || 0),
        },
        code
      );

      // If created from a Sales Order, mark that SO as converted with robust fallback
      try {
        const linkedSoId = Number(req.body?.linked_so_id || 0);
        if (linkedSoId) {
          await new Promise((resolve, reject) =>
            db.query(
              `UPDATE sales_orders SET status='Inactive' WHERE id=?`,
              [linkedSoId],
              (e) => (e ? reject(e) : resolve())
            )
          ).catch((e) => {
            if (
              e &&
              (e.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" ||
                e.code === "WARN_DATA_TRUNCATED" ||
                e.errno === 1265 ||
                e.sqlState === "01000")
            ) {
              return new Promise((resolve2, reject2) =>
                db.query(
                  `UPDATE sales_orders SET status='Cancelled' WHERE id=?`,
                  [linkedSoId],
                  (e2) => (e2 ? reject2(e2) : resolve2())
                )
              );
            }
            throw e;
          });
        }
      } catch {}

      return res.status(201).json({
        message: "Sale created successfully",
        id: result.id,
        company_sale_id: result.company_sale_id,
        bill_no: result.bill_no,
        total_taxable: result.total_taxable,
        total_gst: result.total_gst,
        total_amount: result.total_amount,
        previous_due: result.previous_due,
        cash_received: result.cash_received,
        new_due: result.new_due,
        payment_status: result.payment_status,
      });
    } catch (err) {
      console.error("createSale error:", err);
      return res.status(400).json({ error: err.message || "Server Error" });
    }
  },

  async getSales(_req, res) {
    try {
      const code = normalize(
        _req.headers["x-company-code"] || _req.query.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });
      const sales = await Sales.getAll(code);
      return res.json(sales);
    } catch (err) {
      console.error("getSales error:", err);
      return res.status(500).json({ error: "Server Error" });
    }
  },

  async getSaleByIdWithItems(req, res) {
    try {
      const sale_id = Number(req.params.id);
      if (!sale_id) return res.status(400).json({ error: "Invalid sale ID" });
      const code = normalize(
        req.headers["x-company-code"] || req.query.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });
      const sale = await Sales.getById(sale_id, code);
      if (!sale) return res.status(404).json({ error: "Sale not found" });
      // Attach company details for invoice/logo rendering
      try {
        const company = await Company.getByCode(code);
        if (company) sale.company = company;
      } catch {}
      // items already embedded by model.getById
      return res.json(sale);
    } catch (err) {
      console.error("getSaleByIdWithItems error:", err);
      return res.status(500).json({ error: "Server Error" });
    }
  },

  // async updateSale(req, res) {
  //   try {
  //     const sale_id = Number(req.params.id);
  //     if (!sale_id) return res.status(400).json({ error: "Invalid sale ID" });
  //     const code = normalize(
  //       req.headers["x-company-code"] || req.body.company_code || ""
  //     );
  //     if (!code)
  //       return res.status(400).json({ error: "x-company-code required" });

  //     const {
  //       party_type,
  //       customer_id,
  //       vendor_id,
  //       farmer_id,
  //       bill_no = null,
  //       bill_date = null,
  //       items,
  //       status,
  //       payment_status,
  //       payment_method,
  //       remarks,
  //       cash_received = 0,
  //     } = req.body;

  //     if (!bill_date)
  //       return res.status(400).json({ error: "Bill date is required" });
  //     if (!["customer", "vendor", "farmer"].includes(party_type)) {
  //       return res.status(400).json({
  //         error: "party_type must be 'customer' | 'vendor' | 'farmer'",
  //       });
  //     }
  //     const chosenId =
  //       party_type === "customer"
  //         ? customer_id
  //         : party_type === "vendor"
  //         ? vendor_id
  //         : party_type === "farmer"
  //         ? farmer_id
  //         : null;
  //     if (!chosenId)
  //       return res.status(400).json({ error: `${party_type}_id is required` });

  //     const result = await Sales.update(
  //       sale_id,
  //       {
  //         party_type,
  //         customer_id,
  //         vendor_id,
  //         farmer_id,
  //         bill_no,
  //         bill_date,
  //         status,
  //         payment_status,
  //         payment_method,
  //         remarks,
  //         items,
  //         cash_received: Number(cash_received || 0),
  //       },
  //       code
  //     );

  //     return res.json({
  //       message: "Sale updated successfully",
  //       total_taxable: result.total_taxable,
  //       total_gst: result.total_gst,
  //       total_amount: result.total_amount,
  //     });
  //   } catch (err) {
  //     console.error("updateSale error:", err);
  //     return res.status(400).json({ error: err.message || "Server Error" });
  //   }
  // },

  // Sales model - update method
  // Update Sales Controller
  async updateSale(req, res) {
    try {
      const sale_id = Number(req.params.id);
      if (!sale_id) return res.status(400).json({ error: "Invalid sale ID" });

      const code = normalize(
        req.headers["x-company-code"] || req.body.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const {
        party_type,
        customer_id,
        vendor_id,
        farmer_id,
        bill_no,
        bill_date,
        buyer_type,
        items,
        status,
        payment_status,
        payment_method,
        remarks,
        other_amount = 0,
        other_note = null,
        cash_received = 0,
      } = req.body;

      // Validate required fields
      if (!bill_date)
        return res.status(400).json({ error: "Bill date is required" });

      if (!["customer", "vendor", "farmer"].includes(party_type)) {
        return res.status(400).json({
          error: "party_type must be 'customer' | 'vendor' | 'farmer'",
        });
      }

      const chosenId =
        party_type === "customer"
          ? customer_id
          : party_type === "vendor"
          ? vendor_id
          : party_type === "farmer"
          ? farmer_id
          : null;

      if (!chosenId)
        return res.status(400).json({ error: `${party_type}_id is required` });

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

        // Determine table names
        const salesTable = `sales_${code}`; // or use your naming convention
        const saleItemsTable = `sale_items_${code}`;
        const paymentsTable = `sale_payments_${code}`;

        // First, fetch the existing sale to restore stock and get reference IDs
        const [existingSaleRows] = await conn.execute(
          `SELECT * FROM \`${salesTable}\` WHERE id = ?`,
          [sale_id]
        );

        if (!existingSaleRows.length) {
          throw new Error(`Sale with ID ${sale_id} not found`);
        }

        const existingSale = existingSaleRows[0];
        const masterSaleId = existingSale.reference_id;

        // Fetch existing items to restore stock
        const [existingItems] = await conn.execute(
          `SELECT * FROM \`${saleItemsTable}\` WHERE sale_id = ?`,
          [sale_id]
        );

        // Restore stock from existing items
        for (const item of existingItems) {
          const [prodRows] = await conn.execute(
            `SELECT id, size FROM products WHERE id = ? FOR UPDATE`,
            [item.product_id]
          );

          if (prodRows.length) {
            const prod = prodRows[0];
            const currentSize = Number(prod.size || 0);
            const qtyInGrams = Number(item.qty || 0) * 1000; // Assuming qty is in kg in database

            await conn.execute(`UPDATE products SET size = ? WHERE id = ?`, [
              String(currentSize + qtyInGrams),
              item.product_id,
            ]);
          }
        }

        // Delete existing items from both company and master tables
        await conn.execute(
          `DELETE FROM \`${saleItemsTable}\` WHERE sale_id = ?`,
          [sale_id]
        );

        await conn.execute(`DELETE FROM sale_items WHERE sale_id = ?`, [
          masterSaleId,
        ]);

        // Delete existing payments
        await conn.execute(
          `DELETE FROM \`${paymentsTable}\` WHERE sale_id = ?`,
          [sale_id]
        );

        await conn.execute(`DELETE FROM sale_payments WHERE sale_id = ?`, [
          masterSaleId,
        ]);

        // Calculate totals for the updated sale
        let total_taxable = 0,
          total_gst = 0,
          total_discount_amount = 0,
          total_amount = 0;

        // Insert new items and decrement stock
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

          // Use qty_in_grams if provided, otherwise calculate from qty and unit
          let qtyInGrams = 0;
          if (item.qty_in_grams) {
            qtyInGrams = Number(item.qty_in_grams);
          } else {
            // Convert based on unit
            const unit = item.unit || "kg";
            const qty = Number(item.qty || 0);
            switch (unit.toLowerCase()) {
              case "ton":
                qtyInGrams = qty * 1000000; // 1 ton = 1,000,000 grams
                break;
              case "quantal":
                qtyInGrams = qty * 100000; // 1 quantal = 100,000 grams
                break;
              case "kg":
                qtyInGrams = qty * 1000; // 1 kg = 1,000 grams
                break;
              case "gram":
                qtyInGrams = qty; // Already in grams
                break;
              default:
                qtyInGrams = qty * 1000; // Default to kg
            }
          }

          if (!Number.isFinite(qtyInGrams) || qtyInGrams <= 0)
            throw new Error(`Invalid quantity for product ${item.product_id}`);

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
          const unit = item.unit || "kg";
          const productDetails = item.salesProductItemDetails || {};

          // Insert into COMPANY-SPECIFIC sale_items table
          const [companyItemRes] = await conn.execute(
            `INSERT INTO \`${saleItemsTable}\`
         (sale_id, product_id, rate, qty, discount_rate, discount_amount, taxable_amount, gst_percent, gst_amount, net_total, unit, status, product_detail, reference_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, NULL)`,
            [
              sale_id,
              item.product_id,
              ratePerKg,
              item.qty, // Original qty for display
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
              masterSaleId,
              item.product_id,
              ratePerKg,
              item.qty, // Original qty for display
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

        // Calculate totals with other_amount
        const addl = Math.max(0, Number(other_amount || 0));
        const finalTotalAmount = total_amount + addl;

        // Update payment status based on calculations
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

        // Update COMPANY sales table
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
            buyer_type || existingSale.buyer_type || "retailer",
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

        // Update MASTER sales table
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
            buyer_type || existingSale.buyer_type || "retailer",
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
          // Insert into COMPANY-SPECIFIC payments table
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
          const company_payment_id = companyPaymentRes.insertId;

          // Insert into MASTER payments table
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

        await conn.commit();

        return res.json({
          message: "Sale updated successfully",
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
        });
      } catch (err) {
        await conn.rollback();
        console.error("updateSale error:", err);
        return res.status(400).json({ error: err.message || "Server Error" });
      } finally {
        if (conn) conn.release();
      }
    } catch (err) {
      console.error("updateSale error:", err);
      return res.status(400).json({ error: err.message || "Server Error" });
    }
  },

  async deleteSale(req, res) {
    try {
      const sale_id = Number(req.params.id);
      if (!sale_id) return res.status(400).json({ error: "Invalid sale ID" });
      const code = normalize(
        req.headers["x-company-code"] || req.query.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });
      await Sales.delete(sale_id, code);
      return res.json({ message: "Sale deleted successfully" });
    } catch (err) {
      console.error("deleteSale error:", err);
      return res.status(500).json({ error: "Server Error" });
    }
  },

  // async getNewBillNo(_req, res) {
  //   try {
  //     const code = normalize(
  //       _req.headers["x-company-code"] || _req.query.company_code || ""
  //     );
  //     if (!code)
  //       return res.status(400).json({ error: "x-company-code required" });
  //     const bill_no = await Sales.getNewBillNo(code);
  //     return res.json({ bill_no });
  //   } catch (err) {
  //     console.error("getNewBillNo error:", err);
  //     return res.status(500).json({ error: err.message });
  //   }
  // },

  // Optional: heavy endpoint with embedded items list

  async getNewBillNo(_req, res) {
    try {
      const code = normalize(
        _req.headers["x-company-code"] || _req.query.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const bill_no = await Sales.getNewBillNo(code);
      return res.json({ bill_no });
    } catch (err) {
      console.error("getNewBillNo error:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  async getPartyPreviousDue(req, res) {
    try {
      const party_type = String(req.params.type || "").toLowerCase();
      const party_id = Number(req.params.id);
      if (!["customer", "vendor", "farmer"].includes(party_type)) {
        return res
          .status(400)
          .json({ error: "type must be 'customer' | 'vendor' | 'farmer'" });
      }
      if (!party_id) return res.status(400).json({ error: "Invalid party id" });

      const conn = await require("../models/sales.model").getConnection();
      try {
        const code = normalize(
          req.headers["x-company-code"] || req.query.company_code || ""
        );
        if (!code)
          return res.status(400).json({ error: "x-company-code required" });
        const { tn } = require("../services/tableName");
        const salesTable = tn(code, "sales");
        const paymentsTable = tn(code, "sale_payments");

        // Ensure per-company payments table exists (idempotent). Template `tpl_sale_payments` should define required columns.
        await conn.execute(
          `CREATE TABLE IF NOT EXISTS \`${paymentsTable}\` LIKE \`tpl_sale_payments\``
        );

        const [[agg]] = await conn.query(
          `
          SELECT
            COALESCE((
              SELECT SUM(s.total_amount)
              FROM \`${salesTable}\` s
              WHERE s.${party_type}_id = ? AND (s.status IS NULL OR s.status <> 'Cancelled')
            ), 0) AS total_sales,
            COALESCE((
              SELECT SUM(p.amount)
              FROM \`${paymentsTable}\` p
              WHERE p.party_type = ? AND p.${party_type}_id = ?
            ), 0) AS total_payments
          `,
          [party_id, party_type, party_id]
        );
        const total_sales = Number(agg?.total_sales || 0);
        const total_payments = Number(agg?.total_payments || 0);
        const previous_due = Math.max(total_sales - total_payments, 0);
        return res.json({ previous_due, total_sales, total_payments });
      } finally {
        await conn.end();
      }
    } catch (err) {
      console.error("getPartyPreviousDue error:", err);
      return res.status(500).json({ error: "Server Error" });
    }
  },

  // Get Sales Order Items for creating Sale
  async getFromSO(req, res) {
    try {
      const soId = req.params.id;
      const code = normalize(
        req.headers["x-company-code"] || req.query.company_code || ""
      );
      if (!code)
        return res.status(400).json({ error: "x-company-code required" });

      const { tn } = require("../services/tableName");
      const soTable = tn(code, "sales_orders");
      const soItemsTable = tn(code, "sales_order_items");

      const conn = await require("../models/sales.model").getConnection();
      try {
        // Get SO header
        const [[soHeader]] = await conn.query(
          `SELECT * FROM \`${soTable}\` WHERE id = ?`,
          [soId]
        );

        if (!soHeader) {
          return res.status(404).json({ error: "Sales Order not found" });
        }

        // Get SO items
        const [soItems] = await conn.query(
          `SELECT * FROM \`${soItemsTable}\` WHERE so_id = ?`,
          [soId]
        );

        // Format response
        const response = generateSoToSaleResponse(soHeader, soItems);

        res.json(response);
      } finally {
        await conn.end();
      }
    } catch (err) {
      console.error("getFromSO error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = SalesController;
