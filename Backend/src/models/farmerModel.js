const db = require("../config/db");

// Create
const createFarmer = (farmerData, bankData, callback) => {
  const farmerQuery = `
    INSERT INTO farmers
      (name, father_name, district, tehsil, patwari_halka, village, contact_number, khasara_number, status, balance, min_balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, DEFAULT(balance)), COALESCE(?, DEFAULT(min_balance)))
  `;
  db.query(
    farmerQuery,
    [
      farmerData.name,
      farmerData.father_name,
      farmerData.district,
      farmerData.tehsil,
      farmerData.patwari_halka,
      farmerData.village,
      farmerData.contact_number,
      farmerData.khasara_number,
      farmerData.status || "Active",
      farmerData.balance, // undefined => DEFAULT via COALESCE
      farmerData.min_balance, // undefined => DEFAULT via COALESCE
    ],
    (err, result) => {
      if (err) return callback(err);

      const farmer_id = result.insertId;
      const safeBank = {
        pan_number: (bankData && bankData.pan_number) || "",
        account_holder_name: (bankData && bankData.account_holder_name) || "",
        bank_name: (bankData && bankData.bank_name) || "",
        account_number: (bankData && bankData.account_number) || "",
        ifsc_code: (bankData && bankData.ifsc_code) || "",
        branch_name: (bankData && bankData.branch_name) || "",
      };

      const bankQuery = `
        INSERT INTO farmer_bank_details
        (farmer_id, pan_number, account_holder_name, bank_name, account_number, ifsc_code, branch_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        bankQuery,
        [
          farmer_id,
          safeBank.pan_number,
          safeBank.account_holder_name,
          safeBank.bank_name,
          safeBank.account_number,
          safeBank.ifsc_code,
          safeBank.branch_name,
        ],
        callback
      );
    }
  );
};

// Read
// const getFarmers = (callback) => {
//   const query = `
//     SELECT f.id, f.name, f.father_name, f.district, f.tehsil, f.patwari_halka, f.village,
//            f.contact_number, f.khasara_number, f.status,
//            f.balance, f.min_balance,
//            b.pan_number, b.account_holder_name, b.bank_name, b.account_number, b.ifsc_code, b.branch_name
//     FROM farmers f
//     LEFT JOIN farmer_bank_details b ON f.id = b.farmer_id
//     WHERE f.status = 'Active'
//     ORDER BY f.id DESC
//   `;
//   db.query(query, callback);
// };

// Read
const getFarmers = (callback) => {
  const query = `
    SELECT f.id, f.name, f.father_name, f.district, f.tehsil, f.patwari_halka, f.village,
           f.contact_number, f.khasara_number, f.status,
           f.balance, f.min_balance,
           b.pan_number, b.account_holder_name, b.bank_name, b.account_number, b.ifsc_code, b.branch_name
    FROM farmers f
    LEFT JOIN farmer_bank_details b ON f.id = b.farmer_id
    ORDER BY f.status, f.id DESC
  `;
  db.query(query, callback);
};

// Update
const updateFarmer = (farmer_id, farmerData, bankData, callback) => {
  const farmerQuery = `
  UPDATE farmers
  SET name=?, father_name=?, district=?, tehsil=?, patwari_halka=?, village=?, contact_number=?, khasara_number=?,
      status=COALESCE(?, status),
      balance=COALESCE(?, balance),
      min_balance=COALESCE(?, min_balance)
  WHERE id=?
`;
  db.query(
    farmerQuery,
    [
      farmerData.name,
      farmerData.father_name,
      farmerData.district,
      farmerData.tehsil,
      farmerData.patwari_halka,
      farmerData.village,
      farmerData.contact_number,
      farmerData.khasara_number,
      // status: allow undefined to keep existing
      farmerData.status,
      farmerData.balance,
      farmerData.min_balance,
      farmer_id,
    ]
    // ...
  );
};

// Delete
const deleteFarmer = (farmer_id, callback) => {
  db.query(
    "UPDATE farmers SET status='Inactive' WHERE id=?",
    [farmer_id],
    callback
  );
};

// Status
const updateFarmerStatus = (farmer_id, status, callback) => {
  db.query(
    "UPDATE farmers SET status=? WHERE id=?",
    [status, farmer_id],
    callback
  );
};

// Statement
// const getFarmerStatement = (
//   { farmerId, from, to, limit, offset, sort },
//   callback
// ) => {
//   // First get opening balance as of 'from' date
//   const openingSql = `
//     SELECT
//       COALESCE((
//         (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date < ?) -
//         (SELECT COALESCE(SUM(p.amount), 0) FROM sale_payments p WHERE p.farmer_id = ? AND p.party_type = 'farmer' AND p.payment_date < ?)
//       ), 0) AS opening_balance
//   `;

//   db.query(
//     openingSql,
//     [farmerId, from, farmerId, from],
//     (err, openingResult) => {
//       if (err) return callback(err);

//       const openingBalance = openingResult[0]?.opening_balance || 0;

//       // Now get transactions with running balance starting from opening balance
//       const sql = `
//       SELECT
//         DATE_FORMAT(t.tx_datetime, '%Y-%m-%d %H:%i:%s') AS tx_datetime,
//         t.tx_type,
//         t.ref_no,
//         t.amount,
//         t.net_effect,
//         t.running_balance,
//         t.payment_method,
//         t.note
//       FROM (
//         -- Sales transactions
//         SELECT
//           s.bill_date AS tx_datetime,
//           'Sale' AS tx_type,
//           CONCAT('INV-', s.id) AS ref_no,
//           s.total_amount AS amount,
//           s.total_amount AS net_effect,
//           @running_balance := @running_balance + s.total_amount AS running_balance,
//           NULL AS payment_method,
//           CONCAT('Sale Invoice #', s.id) AS note
//         FROM sales s
//         WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date BETWEEN ? AND ?
//         UNION ALL
//         -- Payment transactions
//         SELECT
//           p.payment_date AS tx_datetime,
//           'Payment' AS tx_type,
//           CONCAT('PAY-', p.id) AS ref_no,
//           p.amount,
//           -p.amount AS net_effect,
//           @running_balance := @running_balance - p.amount AS running_balance,
//           p.method AS payment_method,
//           p.remarks AS note
//         FROM sale_payments p
//         WHERE p.farmer_id = ? AND p.party_type = 'farmer' AND p.payment_date BETWEEN ? AND ?
//       ) t
//       ORDER BY t.tx_datetime ${sort === "desc" ? "DESC" : "ASC"}
//       LIMIT ? OFFSET ?
//     `;

//       // Initialize running balance variable with opening balance
//       db.query(`SET @running_balance = ${openingBalance}`, (err) => {
//         if (err) return callback(err);

//         db.query(
//           sql,
//           [farmerId, from, to, farmerId, from, to, limit, offset],
//           (err, rows) => {
//             if (err) return callback(err);

//             // Get totals
//             const totalsSql = `
//           SELECT
//             (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date <= ?) AS total_invoiced,
//             (SELECT COALESCE(SUM(p.amount), 0) FROM sale_payments p WHERE p.farmer_id = ? AND p.party_type = 'farmer' AND p.payment_date <= ?) AS total_paid,
//             ((SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date <= ?) -
//              (SELECT COALESCE(SUM(p.amount), 0) FROM sale_payments p WHERE p.farmer_id = ? AND p.party_type = 'farmer' AND p.payment_date <= ?)) AS outstanding_balance
//         `;

//             db.query(
//               totalsSql,
//               [farmerId, to, farmerId, to, farmerId, to, farmerId, to],
//               (err2, totals) => {
//                 if (err2) return callback(err2);
//                 callback(null, {
//                   rows,
//                   totals:
//                     { ...totals[0], opening_balance: openingBalance } || {},
//                 });
//               }
//             );
//           }
//         );
//       });
//     }
//   );
// };

// farmer.model.js - Updated getFarmerStatement function

const getFarmerStatement = (
  { farmerId, from, to, limit, offset, sort },
  callback
) => {
  // First get opening balance as of 'from' date
  const openingSql = `
    SELECT
      COALESCE((
        -- Total sales to farmer (we owe them)
        (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s 
         WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date < ?) +
        -- Total payments we made to farmer
        (SELECT COALESCE(SUM(p.amount), 0) FROM sale_payments p 
         WHERE p.farmer_id = ? AND p.party_type = 'farmer' AND p.payment_date < ?) -
        -- Total purchases from farmer (they owe us)
        (SELECT COALESCE(SUM(pur.total_amount), 0) FROM purchases pur 
         WHERE pur.farmer_id = ? AND pur.status = 'Active' AND pur.bill_date < ?) -
        -- Total payments we received from farmer
        (SELECT COALESCE(SUM(pp.amount), 0) FROM purchase_payments pp 
         WHERE pp.farmer_id = ? AND pp.party_type = 'farmer' AND pp.payment_date < ?)
      ), 0) AS opening_balance
  `;

  db.query(
    openingSql,
    [farmerId, from, farmerId, from, farmerId, from, farmerId, from],
    (err, openingResult) => {
      if (err) return callback(err);

      const openingBalance = openingResult[0]?.opening_balance || 0;

      // Now get all transactions (purchases, sales, and payments) with running balance
      const sql = `
      SELECT
        DATE_FORMAT(t.tx_datetime, '%Y-%m-%d %H:%i:%s') AS tx_datetime,
        t.tx_type,
        t.ref_no,
        t.invoice_id,
        t.amount,
        t.net_effect,
        t.running_balance,
        t.payment_method,
        t.note,
        t.details_available
      FROM (
        -- Purchases from farmer (they owe us)
        SELECT
          pur.bill_date AS tx_datetime,
          'Purchase' AS tx_type,
          CONCAT('PUR-', pur.id) AS ref_no,
          pur.id AS invoice_id,
          pur.total_amount AS amount,
          -pur.total_amount AS net_effect,
          @running_balance := @running_balance - pur.total_amount AS running_balance,
          pur.payment_method,
          CONCAT('Purchase Invoice #', pur.bill_no) AS note,
          1 AS details_available
        FROM purchases pur
        WHERE pur.farmer_id = ? 
          AND pur.status = 'Active' 
          AND pur.bill_date BETWEEN ? AND ?
          AND pur.party_type = 'farmer'
        
        UNION ALL
        
        -- Sales to farmer (we owe them)
        SELECT
          s.bill_date AS tx_datetime,
          'Sale' AS tx_type,
          CONCAT('SAL-', s.id) AS ref_no,
          s.id AS invoice_id,
          s.total_amount AS amount,
          s.total_amount AS net_effect,
          @running_balance := @running_balance + s.total_amount AS running_balance,
          s.payment_method,
          CONCAT('Sale Invoice #', s.bill_no) AS note,
          1 AS details_available
        FROM sales s
        WHERE s.farmer_id = ? 
          AND s.status = 'Active' 
          AND s.bill_date BETWEEN ? AND ?
          AND s.party_type = 'farmer'
        
        UNION ALL
        
        -- Payments we made to farmer
        SELECT
          p.payment_date AS tx_datetime,
          'Payment to Farmer' AS tx_type,
          CONCAT('PAY-', p.id) AS ref_no,
          p.sale_id AS invoice_id,
          p.amount AS amount,
          -p.amount AS net_effect,
          @running_balance := @running_balance - p.amount AS running_balance,
          p.method AS payment_method,
          p.remarks AS note,
          0 AS details_available
        FROM sale_payments p
        WHERE p.farmer_id = ? 
          AND p.party_type = 'farmer' 
          AND p.payment_date BETWEEN ? AND ?
        
        UNION ALL
        
        -- Payments we received from farmer
        SELECT
          pp.payment_date AS tx_datetime,
          'Payment from Farmer' AS tx_type,
          CONCAT('REC-', pp.id) AS ref_no,
          pp.purchases_id AS invoice_id,
          pp.amount AS amount,
          pp.amount AS net_effect,
          @running_balance := @running_balance + pp.amount AS running_balance,
          pp.method AS payment_method,
          pp.remarks AS note,
          0 AS details_available
        FROM purchase_payments pp
        WHERE pp.farmer_id = ? 
          AND pp.party_type = 'farmer' 
          AND pp.payment_date BETWEEN ? AND ?
      ) t
      ORDER BY t.tx_datetime ${sort === "desc" ? "DESC" : "ASC"}
      LIMIT ? OFFSET ?
    `;

      // Initialize running balance variable with opening balance
      db.query(`SET @running_balance = ${openingBalance}`, (err) => {
        if (err) return callback(err);

        db.query(
          sql,
          [
            farmerId,
            from,
            to, // purchases
            farmerId,
            from,
            to, // sales
            farmerId,
            from,
            to, // payments to farmer
            farmerId,
            from,
            to, // payments from farmer
            limit,
            offset,
          ],
          (err, rows) => {
            if (err) return callback(err);

            // Get totals for summary
            const totalsSql = `
              SELECT
                -- Total purchases from farmer
                (SELECT COALESCE(COUNT(*), 0) FROM purchases pur 
                 WHERE pur.farmer_id = ? AND pur.status = 'Active' AND pur.bill_date <= ?) AS total_purchase_invoices,
                 
                (SELECT COALESCE(SUM(pur.total_amount), 0) FROM purchases pur 
                 WHERE pur.farmer_id = ? AND pur.status = 'Active' AND pur.bill_date <= ?) AS total_purchase_amount,

                -- Total purchases transport amount
                (SELECT COALESCE(SUM(pur.transport), 0) FROM purchases pur 
                 WHERE pur.farmer_id = ? AND pur.status = 'Active' AND pur.bill_date <= ?) AS total_purchase_transport_amount,

                -- Total sales to farmer
                (SELECT COALESCE(COUNT(*), 0) FROM sales s 
                 WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date <= ?) AS total_sale_invoices,
                 
                (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s 
                 WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date <= ?) AS total_sale_amount,
                 
                  (SELECT COALESCE(SUM(s.other_amount), 0) FROM sales s 
                 WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date <= ?) AS total_sale_transport_amount,
                             
 
                -- Total payments made to farmer
                (SELECT COALESCE(SUM(p.amount), 0) FROM sale_payments p 
                 WHERE p.farmer_id = ? AND p.party_type = 'farmer' AND p.payment_date <= ?) AS total_payments_to_farmer,
                 
                -- Total payments received from farmer
                (SELECT COALESCE(SUM(pp.amount), 0) FROM purchase_payments pp 
                 WHERE pp.farmer_id = ? AND pp.party_type = 'farmer' AND pp.payment_date <= ?) AS total_payments_from_farmer,
                 
                -- Opening balance (already calculated)
                ? AS opening_balance,
                 
                -- Current outstanding balance
                (
                  (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s 
                   WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date <= ?) +
                  (SELECT COALESCE(SUM(p.amount), 0) FROM sale_payments p 
                   WHERE p.farmer_id = ? AND p.party_type = 'farmer' AND p.payment_date <= ?) -
                  (SELECT COALESCE(SUM(pur.total_amount), 0) FROM purchases pur 
                   WHERE pur.farmer_id = ? AND pur.status = 'Active' AND pur.bill_date <= ?) -
                  (SELECT COALESCE(SUM(pp.amount), 0) FROM purchase_payments pp 
                   WHERE pp.farmer_id = ? AND pp.party_type = 'farmer' AND pp.payment_date <= ?)
                ) AS outstanding_balance,
                
                -- Closing balance (same as outstanding balance)
                (
                  (SELECT COALESCE(SUM(s.total_amount), 0) FROM sales s 
                   WHERE s.farmer_id = ? AND s.status = 'Active' AND s.bill_date <= ?) +
                  (SELECT COALESCE(SUM(p.amount), 0) FROM sale_payments p 
                   WHERE p.farmer_id = ? AND p.party_type = 'farmer' AND p.payment_date <= ?) -
                  (SELECT COALESCE(SUM(pur.total_amount), 0) FROM purchases pur 
                   WHERE pur.farmer_id = ? AND pur.status = 'Active' AND pur.bill_date <= ?) -
                  (SELECT COALESCE(SUM(pp.amount), 0) FROM purchase_payments pp 
                   WHERE pp.farmer_id = ? AND pp.party_type = 'farmer' AND pp.payment_date <= ?)
                ) AS closing_balance
            `;

            db.query(
              totalsSql,
              [
                farmerId,
                to, // purchase count
                farmerId,
                to, // purchase amount
                farmerId,
                to, // purchase transport amount
                farmerId,
                to, // sale count
                farmerId,
                to, // sale amount
                farmerId,
                to, // sale transport amount
                farmerId,
                to, // payments to
                farmerId,
                to, // payments from
                openingBalance, // opening
                // outstanding balance params
                farmerId,
                to, // sales
                farmerId,
                to, // payments to
                farmerId,
                to, // purchases
                farmerId,
                to, // payments from
                // closing balance params
                farmerId,
                to, // sales
                farmerId,
                to, // payments to
                farmerId,
                to, // purchases
                farmerId,
                to, // payments from
              ],
              (err2, totals) => {
                if (err2) return callback(err2);

                callback(null, {
                  rows,
                  totals: totals[0] || {},
                  opening_balance: openingBalance,
                });
              }
            );
          }
        );
      });
    }
  );
};

// New function to get invoice details (items and payments)
const getInvoiceDetails = ({ farmerId, invoiceId, type }, callback) => {
  if (type === "purchase") {
    // Get purchase details
    const purchaseSql = `
      SELECT 
        pur.*,
        f.name as farmer_name,
        f.contact_number,
        f.village
      FROM purchases pur
      LEFT JOIN farmers f ON pur.farmer_id = f.id
      WHERE pur.id = ? AND pur.farmer_id = ? AND pur.status = 'Active'
    `;

    db.query(purchaseSql, [invoiceId, farmerId], (err, purchaseResult) => {
      if (err) return callback(err);
      if (purchaseResult.length === 0) {
        return callback(null, {
          error: "Purchase not found or doesn't belong to this farmer",
        });
      }

      const purchase = purchaseResult[0];

      // Get purchase items
      const itemsSql = `
        SELECT 
          pi.*,
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
          WHERE pp.purchases_id = ? AND pp.farmer_id = ? AND pp.status = 'Active'
          ORDER BY pp.payment_date, pp.id
        `;

        db.query(paymentsSql, [invoiceId, farmerId], (err3, payments) => {
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
        f.name as farmer_name,
        f.contact_number,
        f.village
      FROM sales s
      LEFT JOIN farmers f ON s.farmer_id = f.id
      WHERE s.id = ? AND s.farmer_id = ? AND s.status = 'Active'
    `;

    db.query(saleSql, [invoiceId, farmerId], (err, saleResult) => {
      if (err) return callback(err);
      if (saleResult.length === 0) {
        return callback(null, {
          error: "Sale not found or doesn't belong to this farmer",
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
          WHERE sp.sale_id = ? AND sp.farmer_id = ? AND sp.status = 'Active'
          ORDER BY sp.payment_date, sp.id
        `;

        db.query(paymentsSql, [invoiceId, farmerId], (err3, payments) => {
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
  createFarmer,
  getFarmers,
  updateFarmer,
  deleteFarmer,
  updateFarmerStatus,
  getFarmerStatement,
  getInvoiceDetails,
};
