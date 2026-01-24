const db = require("../config/db");
const { tn } = require("../services/tableName");

// Helper function to calculate status
function calculateStatus(totalAmount, paidAmount, leftAmount) {
  if (leftAmount === 0 || paidAmount >= totalAmount) {
    return "paid";
  } else if (paidAmount > 0) {
    return "partial";
  } else {
    return "unpaid";
  }
}

// Helper function to group items by bill
function groupItemsByBill(results, billType) {
  const grouped = {};

  results.forEach((row) => {
    const billId = billType === "sale" ? row.sale_id : row.purchase_id;

    if (!grouped[billId]) {
      grouped[billId] = {
        id: billId,
        invoice_no: row.invoice_no,
        bill_type: billType,
        company_name: row.company_name,
        company_code: row.company_code,
        party_name: row.party_name,
        party_type: row.party_type,
        firm_name: row.firm_name,
        total_amount: row.total_amount,
        paid_amount: row.total_paid || 0,
        left_amount: row.left_amount || row.total_amount,
        created_at: row.created_at,
        bill_date: row.bill_date,
        transport_amount: row.transport_amount || 0,
        total_gst_amount: row.total_gst_amount || 0,
        total_discount_amount: row.total_discount_amount || 0,
        taxable_amount: row.taxable_amount || 0,
        status: calculateStatus(
          row.total_amount,
          row.total_paid || 0,
          row.left_amount
        ),
        items: [],
        items_count: 0,
        payments_count: row.payments_count || 0, // Add payments count
      };
    }

    // Only add item if product exists
    if (row.product_id && row.product_name) {
      grouped[billId].items.push({
        product_name: row.product_name,
        product_code: row.product_hsn_code,
        quantity: row.item_quantity,
        rate: row.item_rate,
        total: row.item_total,
        unit: row.item_unit,
        discount_percent: row.item_discount_percent,
        discount_amount: row.item_discount_amount,
        gst_percent: row.item_gst_percent,
        gst_amount: row.item_gst_amount,
      });
      grouped[billId].items_count++;
    }
  });

  return Object.values(grouped);
}

