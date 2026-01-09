const db = require("../config/db");

const createVendor = (vendorData, bankData, callback) => {
  // Use DB defaults if undefined by passing DEFAULT keyword
  const vendorQuery = `
    INSERT INTO vendors
      (vendor_name, firm_name, gst_no, address, contact_number, status, balance, min_balance)
    VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, DEFAULT(balance)), COALESCE(?, DEFAULT(min_balance)))
  `;
  db.query(
    vendorQuery,
    [
      vendorData.vendor_name,
      vendorData.firm_name,
      vendorData.gst_no,
      vendorData.address,
      vendorData.contact_number,
      vendorData.status || "active",
      vendorData.balance, // if undefined -> DEFAULT via COALESCE
      vendorData.min_balance, // if undefined -> DEFAULT via COALESCE
    ],
    (err, result) => {
      if (err) return callback(err);
      const vendor_id = result.insertId;

      const safeBank = {
        pan_number: bankData?.pan_number || "",
        account_holder_name: bankData?.account_holder_name || "",
        bank_name: bankData?.bank_name || "",
        account_number: bankData?.account_number || "",
        ifsc_code: bankData?.ifsc_code || "",
        branch_name: bankData?.branch_name || "",
      };

      const bankQuery = `
        INSERT INTO vendor_bank_details
          (vendor_id, pan_number, account_holder_name, bank_name, account_number, ifsc_code, branch_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        bankQuery,
        [
          vendor_id,
          safeBank.pan_number,
          safeBank.account_holder_name,
          safeBank.bank_name,
          safeBank.account_number,
          safeBank.ifsc_code,
          safeBank.branch_name,
        ],
        (err2) => {
          if (err2) return callback(null, { insertId: vendor_id });
          callback(null, { insertId: vendor_id });
        }
      );
    }
  );
};

// ================= Get Vendors =================
// const getVendors = (callback) => {
//   const query = `
//     SELECT
//       v.id, v.vendor_name, v.firm_name, v.gst_no, v.address, v.contact_number, v.status,
//       v.balance, v.min_balance,
//       v.created_at,
//       b.pan_number, b.account_holder_name, b.bank_name, b.account_number, b.ifsc_code, b.branch_name
//     FROM vendors v
//     LEFT JOIN vendor_bank_details b ON v.id = b.vendor_id
//     WHERE v.status = 'active'
//   `;
//   db.query(query, callback);
// };

// ================= Get Vendors =================
const getVendors = (callback) => {
  const query = `
    SELECT
      v.id, v.vendor_name, v.firm_name, v.gst_no, v.address, v.contact_number, v.status,
      v.balance, v.min_balance,
      v.created_at,
      b.pan_number, b.account_holder_name, b.bank_name, b.account_number, b.ifsc_code, b.branch_name
    FROM vendors v
    LEFT JOIN vendor_bank_details b ON v.id = b.vendor_id
    ORDER BY v.status, v.created_at DESC
  `;
  db.query(query, callback);
};

// ================= Update Vendor =================
const updateVendor = (vendor_id, vendorData, bankData, callback) => {
  const vendorQuery = `
    UPDATE vendors
    SET vendor_name=?, firm_name=?, gst_no=?, address=?, contact_number=?, status=?,
        balance=COALESCE(?, balance),
        min_balance=COALESCE(?, min_balance)
    WHERE id=?
  `;
  db.query(
    vendorQuery,
    [
      vendorData.vendor_name,
      vendorData.firm_name,
      vendorData.gst_no,
      vendorData.address,
      vendorData.contact_number,
      vendorData.status,
      vendorData.balance,
      vendorData.min_balance,
      vendor_id,
    ],
    (err) => {
      if (err) return callback(err);

      const safeBank = {
        pan_number: bankData?.pan_number || "",
        account_holder_name: bankData?.account_holder_name || "",
        bank_name: bankData?.bank_name || "",
        account_number: bankData?.account_number || "",
        ifsc_code: bankData?.ifsc_code || "",
        branch_name: bankData?.branch_name || "",
      };

      const bankQuery = `
        UPDATE vendor_bank_details
        SET pan_number=?, account_holder_name=?, bank_name=?, account_number=?, ifsc_code=?, branch_name=?
        WHERE vendor_id=?
      `;
      db.query(
        bankQuery,
        [
          safeBank.pan_number,
          safeBank.account_holder_name,
          safeBank.bank_name,
          safeBank.account_number,
          safeBank.ifsc_code,
          safeBank.branch_name,
          vendor_id,
        ],
        callback
      );
    }
  );
};

// ================= Delete Vendor =================

const deleteVendor = (vendor_id, callback) => {
  const query = "UPDATE vendors SET status = 'inactive' WHERE id = ?";
  db.query(query, [vendor_id], callback);
};

// ================= Update Status Only =================
const updateVendorStatus = (vendor_id, status, callback) => {
  const query = "UPDATE vendors SET status=? WHERE id=?";
  db.query(query, [status, vendor_id], callback);
};

const getVendorById = (vendor_id, callback) => {
  const query = `
    SELECT
      v.id, v.vendor_name, v.firm_name, v.gst_no, v.address, v.contact_number, v.status,
      v.balance, v.min_balance,
      v.created_at,
      b.pan_number, b.account_holder_name, b.bank_name, b.account_number, b.ifsc_code, b.branch_name
    FROM vendors v
    LEFT JOIN vendor_bank_details b ON v.id = b.vendor_id
    WHERE v.id = ?
  `;
  db.query(query, [vendor_id], callback);
};

const getVendorStatement = (
  { vendorId, from, to, limit, offset, sort },
  callback
) => {
  // First get opening balance as of 'from' date

  const openingSql = `
    SELECT
      COALESCE((
        -- Total purchases from vendor (we owe them)
        (SELECT COALESCE(SUM(pur.total_amount), 0) FROM purchases pur
         WHERE pur.vendor_id = ? AND pur.status = 'Active' AND pur.bill_date < ?) +
        -- Total payments we made to vendor
        (SELECT COALESCE(SUM(pp.amount), 0) FROM purchase_payments pp
         WHERE pp.vendor_id = ? AND pp.party_type = 'vendor' AND pp.payment_date < ?) -
        -- Total sales to vendor (they owe us) - vendors can also be customers
        (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s
         WHERE s.vendor_id = ? AND s.status = 'Active' AND s.bill_date < ?) -
        -- Total payments we received from vendor (when they buy from us)
        (SELECT COALESCE(SUM(sp.amount), 0) FROM sale_payments sp
         WHERE sp.vendor_id = ? AND sp.party_type = 'vendor' AND sp.payment_date < ?)
      ), 0) AS opening_balance
  `;

  db.query(
    openingSql,
    [vendorId, from, vendorId, from, vendorId, from, vendorId, from],
    (err, openingResult) => {
      if (err) return callback(err);

      const openingBalance = openingResult[0]?.opening_balance || 0;

      // Step 1: Get all transactions including payments to calculate running balance
      const allTransactionsSql = `
        SELECT 
          tx_datetime,
          net_effect,
          is_display,
          tx_type,
          ref_no,
          invoice_id,
          amount,
          payment_method,
          note,
          details_available
        FROM (
          -- Purchases from vendor (we owe them)
          SELECT
            pur.bill_date AS tx_datetime,
            pur.total_amount AS net_effect,
            1 as is_display,
            'Purchase' AS tx_type,
            CONCAT('PUR-', pur.id) AS ref_no,
            pur.id AS invoice_id,
            pur.total_amount AS amount,
            pur.payment_method,
            CONCAT('Purchase Invoice #', pur.bill_no) AS note,
            1 AS details_available
          FROM purchases pur
          WHERE pur.vendor_id = ? 
            AND pur.status = 'Active' 
            AND pur.bill_date BETWEEN ? AND ?
            AND pur.party_type = 'vendor'
          
          UNION ALL
          
          -- Sales to vendor (they owe us)
          SELECT
            s.bill_date AS tx_datetime,
            -s.total_amount AS net_effect,
            1 as is_display,
            'Sale' AS tx_type,
            CONCAT('SAL-', s.id) AS ref_no,
            s.id AS invoice_id,
            s.total_amount AS amount,
            s.payment_method,
            CONCAT('Sale Invoice #', s.bill_no) AS note,
            1 AS details_available
          FROM sales s
          WHERE s.vendor_id = ? 
            AND s.status = 'Active' 
            AND s.bill_date BETWEEN ? AND ?
            AND s.party_type = 'vendor'
          
          UNION ALL
          
          -- Payments we made to vendor (for calculation only, not displayed)
          SELECT
            pp.payment_date AS tx_datetime,
            -pp.amount AS net_effect,
            0 as is_display,
            'Payment to Vendor' AS tx_type,
            CONCAT('PAY-', pp.id) AS ref_no,
            pp.purchases_id AS invoice_id,
            pp.amount AS amount,
            pp.method AS payment_method,
            pp.remarks AS note,
            0 AS details_available
          FROM purchase_payments pp
          WHERE pp.vendor_id = ? 
            AND pp.party_type = 'vendor' 
            AND pp.payment_date BETWEEN ? AND ?
          
          UNION ALL
          
          -- Payments we received from vendor (for calculation only, not displayed)
          SELECT
            sp.payment_date AS tx_datetime,
            sp.amount AS net_effect,
            0 as is_display,
            'Payment from Vendor' AS tx_type,
            CONCAT('REC-', sp.id) AS ref_no,
            sp.sale_id AS invoice_id,
            sp.amount AS amount,
            sp.method AS payment_method,
            sp.remarks AS note,
            0 AS details_available
          FROM sale_payments sp
          WHERE sp.vendor_id = ? 
            AND sp.party_type = 'vendor' 
            AND sp.payment_date BETWEEN ? AND ?
        ) all_tx
        ORDER BY tx_datetime ${sort === "desc" ? "DESC" : "ASC"}
      `;

      db.query(
        allTransactionsSql,
        [
          vendorId,
          from,
          to, // purchases
          vendorId,
          from,
          to, // sales
          vendorId,
          from,
          to, // payments to vendor
          vendorId,
          from,
          to, // payments from vendor
        ],
        (err, allRows) => {
          if (err) return callback(err);

          // Calculate running balance for all transactions
          let runningBalance = openingBalance;
          const allRowsWithBalance = allRows.map((row) => {
            runningBalance += parseFloat(row.net_effect) || 0;
            return {
              ...row,
              running_balance: runningBalance,
            };
          });

          // Filter only displayable rows (purchases and sales)
          const displayRows = allRowsWithBalance
            .filter((row) => row.is_display === 1)
            .slice(offset, offset + limit);

          // Get totals for summary
          const totalsSql = `
            SELECT
              -- Total purchases from vendor
              (SELECT COALESCE(COUNT(*), 0) FROM purchases pur 
               WHERE pur.vendor_id = ? AND pur.status = 'Active' AND pur.bill_date <= ?) AS total_purchase_invoices,
               
              (SELECT COALESCE(SUM(pur.total_amount), 0) FROM purchases pur 
               WHERE pur.vendor_id = ? AND pur.status = 'Active' AND pur.bill_date <= ?) AS total_purchase_amount,
               
               (SELECT COALESCE(SUM(pur.transport), 0) FROM purchases pur 
               WHERE pur.vendor_id = ? AND pur.status = 'Active' AND pur.bill_date <= ?) AS total_purchase_transport_amount,
               
              -- Total sales to vendor
              (SELECT COALESCE(COUNT(*), 0) FROM sales s 
               WHERE s.vendor_id = ? AND s.status = 'Active' AND s.bill_date <= ?) AS total_sale_invoices,
               
              (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s 
               WHERE s.vendor_id = ? AND s.status = 'Active' AND s.bill_date <= ?) AS total_sale_amount,
               
               (SELECT COALESCE(SUM(s.other_amount), 0) FROM sales s 
               WHERE s.vendor_id = ? AND s.status = 'Active' AND s.bill_date <= ?) AS total_sale_transport_amount,
               

              -- Total payments made to vendor
              (SELECT COALESCE(SUM(pp.amount), 0) FROM purchase_payments pp 
               WHERE pp.vendor_id = ? AND pp.party_type = 'vendor' AND pp.payment_date <= ?) AS total_payments_to_vendor,
               
              -- Total payments received from vendor
              (SELECT COALESCE(SUM(sp.amount), 0) FROM sale_payments sp 
               WHERE sp.vendor_id = ? AND sp.party_type = 'vendor' AND sp.payment_date <= ?) AS total_payments_from_vendor,
               
              -- Opening balance (already calculated)
              ? AS opening_balance,
               
              -- Current outstanding balance
              (
                (SELECT COALESCE(SUM(pur.total_amount), 0) FROM purchases pur 
                 WHERE pur.vendor_id = ? AND pur.status = 'Active' AND pur.bill_date <= ?) +
                (SELECT COALESCE(SUM(pp.amount), 0) FROM purchase_payments pp 
                 WHERE pp.vendor_id = ? AND pp.party_type = 'vendor' AND pp.payment_date <= ?) -
                (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s 
                 WHERE s.vendor_id = ? AND s.status = 'Active' AND s.bill_date <= ?) -
                (SELECT COALESCE(SUM(sp.amount), 0) FROM sale_payments sp 
                 WHERE sp.vendor_id = ? AND sp.party_type = 'vendor' AND sp.payment_date <= ?)
              ) AS outstanding_balance
          `;

          db.query(
            totalsSql,
            [
              vendorId,
              to, // purchase count
              vendorId,
              to, // purchase amount
              vendorId,
              to, // purchase transport amount
              vendorId,
              to, // sale count
              vendorId,
              to, // sale amount
              vendorId,
              to, // sale transport amount
              vendorId,
              to, // payments to
              vendorId,
              to, // payments from
              openingBalance, // opening
              // outstanding balance params
              vendorId,
              to, // purchases
              vendorId,
              to, // payments to
              vendorId,
              to, // sales
              vendorId,
              to, // payments from
            ],
            (err2, totals) => {
              if (err2) {
                console.error("Totals query error:", err2);
                return callback(err2);
              }

              callback(null, {
                rows: displayRows,
                totals: totals[0] || {},
                opening_balance: openingBalance,
              });
            }
          );
        }
      );
    }
  );
};

// New function to get invoice details (items and payments)
const getInvoiceDetails = ({ vendorId, invoiceId, type }, callback) => {
  if (type === "purchase") {
    // Get purchase details
    const purchaseSql = `
      SELECT 
        pur.*,        
        v.vendor_name,
        v.firm_name,
        v.contact_number,
        v.address
      FROM purchases pur
      LEFT JOIN vendors v ON pur.vendor_id = v.id
      WHERE pur.id = ? AND pur.vendor_id = ? AND pur.status = 'Active'
    `;

    db.query(purchaseSql, [invoiceId, vendorId], (err, purchaseResult) => {
      if (err) return callback(err);
      if (purchaseResult.length === 0) {
        return callback(null, {
          error: "Purchase not found or doesn't belong to this vendor",
        });
      }

      const purchase = purchaseResult[0];

      // Get purchase items
      const itemsSql = `
        SELECT 
          pi.*,
          SUM(pi.discount_amount) OVER () AS total_discount_amount,
          p.product_name as product_name,
          p.hsn_code as product_code,
          c.name as product_category
        FROM purchase_items pi
        LEFT JOIN products p ON pi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE pi.purchase_id = ?
        ORDER BY pi.id
      `;

      db.query(itemsSql, [invoiceId], (err2, items) => {
        if (err2) return callback(err2);

        // Get purchase payments
        const paymentsSql = `
          SELECT 
            pp.*,
            DATE_FORMAT(pp.payment_date, '%Y-%m-%d') as payment_date_formatted
          FROM purchase_payments pp
          WHERE pp.purchases_id = ? AND pp.vendor_id = ? AND pp.status = 'Active'
          ORDER BY pp.payment_date, pp.id
        `;

        db.query(paymentsSql, [invoiceId, vendorId], (err3, payments) => {
          if (err3) return callback(err3);

          // Calculate paid amount
          const totalPaid = payments.reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0
          );
          const balance = Number(purchase.total_amount || 0) - totalPaid;

          callback(null, {
            invoice: purchase,
            items: items,
            payments: payments,
            summary: {
              total_amount: Number(purchase.total_amount || 0),
              total_paid: totalPaid,
              balance_due: balance,
              payment_status:
                balance <= 0 ? "Paid" : totalPaid > 0 ? "Partial" : "Unpaid",
            },
          });
        });
      });
    });
  } else if (type === "sale") {
    // Get sale details
    const saleSql = `
      SELECT 
        s.*,
        v.vendor_name,
        v.firm_name,
        v.contact_number,
        v.address
      FROM sales s
      LEFT JOIN vendors v ON s.vendor_id = v.id
      WHERE s.id = ? AND s.vendor_id = ? AND s.status = 'Active'
    `;

    db.query(saleSql, [invoiceId, vendorId], (err, saleResult) => {
      if (err) return callback(err);
      if (saleResult.length === 0) {
        return callback(null, {
          error: "Sale not found or doesn't belong to this vendor",
        });
      }

      const sale = saleResult[0];

      // Get sale items
      const itemsSql = `
        SELECT 
          si.*,
          p.product_name as product_name,
          p.hsn_code as product_code,
          c.name as product_category
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE si.sale_id = ?
        ORDER BY si.id
      `;

      db.query(itemsSql, [invoiceId], (err2, items) => {
        if (err2) return callback(err2);

        // Get sale payments
        const paymentsSql = `
          SELECT 
            sp.*,
            DATE_FORMAT(sp.payment_date, '%Y-%m-%d') as payment_date_formatted
          FROM sale_payments sp
          WHERE sp.sale_id = ? AND sp.vendor_id = ? AND sp.status = 'Active'
          ORDER BY sp.payment_date, sp.id
        `;

        db.query(paymentsSql, [invoiceId, vendorId], (err3, payments) => {
          if (err3) return callback(err3);

          // Calculate paid amount
          const totalPaid = payments.reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0
          );
          const balance = Number(sale.total_amount || 0) - totalPaid;

          callback(null, {
            invoice: sale,
            items: items,
            payments: payments,
            summary: {
              total_amount: Number(sale.total_amount || 0),
              total_paid: totalPaid,
              balance_due: balance,
              payment_status:
                balance <= 0 ? "Paid" : totalPaid > 0 ? "Partial" : "Unpaid",
            },
          });
        });
      });
    });
  } else {
    return callback(
      new Error("Invalid invoice type. Use 'purchase' or 'sale'.")
    );
  }
};

module.exports = {
  createVendor,
  getVendors,
  updateVendor,
  deleteVendor,
  updateVendorStatus,
  getVendorById,
  getVendorStatement,
  getInvoiceDetails,
};