// Helper function to execute query with promise wrapper
const executeQuery = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        console.error("Query execution error:", error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// Helper function to execute transaction query
const executeTransactionQuery = async (connection, sql, params = []) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (error, results) => {
      if (error) {
        console.error("Transaction query error:", error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

const billController = {
  // Get all bills
  getAllBill: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        billType,
        companyId,
        partyType,
        firmId,
        fromDate,
        toDate,
      } = req.query;

      const offset = (page - 1) * limit;

      // Build dynamic WHERE clauses
      let salesWhere = "WHERE 1=1";
      let purchasesWhere = "WHERE 1=1";
      const purchaseParams = [];
      const salesParams = [];

      if (billType === "sales") {
        purchasesWhere += " AND 1=0";
      } else if (billType === "purchases") {
        salesWhere += " AND 1=0";
      }

      if (companyId) {
        salesWhere += " AND s.company_id = ?";
        salesParams.push(companyId);
        purchasesWhere += " AND p.company_id = ?";
        purchaseParams.push(companyId);
      }

      if (partyType) {
        salesWhere += " AND s.party_type = ?";
        salesParams.push(partyType);
        purchasesWhere += " AND p.party_type = ?";
        purchaseParams.push(partyType);
      }

      if (firmId) {
        salesWhere +=
          " AND (s.vendor_id = ? OR s.farmer_id = ? OR s.customer_id = ?)";
        salesParams.push(firmId, firmId, firmId);

        purchasesWhere += " AND (p.vendor_id = ? OR p.farmer_id = ?)";
        purchaseParams.push(firmId, firmId);
      }

      if (fromDate) {
        salesWhere += " AND DATE(s.created_at) >= ?";
        salesParams.push(fromDate);
        purchasesWhere += " AND DATE(p.created_at) >= ?";
        purchaseParams.push(fromDate);
      }

      if (toDate) {
        salesWhere += " AND DATE(s.created_at) <= ?";
        salesParams.push(toDate);
        purchasesWhere += " AND DATE(p.created_at) <= ?";
        purchaseParams.push(toDate);
      }

      // Sales query - Updated to include payments count
      const salesSql = `
        SELECT
          s.id as sale_id,
          s.bill_no as invoice_no,
          s.total_amount,
          s.total_discount_amount,
          s.total_gst as total_gst_amount,
          s.party_type,
          s.created_at,
          s.bill_date,
          s.company_id,
          s.other_amount as transport_amount,
          s.total_taxable,
          si.product_id,
          si.qty as item_quantity,
          si.rate as item_rate,
          si.net_total as item_total,
          si.discount_rate as item_discount_percent,
          si.discount_amount as item_discount_amount,
          si.gst_percent as item_gst_percent,
          si.gst_amount as item_gst_amount,
          si.unit as item_unit,
          pr.product_name,
          pr.hsn_code as product_hsn_code,
          c.code as company_code,
          c.name as company_name,
          CASE
            WHEN s.party_type = 'vendor' THEN v.vendor_name
            WHEN s.party_type = 'farmer' THEN f.name
            WHEN s.party_type = 'customer' THEN cus.name
          END as party_name,
          CASE
            WHEN s.party_type = 'vendor' THEN v.firm_name
            WHEN s.party_type = 'farmer' THEN f.name
            WHEN s.party_type = 'customer' THEN cus.firm_name
          END as firm_name,
          COALESCE(SUM(sp.amount), 0) as total_paid,
          (s.total_amount - COALESCE(SUM(sp.amount), 0)) as left_amount,
          COUNT(DISTINCT sp.id) as payments_count,
          'sale' as bill_type
        FROM sales s
        LEFT JOIN sale_items si ON si.sale_id = s.id
        LEFT JOIN products pr ON pr.id = si.product_id
        LEFT JOIN companies c ON c.id = s.company_id
        LEFT JOIN farmers f ON f.id = s.farmer_id
        LEFT JOIN customers cus ON cus.id = s.customer_id
        LEFT JOIN vendors v ON v.id = s.vendor_id
        LEFT JOIN sale_payments sp ON sp.sale_id = s.id
        ${salesWhere}
        GROUP BY s.id, si.id
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const salesParamsFinal = [...salesParams, parseInt(limit), offset];

      // Purchases query - Updated to include payments count
      const purchasesSql = `
        SELECT
          p.id as purchase_id,
          p.bill_no as invoice_no,
          p.total_amount,
          p.paid_amount,
          p.discount_amount as total_discount_amount,
          p.gst_amount as total_gst_amount,
          p.party_type,
          p.created_at,
          p.bill_date,
          p.company_id,
          p.transport as transport_amount,
          p.taxable_amount,
          pi.product_id,
          pi.quantity_in_kg as item_quantity,
          pi.rate as item_rate,
          pi.final_amount as item_total,
          pi.discount_percent as item_discount_percent,
          pi.discount_amount as item_discount_amount,
          pi.gst_percent as item_gst_percent,
          pi.gst_amount as item_gst_amount,
          pi.unit as item_unit,
          pr.product_name,
          pr.hsn_code as product_hsn_code,
          c.code as company_code,
          c.name as company_name,
          CASE
            WHEN p.party_type = 'vendor' THEN v.vendor_name
            WHEN p.party_type = 'farmer' THEN f.name
          END as party_name,
          CASE
            WHEN p.party_type = 'vendor' THEN v.firm_name
            WHEN p.party_type = 'farmer' THEN f.name
          END as firm_name,
          COALESCE(SUM(pp.amount), 0) as total_paid,
          (p.total_amount - COALESCE(SUM(pp.amount), 0)) as left_amount,
          COUNT(DISTINCT pp.id) as payments_count,
          'purchase' as bill_type
        FROM purchases p
        LEFT JOIN purchase_items pi ON pi.purchase_id = p.id
        LEFT JOIN products pr ON pr.id = pi.product_id
        LEFT JOIN companies c ON c.id = p.company_id
        LEFT JOIN farmers f ON f.id = p.farmer_id
        LEFT JOIN vendors v ON v.id = p.vendor_id
        LEFT JOIN purchase_payments pp ON pp.purchases_id = p.id
        ${purchasesWhere}
        GROUP BY p.id, pi.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const purchasesParamsFinal = [...purchaseParams, parseInt(limit), offset];

      // Get counts for pagination
      const salesCountSql = `
        SELECT COUNT(DISTINCT s.id) as total
        FROM sales s
        ${salesWhere.split("GROUP BY")[0]}
      `;

      const purchasesCountSql = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM purchases p
        ${purchasesWhere.split("GROUP BY")[0]}
      `;

      // Execute queries in parallel for better performance
      const [
        salesCountResult,
        purchasesCountResult,
        salesResult,
        purchasesResult,
      ] = await Promise.all([
        executeQuery(salesCountSql, salesParams),
        executeQuery(purchasesCountSql, purchaseParams),
        executeQuery(salesSql, salesParamsFinal),
        executeQuery(purchasesSql, purchasesParamsFinal),
      ]);

      const totalSales = salesCountResult[0]?.total || 0;
      const totalPurchases = purchasesCountResult[0]?.total || 0;
      const totalRecords = totalSales + totalPurchases;
      const totalPages = Math.ceil(totalRecords / limit);

      // Group items by bill
      const salesGrouped = groupItemsByBill(salesResult, "sale");
      const purchasesGrouped = groupItemsByBill(purchasesResult, "purchase");

      const allBills = [...salesGrouped, ...purchasesGrouped];

      res.status(200).json({
        message: "Successfully fetched bills",
        success: true,
        data: allBills,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalRecords: totalRecords,
          limit: parseInt(limit),
          totalSales: totalSales,
          totalPurchases: totalPurchases,
        },
      });
    } catch (error) {
      console.error("Get all bills error:", error);
      res.status(500).json({
        message: "Server error",
        success: false,
        error: error.message,
      });
    }
  },

  // Get bill details
  getBillDetails: async (req, res) => {
    try {
      const { billId, billType } = req.params;

      if (billType === "sale") {
        // Get sale details
        const saleSql = `
          SELECT
            s.*,
            c.code as company_code,
            c.name as company_name,
            s.other_amount as transport_amount,
            s.total_gst as total_gst_amount,
            s.total_discount_amount,
            s.total_taxable,
            CASE
              WHEN s.party_type = 'vendor' THEN v.firm_name
              WHEN s.party_type = 'farmer' THEN f.name
              WHEN s.party_type = 'customer' THEN cus.firm_name
              ELSE NULL
            END as firm_name,
            CASE
              WHEN s.party_type = 'vendor' THEN v.vendor_name
              WHEN s.party_type = 'farmer' THEN f.name
              WHEN s.party_type = 'customer' THEN cus.name
              ELSE NULL
            END as party_name,
            COALESCE(SUM(sp.amount), 0) as total_paid,
            (s.total_amount - COALESCE(SUM(sp.amount), 0)) as left_amount
          FROM sales s
          LEFT JOIN companies c ON c.id = s.company_id
          LEFT JOIN farmers f ON f.id = s.farmer_id
          LEFT JOIN customers cus ON cus.id = s.customer_id
          LEFT JOIN vendors v ON v.id = s.vendor_id
          LEFT JOIN sale_payments sp ON sp.sale_id = s.id
          WHERE s.id = ?
          GROUP BY s.id
        `;

        // Get sale items with all details
        const itemsSql = `
          SELECT
            si.*,
            pr.product_name,
            pr.hsn_code,
            si.net_total as total,
            si.discount_rate as discount_percent
          FROM sale_items si
          LEFT JOIN products pr ON pr.id = si.product_id
          WHERE si.sale_id = ?
        `;

        const paymentsSql = `
          SELECT
            id,
            amount,
            remarks as remark,
            method,
            created_at
          FROM sale_payments
          WHERE sale_id = ?
          ORDER BY created_at DESC
        `;

        const [saleResult, itemsResult, paymentsResult] = await Promise.all([
          executeQuery(saleSql, [billId]),
          executeQuery(itemsSql, [billId]),
          executeQuery(paymentsSql, [billId]),
        ]);

        if (saleResult.length === 0) {
          return res.status(404).json({
            message: "Sale not found",
            success: false,
          });
        }

        const sale = saleResult[0];
        sale.items = itemsResult.map((item) => ({
          product_name: item.product_name,
          product_code: item.hsn_code,
          quantity: item.qty,
          rate: item.rate,
          net_total: item.net_total || item.total,
          unit: item.unit,
          discount_percent: item.discount_percent,
          discount_amount: item.discount_amount,
          gst_percent: item.gst_percent,
          gst_amount: item.gst_amount,
          taxable_amount: item.taxable_amount,
        }));

        sale.payments = paymentsResult;

        res.status(200).json({
          message: "Successfully fetched sale details",
          success: true,
          data: sale,
        });
      } else if (billType === "purchase") {
        // Get purchase details
        const purchaseSql = `
          SELECT
            p.*,
            c.code as company_code,
            c.name as company_name,
            p.transport as transport_amount,
            p.gst_amount as total_gst_amount,
            p.discount_amount as total_discount_amount,
            p.taxable_amount,
            CASE
              WHEN p.party_type = 'vendor' THEN v.firm_name
              WHEN p.party_type = 'farmer' THEN f.name
              ELSE NULL
            END as firm_name,
            CASE
              WHEN p.party_type = 'vendor' THEN v.vendor_name
              WHEN p.party_type = 'farmer' THEN f.name
              ELSE NULL
            END as party_name,
            COALESCE(SUM(pp.amount), 0) as total_paid,
            (p.total_amount - COALESCE(SUM(pp.amount), 0)) as left_amount
          FROM purchases p
          LEFT JOIN companies c ON c.id = p.company_id
          LEFT JOIN farmers f ON f.id = p.farmer_id
          LEFT JOIN vendors v ON v.id = p.vendor_id
          LEFT JOIN purchase_payments pp ON pp.purchases_id = p.id
          WHERE p.id = ?
          GROUP BY p.id
        `;

        // Get purchase items with all details
        const itemsSql = `
          SELECT
            pi.*,
            pr.product_name,
            pr.hsn_code
          FROM purchase_items pi
          LEFT JOIN products pr ON pr.id = pi.product_id
          WHERE pi.purchase_id = ?
        `;

        const paymentsSql = `
          SELECT
            id,
            amount,
            remarks as remark,
            method,
            created_at
          FROM purchase_payments
          WHERE purchases_id = ?
          ORDER BY created_at DESC
        `;

        const [purchaseResult, itemsResult, paymentsResult] = await Promise.all(
          [
            executeQuery(purchaseSql, [billId]),
            executeQuery(itemsSql, [billId]),
            executeQuery(paymentsSql, [billId]),
          ]
        );

        if (purchaseResult.length === 0) {
          return res.status(404).json({
            message: "Purchase not found",
            success: false,
          });
        }

        const purchase = purchaseResult[0];
        purchase.items = itemsResult.map((item) => ({
          product_name: item.product_name,
          product_code: item.hsn_code,
          quantity: item.quantity_in_kg,
          rate: item.rate,
          total: item.final_amount || item.total,
          unit: item.unit,
          discount_percent: item.discount_percent,
          discount_amount: item.discount_amount,
          gst_percent: item.gst_percent,
          gst_amount: item.gst_amount,
          taxable_amount: item.taxable_amount,
          amount_after_discount: item.amount_after_discount,
          base_amount: item.base_amount,
        }));

        purchase.payments = paymentsResult;

        res.status(200).json({
          message: "Successfully fetched purchase details",
          success: true,
          data: purchase,
        });
      } else {
        res.status(400).json({
          message: "Invalid bill type",
          success: false,
        });
      }
    } catch (error) {
      console.error("Get bill details error:", error);
      res.status(500).json({
        message: "Server error",
        success: false,
        error: error.message,
      });
    }
  },

  // Create payment (POST) - Fixed version
  createPayment: async (req, res) => {
    let transactionConnection;
    try {
      const {
        billId,
        billType,
        amount,
        remark,
        payment_method = "Cash",
      } = req.body;

      if (!billId || !billType || !amount) {
        return res.status(400).json({
          message: "Bill ID, bill type and amount are required",
          success: false,
        });
      }

      // Get bill details to find company code
      let billDetails;
      if (billType === "sale") {
        const result = await executeQuery(
          `SELECT s.*, c.code as company_code FROM sales s
           LEFT JOIN companies c ON c.id = s.company_id WHERE s.id = ?`,
          [billId]
        );
        if (result.length === 0) {
          return res.status(404).json({
            message: "Sale not found",
            success: false,
          });
        }
        billDetails = result[0];
      } else if (billType === "purchase") {
        const result = await executeQuery(
          `SELECT p.*, c.code as company_code FROM purchases p
           LEFT JOIN companies c ON c.id = p.company_id WHERE p.id = ?`,
          [billId]
        );
        if (result.length === 0) {
          return res.status(404).json({
            message: "Purchase not found",
            success: false,
          });
        }
        billDetails = result[0];
      } else {
        return res.status(400).json({
          message: "Invalid bill type",
          success: false,
        });
      }

      const companyCode = billDetails.company_code;
      if (!companyCode) {
        return res.status(400).json({
          message: "Company code not found for this bill",
          success: false,
        });
      }

      // Get left amount from master table
      let leftAmount = 0;
      let totalAmount = 0;
      let paidAmount = 0;

      if (billType === "sale") {
        const saleResult = await executeQuery(
          `SELECT total_amount, COALESCE(paid_amount, 0) as paid_amount,
           (total_amount - COALESCE(paid_amount, 0)) as left_amount
           FROM sales WHERE id = ?`,
          [billId]
        );
        leftAmount = saleResult[0].left_amount;
        totalAmount = saleResult[0].total_amount;
        paidAmount = saleResult[0].paid_amount;
      } else {
        const purchaseResult = await executeQuery(
          `SELECT total_amount, COALESCE(paid_amount, 0) as paid_amount,
           (total_amount - COALESCE(paid_amount, 0)) as left_amount
           FROM purchases WHERE id = ?`,
          [billId]
        );
        leftAmount = purchaseResult[0].left_amount;
        totalAmount = purchaseResult[0].total_amount;
        paidAmount = purchaseResult[0].paid_amount;
      }

      // Validate amount
      if (parseFloat(amount) > leftAmount) {
        return res.status(400).json({
          message: `Amount cannot exceed left amount (${leftAmount})`,
          success: false,
        });
      }

      // Get table names
      const salesTable = tn(companyCode, "sales");
      const purchasesTable = tn(companyCode, "purchases");
      const salePaymentsTable = tn(companyCode, "sale_payments");
      const purchasePaymentsTable = tn(companyCode, "purchase_payments");

      // Start transaction
      await executeTransactionQuery(db, "START TRANSACTION");
      transactionConnection = db;

      try {
        // 1. Insert payment into MASTER table
        let masterPaymentResult;
        if (billType === "sale") {
          masterPaymentResult = await executeTransactionQuery(
            transactionConnection,
            `INSERT INTO sale_payments
             (sale_id, amount, remarks, party_type, customer_id, vendor_id, farmer_id,
              payment_date, method, company_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
            [
              billId,
              amount,
              remark || "",
              billDetails.party_type,
              billDetails.customer_id || null,
              billDetails.vendor_id || null,
              billDetails.farmer_id || null,
              payment_method,
              billDetails.company_id,
            ]
          );
        } else {
          masterPaymentResult = await executeTransactionQuery(
            transactionConnection,
            `INSERT INTO purchase_payments
             (purchases_id, amount, remarks, party_type, vendor_id, farmer_id,
              payment_date, method, company_id)
             VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
            [
              billId,
              amount,
              remark || "",
              billDetails.party_type,
              billDetails.vendor_id || null,
              billDetails.farmer_id || null,
              payment_method,
              billDetails.company_id,
            ]
          );
        }

        const masterPaymentId = masterPaymentResult.insertId;

        // 2. Insert payment into COMPANY-SPECIFIC table
        let companyPaymentResult;
        if (billType === "sale") {
          // First ensure company table exists
          await executeTransactionQuery(
            transactionConnection,
            `
            CREATE TABLE IF NOT EXISTS \`${salePaymentsTable}\` (
              id INT AUTO_INCREMENT PRIMARY KEY,
              sale_id INT NOT NULL,
              amount DECIMAL(15,2) NOT NULL,
              remarks TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              party_type ENUM('customer','vendor','farmer'),
              customer_id INT,
              vendor_id INT,
              farmer_id INT,
              payment_date DATE,
              method VARCHAR(50) DEFAULT 'Cash',
              status ENUM('Active','Inactive') DEFAULT 'Active',
              company_id INT,
              reference_id INT
            )
          `
          );

          // Get company sale ID (try to find by reference_id or use master sale_id)
          const companySale = await executeTransactionQuery(
            transactionConnection,
            `SELECT id FROM \`${salesTable}\` WHERE reference_id = ? OR id = ? LIMIT 1`,
            [billId, billId]
          );

          const companySaleId =
            companySale.length > 0 ? companySale[0].id : billId;

          companyPaymentResult = await executeTransactionQuery(
            transactionConnection,
            `INSERT INTO \`${salePaymentsTable}\`
             (sale_id, amount, remarks, party_type, customer_id, vendor_id, farmer_id,
              payment_date, method, company_id, reference_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?)`,
            [
              companySaleId,
              amount,
              remark || "",
              billDetails.party_type,
              billDetails.customer_id || null,
              billDetails.vendor_id || null,
              billDetails.farmer_id || null,
              payment_method,
              billDetails.company_id,
              masterPaymentId,
            ]
          );
        } else {
          // First ensure company table exists
          await executeTransactionQuery(
            transactionConnection,
            `
            CREATE TABLE IF NOT EXISTS \`${purchasePaymentsTable}\` (
              id INT AUTO_INCREMENT PRIMARY KEY,
              purchases_id INT NOT NULL,
              amount DECIMAL(15,2) NOT NULL,
              remarks TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              party_type ENUM('vendor','farmer'),
              vendor_id INT,
              farmer_id INT,
              payment_date DATE,
              method VARCHAR(50) DEFAULT 'Cash',
              status ENUM('Active','Inactive') DEFAULT 'Active',
              company_id INT,
              reference_id INT
            )
          `
          );

          // Get company purchase ID
          const companyPurchase = await executeTransactionQuery(
            transactionConnection,
            `SELECT id FROM \`${purchasesTable}\` WHERE reference_id = ? OR id = ? LIMIT 1`,
            [billId, billId]
          );

          const companyPurchaseId =
            companyPurchase.length > 0 ? companyPurchase[0].id : billId;

          companyPaymentResult = await executeTransactionQuery(
            transactionConnection,
            `INSERT INTO \`${purchasePaymentsTable}\`
             (purchases_id, amount, remarks, party_type, vendor_id, farmer_id,
              payment_date, method, company_id, reference_id)
             VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?)`,
            [
              companyPurchaseId,
              amount,
              remark || "",
              billDetails.party_type,
              billDetails.vendor_id || null,
              billDetails.farmer_id || null,
              payment_method,
              billDetails.company_id,
              masterPaymentId,
            ]
          );
        }

        const companyPaymentId = companyPaymentResult.insertId;

        // 3. Update master payment with company payment reference
        if (billType === "sale") {
          await executeTransactionQuery(
            transactionConnection,
            `UPDATE sale_payments SET reference_id = ? WHERE id = ?`,
            [companyPaymentId, masterPaymentId]
          );
        } else {
          await executeTransactionQuery(
            transactionConnection,
            `UPDATE purchase_payments SET reference_id = ? WHERE id = ?`,
            [companyPaymentId, masterPaymentId]
          );
        }

        // 4. Update paid_amount in MASTER table
        const newPaidAmount = parseFloat(paidAmount) + parseFloat(amount);
        const newLeftAmount = totalAmount - newPaidAmount;
        const paymentStatus =
          newLeftAmount <= 0
            ? "Paid"
            : newPaidAmount > 0
              ? "Partial"
              : "Unpaid";

        if (billType === "sale") {
          await executeTransactionQuery(
            transactionConnection,
            `UPDATE sales SET paid_amount = ?, payment_status = ? WHERE id = ?`,
            [newPaidAmount, paymentStatus, billId]
          );
        } else {
          await executeTransactionQuery(
            transactionConnection,
            `UPDATE purchases SET paid_amount = ?, payment_status = ? WHERE id = ?`,
            [newPaidAmount, paymentStatus, billId]
          );
        }

        // 5. Update paid_amount in COMPANY table (if exists)
        try {
          if (billType === "sale") {
            await executeTransactionQuery(
              transactionConnection,
              `UPDATE \`${salesTable}\` SET paid_amount = ?, payment_status = ?
               WHERE reference_id = ? OR id = ?`,
              [newPaidAmount, paymentStatus, billId, billId]
            );
          } else {
            await executeTransactionQuery(
              transactionConnection,
              `UPDATE \`${purchasesTable}\` SET paid_amount = ?, payment_status = ?
               WHERE reference_id = ? OR id = ?`,
              [newPaidAmount, paymentStatus, billId, billId]
            );
          }
        } catch (err) {
          console.error(
            "Company table update skipped (table may not exist):",
            err.message
          );
        }

        await executeTransactionQuery(transactionConnection, "COMMIT");

        res.status(200).json({
          message: "Payment created successfully",
          success: true,
          data: {
            masterPaymentId,
            companyPaymentId,
            leftAmount: newLeftAmount,
            paymentStatus,
            companyCode,
          },
        });
      } catch (error) {
        await executeTransactionQuery(transactionConnection, "ROLLBACK");
        console.error("Create payment transaction error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Create payment error:", error);
      res.status(500).json({
        message: "Server error",
        success: false,
        error: error.message,
      });
    }
  },

  // Update payment (PUT) - FIXED VERSION
  updatePayment: async (req, res) => {
    let transactionConnection;
    try {
      const { paymentId } = req.params;
      const { amount, remark, payment_method } = req.body;

      if (!paymentId || !amount) {
        return res.status(400).json({
          message: "Payment ID and amount are required",
          success: false,
        });
      }

      // First check if payment exists in sale_payments
      const salePayment = await executeQuery(
        `SELECT sp.*, s.*, c.code as company_code 
         FROM sale_payments sp
         JOIN sales s ON sp.sale_id = s.id
         LEFT JOIN companies c ON c.id = s.company_id
         WHERE sp.id = ?`,
        [paymentId]
      );

      // If not found in sale_payments, check purchase_payments
      const purchasePayment =
        salePayment.length === 0
          ? await executeQuery(
            `SELECT pp.*, p.*, c.code as company_code 
         FROM purchase_payments pp
         JOIN purchases p ON pp.purchases_id = p.id
         LEFT JOIN companies c ON c.id = p.company_id
         WHERE pp.id = ?`,
            [paymentId]
          )
          : [];

      if (salePayment.length === 0 && purchasePayment.length === 0) {
        return res.status(404).json({
          message: "Payment not found",
          success: false,
        });
      }

      const payment =
        salePayment.length > 0 ? salePayment[0] : purchasePayment[0];
      const isSale = salePayment.length > 0;
      const billId = isSale ? payment.sale_id : payment.purchases_id;
      const billType = isSale ? "sale" : "purchase";
      const companyCode = payment.company_code;
      const oldAmount = parseFloat(payment.amount);

      if (!companyCode) {
        return res.status(400).json({
          message: "Company code not found for this payment",
          success: false,
        });
      }

      const amountDiff = parseFloat(amount) - oldAmount;

      // Get current bill status
      const billTable = isSale ? "sales" : "purchases";
      const billDetails = await executeQuery(
        `SELECT total_amount, COALESCE(paid_amount, 0) as paid_amount
         FROM ${billTable} WHERE id = ?`,
        [billId]
      );

      if (billDetails.length === 0) {
        return res.status(404).json({
          message: "Bill not found",
          success: false,
        });
      }

      const totalAmount = parseFloat(billDetails[0].total_amount);
      const currentPaidAmount = parseFloat(billDetails[0].paid_amount || 0);
      const newPaidAmount = currentPaidAmount + amountDiff;

      if (newPaidAmount < 0 || newPaidAmount > totalAmount) {
        return res.status(400).json({
          message: `Invalid payment amount. New paid amount (${newPaidAmount}) must be between 0 and total amount (${totalAmount})`,
          success: false,
        });
      }

      // Get table names
      const salesTable = tn(companyCode, "sales");
      const purchasesTable = tn(companyCode, "purchases");
      const salePaymentsTable = tn(companyCode, "sale_payments");
      const purchasePaymentsTable = tn(companyCode, "purchase_payments");

      // Start transaction
      await executeTransactionQuery(db, "START TRANSACTION");
      transactionConnection = db;

      try {
        // 1. Update MASTER payment
        const masterTable = isSale ? "sale_payments" : "purchase_payments";
        await executeTransactionQuery(
          transactionConnection,
          `UPDATE ${masterTable} SET amount = ?, remarks = ?, method = ? WHERE id = ?`,
          [
            amount,
            remark || payment.remarks,
            payment_method || payment.method || "Cash",
            paymentId,
          ]
        );

        // 2. Update COMPANY payment (if exists)
        const companyPaymentsTable = isSale
          ? salePaymentsTable
          : purchasePaymentsTable;

        // First check if company payment exists
        const companyPaymentCheck = await executeTransactionQuery(
          transactionConnection,
          `SELECT id FROM \`${companyPaymentsTable}\` WHERE reference_id = ?`,
          [paymentId]
        );

        if (companyPaymentCheck.length > 0) {
          await executeTransactionQuery(
            transactionConnection,
            `UPDATE \`${companyPaymentsTable}\` 
             SET amount = ?, remarks = ?, method = ?
             WHERE reference_id = ?`,
            [
              amount,
              remark || payment.remarks,
              payment_method || payment.method || "Cash",
              paymentId,
            ]
          );
        }

        // 3. Update MASTER bill paid amount
        const newLeftAmount = totalAmount - newPaidAmount;
        const paymentStatus =
          newLeftAmount <= 0
            ? "Paid"
            : newPaidAmount > 0
              ? "Partial"
              : "Unpaid";

        await executeTransactionQuery(
          transactionConnection,
          `UPDATE ${billTable} SET paid_amount = ?, payment_status = ? WHERE id = ?`,
          [newPaidAmount, paymentStatus, billId]
        );

        // 4. Update COMPANY bill paid amount (if exists)
        const companyBillTable = isSale ? salesTable : purchasesTable;
        try {
          // Find company bill by reference_id
          const companyBill = await executeTransactionQuery(
            transactionConnection,
            `SELECT id FROM \`${companyBillTable}\` WHERE reference_id = ? LIMIT 1`,
            [billId]
          );

          if (companyBill.length > 0) {
            await executeTransactionQuery(
              transactionConnection,
              `UPDATE \`${companyBillTable}\` 
               SET paid_amount = ?, payment_status = ?
               WHERE reference_id = ?`,
              [newPaidAmount, paymentStatus, billId]
            );
          }
        } catch (err) {
          console.error("Company bill table update skipped:", err.message);
        }

        await executeTransactionQuery(transactionConnection, "COMMIT");

        res.status(200).json({
          message: "Payment updated successfully",
          success: true,
          data: {
            paymentId,
            oldAmount,
            newAmount: amount,
            amountDifference: amountDiff,
            leftAmount: newLeftAmount,
            paymentStatus,
            companyCode,
          },
        });
      } catch (error) {
        await executeTransactionQuery(transactionConnection, "ROLLBACK");
        console.error("Update payment transaction error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Update payment error:", error);
      res.status(500).json({
        message: "Server error",
        success: false,
        error: error.message,
      });
    }
  },

  // Delete payment
  deletePayment: async (req, res) => {
    let transactionConnection;
    try {
      const { paymentId, billType } = req.params;

      if (!paymentId || !billType) {
        return res.status(400).json({
          message: "Payment ID and bill type are required",
          success: false,
        });
      }

      let payment;
      let billId;
      let companyCode;

      if (billType === "sale") {
        const paymentResult = await executeQuery(
          `SELECT sp.*, s.company_id, c.code as company_code 
           FROM sale_payments sp
           JOIN sales s ON sp.sale_id = s.id
           LEFT JOIN companies c ON c.id = s.company_id
           WHERE sp.id = ?`,
          [paymentId]
        );

        if (paymentResult.length === 0) {
          return res.status(404).json({
            message: "Sale payment not found",
            success: false,
          });
        }

        payment = paymentResult[0];
        billId = payment.sale_id;
        companyCode = payment.company_code;
      } else {
        const paymentResult = await executeQuery(
          `SELECT pp.*, p.company_id, c.code as company_code 
           FROM purchase_payments pp
           JOIN purchases p ON pp.purchases_id = p.id
           LEFT JOIN companies c ON c.id = p.company_id
           WHERE pp.id = ?`,
          [paymentId]
        );

        if (paymentResult.length === 0) {
          return res.status(404).json({
            message: "Purchase payment not found",
            success: false,
          });
        }

        payment = paymentResult[0];
        billId = payment.purchases_id;
        companyCode = payment.company_code;
      }

      const paymentAmount = parseFloat(payment.amount);
      const referenceId = payment.reference_id;

      // Get current bill status
      const billTable = billType === "sale" ? "sales" : "purchases";
      const billDetails = await executeQuery(
        `SELECT total_amount, COALESCE(paid_amount, 0) as paid_amount 
         FROM ${billTable} WHERE id = ?`,
        [billId]
      );

      if (billDetails.length === 0) {
        return res.status(404).json({
          message: "Bill not found",
          success: false,
        });
      }

      const totalAmount = parseFloat(billDetails[0].total_amount);
      const currentPaidAmount = parseFloat(billDetails[0].paid_amount || 0);
      const newPaidAmount = Math.max(0, currentPaidAmount - paymentAmount);

      // Get table names
      const companyPaymentsTable = tn(
        companyCode,
        billType === "sale" ? "sale_payments" : "purchase_payments"
      );
      const companyBillTable = tn(
        companyCode,
        billType === "sale" ? "sales" : "purchases"
      );

      // Start transaction
      await executeTransactionQuery(db, "START TRANSACTION");
      transactionConnection = db;

      try {
        // 1. Delete MASTER payment
        const masterTable =
          billType === "sale" ? "sale_payments" : "purchase_payments";
        await executeTransactionQuery(
          transactionConnection,
          `DELETE FROM ${masterTable} WHERE id = ?`,
          [paymentId]
        );

        // 2. Delete COMPANY payment (if exists)
        try {
          if (referenceId) {
            await executeTransactionQuery(
              transactionConnection,
              `DELETE FROM \`${companyPaymentsTable}\` WHERE id = ?`,
              [referenceId]
            );
          }
        } catch (err) {
          console.error("Company payment deletion skipped:", err.message);
        }

        // 3. Update MASTER bill paid amount
        const newLeftAmount = totalAmount - newPaidAmount;
        const paymentStatus =
          newLeftAmount <= 0
            ? "Paid"
            : newPaidAmount > 0
              ? "Partial"
              : "Unpaid";

        await executeTransactionQuery(
          transactionConnection,
          `UPDATE ${billTable} SET paid_amount = ?, payment_status = ? WHERE id = ?`,
          [newPaidAmount, paymentStatus, billId]
        );

        // 4. Update COMPANY bill paid amount (if exists)
        try {
          // Find company bill by reference_id
          const companyBill = await executeTransactionQuery(
            transactionConnection,
            `SELECT id FROM \`${companyBillTable}\` WHERE reference_id = ? LIMIT 1`,
            [billId]
          );

          if (companyBill.length > 0) {
            await executeTransactionQuery(
              transactionConnection,
              `UPDATE \`${companyBillTable}\` 
               SET paid_amount = ?, payment_status = ?
               WHERE reference_id = ?`,
              [newPaidAmount, paymentStatus, billId]
            );
          }
        } catch (err) {
          console.error("Company bill table update skipped:", err.message);
        }

        await executeTransactionQuery(transactionConnection, "COMMIT");

        res.status(200).json({
          message: "Payment deleted successfully",
          success: true,
          data: {
            paymentId,
            deletedAmount: paymentAmount,
            leftAmount: newLeftAmount,
            paymentStatus,
            companyCode,
          },
        });
      } catch (error) {
        await executeTransactionQuery(transactionConnection, "ROLLBACK");
        console.error("Delete payment transaction error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Delete payment error:", error);
      res.status(500).json({
        message: "Server error",
        success: false,
        error: error.message,
      });
    }
  },

  // Get payment by ID
  getPaymentById: async (req, res) => {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({
          message: "Payment ID is required",
          success: false,
        });
      }

      const results = await executeQuery(
        `SELECT sp.*, 'sale' as bill_type, s.bill_no, s.company_id,
                c.code as company_code, c.name as company_name,
                CASE
                  WHEN s.party_type = 'vendor' THEN v.vendor_name
                  WHEN s.party_type = 'farmer' THEN f.name
                  WHEN s.party_type = 'customer' THEN cus.name
                END as party_name
         FROM sale_payments sp
         JOIN sales s ON sp.sale_id = s.id
         LEFT JOIN companies c ON c.id = s.company_id
         LEFT JOIN vendors v ON v.id = s.vendor_id
         LEFT JOIN farmers f ON f.id = s.farmer_id
         LEFT JOIN customers cus ON cus.id = s.customer_id
         WHERE sp.id = ?
         UNION ALL
         SELECT pp.*, 'purchase' as bill_type, p.bill_no, p.company_id,
                c.code as company_code, c.name as company_name,
                CASE
                  WHEN p.party_type = 'vendor' THEN v.vendor_name
                  WHEN p.party_type = 'farmer' THEN f.name
                END as party_name
         FROM purchase_payments pp
         JOIN purchases p ON pp.purchases_id = p.id
         LEFT JOIN companies c ON c.id = p.company_id
         LEFT JOIN vendors v ON v.id = p.vendor_id
         LEFT JOIN farmers f ON f.id = p.farmer_id
         WHERE pp.id = ?`,
        [paymentId, paymentId]
      );

      if (results.length === 0) {
        return res.status(404).json({
          message: "Payment not found",
          success: false,
        });
      }

      const payment = results[0];

      // Get corresponding company payment if needed
      let companyPayment = null;
      try {
        const companyPaymentsTable = tn(
          payment.company_code,
          payment.bill_type === "sale" ? "sale_payments" : "purchase_payments"
        );
        const companyResults = await executeQuery(
          `SELECT * FROM \`${companyPaymentsTable}\` WHERE reference_id = ?`,
          [paymentId]
        );
        companyPayment = companyResults[0] || null;
      } catch (err) {
        console.error("Company payment not found:", err.message);
      }

      payment.company_payment = companyPayment;

      res.status(200).json({
        message: "Successfully fetched payment",
        success: true,
        data: payment,
      });
    } catch (error) {
      console.error("Get payment by ID error:", error);
      res.status(500).json({
        message: "Server error",
        success: false,
        error: error.message,
      });
    }
  },
};

module.exports = billController;
