const { data } = require("autoprefixer");
const db = require("../config/db");

// Helper function to execute queries with promises
const executeQuery = async (sql, params = [], data = null) => {
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

// Helper function to format currency
const formatCurrency = (amount) => {
  return parseFloat(amount || 0);
};

// Helper function to get previous month
const getPreviousMonth = (year, month) => {
  let prevYear = parseInt(year);
  let prevMonth = parseInt(month) - 1;

  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = prevYear - 1;
  }

  return {
    year: prevYear.toString(),
    month: prevMonth.toString().padStart(2, "0"),
  };
};

// Helper function to check if month is completed
const isMonthCompleted = (selectedMonth, selectedYear) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  // Month is completed if it's before current month/year
  if (parseInt(selectedYear) < currentYear) {
    return true;
  } else if (
    parseInt(selectedYear) === currentYear &&
    parseInt(selectedMonth) < currentMonth
  ) {
    return true;
  }

  return false;
};

const balanceSheetController = {
  // Get balance sheet data
  getBalanceSheet: async (req, res) => {
    try {
      const { companyId, month, year } = req.query;

      if (!companyId || !month || !year) {
        return res.status(400).json({
          message: "Company ID, month, and year are required",
          success: false,
        });
      }

      // Validate month and year
      const selectedMonthInt = parseInt(month);
      const selectedYearInt = parseInt(year);
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      if (
        selectedYearInt > currentYear ||
        (selectedYearInt === currentYear && selectedMonthInt > currentMonth)
      ) {
        return res.status(400).json({
          message: "Cannot select future month/year",
          success: false,
        });
      }

      // Get previous month for opening balance
      const previousMonthData = getPreviousMonth(year, month);

      const monthCompleted = isMonthCompleted(month, year);

      // Execute all queries in parallel for better performance
      const [
        openingBalance, // Previous month data
        monthlySales, // Current month sales
        monthlyPurchases, // Current month purchases
        monthlyExpenses, // Current month expenses
        outstandingToReceive, // Previous month outstanding to receive
        outstandingToPay, // Previous month outstanding to pay
        closingBalance, // Current month closing balance (if completed)
      ] = await Promise.all([
        // 1. Get opening balance from previous month
        getOpeningBalanceFromPreviousMonth(
          companyId,
          previousMonthData.month,
          previousMonthData.year
        ),

        // 2. Get monthly sales data for selected month
        getMonthlySales(companyId, month, year),

        // 3. Get monthly purchases data for selected month
        getMonthlyPurchases(companyId, month, year),

        // 4. Get monthly expenses data for selected month
        getMonthlyExpenses(companyId, month, year),

        // 5. Get outstanding to receive from previous month
        getOutstandingToReceive(
          companyId,
          previousMonthData.month,
          previousMonthData.year
        ),

        // 6. Get outstanding to pay from previous month
        getOutstandingToPay(
          companyId,
          previousMonthData.month,
          previousMonthData.year
        ),

        // 7. Get closing balance (only if month is completed)
        monthCompleted
          ? getClosingBalance(companyId, month, year)
          : Promise.resolve(null),
      ]);

      // Calculate profit/loss for current month
      const profitLoss = calculateProfitLoss(
        monthlySales,
        monthlyPurchases,
        monthlyExpenses
      );

      // Prepare response
      const response = {
        openingBalance: {
          totalRowData: openingBalance?.openingRowData,
          totalSales: openingBalance.totalSales,
          totalSalesGST: openingBalance.totalSalesGST,
          totalPurchases: openingBalance.totalPurchases,
          totalPurchasesGST: openingBalance.totalPurchasesGST,
          totalExpenses: openingBalance.totalExpenses,
          totalExpensesGST: openingBalance.totalExpensesGST,
          outstandingToReceive: outstandingToReceive,
          outstandingToPay: outstandingToPay,
          period: `${previousMonthData.month}/${previousMonthData.year}`,
        },
        monthlySales: monthlySales,
        monthlyPurchases: monthlyPurchases,
        monthlyExpenses: monthlyExpenses,
        profitLoss: profitLoss,
        closingBalance: monthCompleted ? closingBalance : null,
        summary: {
          selectedPeriod: `${month}/${year}`,
          openingBalancePeriod: `${previousMonthData.month}/${previousMonthData.year}`,
          companyId: companyId,
          isCurrentMonth:
            selectedMonthInt === currentMonth &&
            selectedYearInt === currentYear,
          monthCompleted: monthCompleted,
          closingBalanceAvailable: monthCompleted,
        },
      };

      res.status(200).json({
        message: "Successfully fetched balance sheet data",
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("Get balance sheet error:", error);
      res.status(500).json({
        message: "Server error",
        success: false,
        error: error.message,
      });
    }
  },

  // Get sales bill items
  getSalesBillItems: async (req, res) => {
    try {
      const saleId = req.params?.id;

      const sql = `
        SELECT 
          si.*,
          pr.product_name,
          pr.hsn_code
        FROM sale_items si
        LEFT JOIN products pr ON pr.id = si.product_id
        WHERE si.sale_id = ?
        ORDER BY si.id
      `;

      const items = await executeQuery(sql, [saleId]);

      res.status(200).json({
        message: "Successfully fetched sales bill items",
        success: true,
        data: items,
      });
    } catch (error) {
      console.error("Error getting sales bill items:", error);
      res.status(500).json({
        message: "Server error",
        success: false,
        error: error.message,
      });
    }
  },

  // Get purchases bill items
  getPurchasesBillItems: async (req, res) => {
    try {
      const purchaseId = req.params?.id;
      const sql = `
        SELECT 
          pi.*,
          pr.product_name,
          pr.hsn_code
        FROM purchase_items pi
        LEFT JOIN products pr ON pr.id = pi.product_id
        WHERE pi.purchase_id = ?
        ORDER BY pi.id
      `;

      const items = await executeQuery(sql, [purchaseId]);

      res.status(200).json({
        message: "Successfully fetched purchases bill items",
        success: true,
        data: items,
      });
    } catch (error) {
      console.error("Error getting purchases bill items:", error);
      res.status(500).json({
        message: "Server error",
        success: false,
        error: error.message,
      });
    }
  },
};

// Helper functions
async function getOpeningBalanceFromPreviousMonth(companyId, month, year) {
  try {
    // Get sales for previous month using MONTH() and YEAR() functions

    const salesSql = `
      SELECT 
        s.id,
        s.bill_date,
        s.bill_no,
        s.total_amount,
        s.total_gst,
        s.other_amount as transport_amount,
        s.party_type,
        CASE 
          WHEN s.party_type = 'customer' THEN cus.name
          WHEN s.party_type = 'vendor' THEN v.firm_name
          WHEN s.party_type = 'farmer' THEN f.name
          ELSE 'Unknown'
        END as party_name,
        SUM(s.total_amount) OVER () AS totalSales,
        SUM(s.total_gst) OVER () AS totalSalesGST
      FROM sales s
      LEFT JOIN customers cus ON cus.id = s.customer_id
      LEFT JOIN vendors v ON v.id = s.vendor_id
      LEFT JOIN farmers f ON f.id = s.farmer_id
      WHERE s.company_id = ? 
        AND MONTH(s.bill_date) = ?
        AND YEAR(s.bill_date) = ?
        AND s.status = 'Active'
      ORDER BY s.bill_date DESC
    `;

    // Get purchases for previous month using MONTH() and YEAR() functions

    const purchasesSql = `SELECT 
        p.id,
        p.bill_date,
        p.bill_no,
        p.total_amount,
        p.gst_amount,
        p.transport,
        p.party_type,
        CASE 
          WHEN p.party_type = 'vendor' THEN v.vendor_name
          WHEN p.party_type = 'farmer' THEN f.name
          ELSE 'Unknown'
        END as party_name,
         SUM(p.total_amount) OVER () AS totalPurchases,
         SUM(p.gst_amount) OVER () AS totalPurchasesGST
      FROM purchases p
      LEFT JOIN vendors v ON v.id = p.vendor_id
      LEFT JOIN farmers f ON f.id = p.farmer_id
      WHERE p.company_id = ? 
        AND MONTH(p.bill_date) = ?
        AND YEAR(p.bill_date) = ?
        AND p.status = 'Active'
      ORDER BY p.bill_date DESC`;

    // Get expenses for previous month (regular expenses) using MONTH() and YEAR() functions

    const regularExpensesSql = `
      SELECT 
        expense_date AS bill_date,
        expenses_for,
        expenses_type,
        amount,
        remark,
        incentive,
        master AS bill_no,
        SUM(amount) OVER () AS totalExpenses,
        0 AS totalExpensesGST
      FROM expenses 
      WHERE company_id = ? 
        AND MONTH(expense_date) = ?
        AND YEAR(expense_date) = ?
        AND status = 'Active'
      ORDER BY expense_date DESC
    `;

    const gstExpensesSql = `
 SELECT 
        bill_date,
        'GST Bill' as expenses_for,
        vendor_name as expenses_type,
        total_amount,
        total_gst_amount,
        remark,
        bill_no,
        SUM(total_amount) OVER () AS totalExpenses,
        SUM(total_gst_amount) OVER () AS totalExpensesGST
      FROM expenses_bill 
      WHERE company_id = ? 
        AND MONTH(bill_date) = ?
        AND YEAR(bill_date) = ?
        AND status = 'active'
      ORDER BY bill_date DESC
`;
    const [
      salesResult,
      purchasesResult,
      regularExpensesResult,
      gstExpensesResult,
    ] = await Promise.all([
      executeQuery(salesSql, [companyId, month, year]),
      executeQuery(purchasesSql, [companyId, month, year]),
      executeQuery(regularExpensesSql, [companyId, month, year]),
      executeQuery(gstExpensesSql, [companyId, month, year], "loo"),
    ]);

    // Combine and format results
    const regularExpenses = regularExpensesResult.map((exp) => ({
      ...exp,
      total_gst_amount: 0,
      bill_no: null,
    }));

    const allExpenses = [...regularExpenses, ...gstExpensesResult];

    // Calculate totals
    const totals = allExpenses.reduce(
      (acc, exp) => {
        acc.totalGST += parseFloat(exp.total_gst_amount || 0);
        acc.totalAmount +=
          parseFloat(exp.total_amount || exp.amount || 0) +
          parseFloat(exp.incentive || 0);
        return acc;
      },
      { totalGST: 0, totalAmount: 0 }
    );

    return {
      openingRowData: {
        salesResult,
        purchasesResult,
        regularExpensesResult,
        gstExpensesResult,
        combineExpenses: {
          data: allExpenses,
          totalGST: formatCurrency(totals?.totalGST),
          totalAmount: formatCurrency(totals?.totalAmount),
        },
      },
      totalSales: formatCurrency(salesResult[0]?.totalSales),
      totalSalesGST: formatCurrency(salesResult[0]?.totalSalesGST),
      totalPurchases: formatCurrency(purchasesResult[0]?.totalPurchases),
      totalPurchasesGST: formatCurrency(purchasesResult[0]?.totalPurchasesGST),
      totalExpenses:
        formatCurrency(regularExpensesResult[0]?.totalExpenses) +
        formatCurrency(gstExpensesResult[0]?.totalExpenses),
      totalExpensesGST: formatCurrency(gstExpensesResult[0]?.totalExpensesGST),
    };
  } catch (error) {
    console.error("Error getting opening balance from previous month:", error);
    return {
      totalSales: 0,
      totalSalesGST: 0,
      totalPurchases: 0,
      totalPurchasesGST: 0,
      totalExpenses: 0,
      totalExpensesGST: 0,
    };
  }
}

async function getMonthlySales(companyId, month, year) {
  try {
    const salesSql = `
      SELECT 
        s.id,
        s.bill_date,
        s.bill_no,
        s.total_amount,
        s.total_gst,
        s.other_amount as transport_amount,
        s.party_type,
        CASE 
          WHEN s.party_type = 'customer' THEN cus.name
          WHEN s.party_type = 'vendor' THEN v.firm_name
          WHEN s.party_type = 'farmer' THEN f.name
          ELSE 'Unknown'
        END as party_name
      FROM sales s
      LEFT JOIN customers cus ON cus.id = s.customer_id
      LEFT JOIN vendors v ON v.id = s.vendor_id
      LEFT JOIN farmers f ON f.id = s.farmer_id
      WHERE s.company_id = ? 
        AND MONTH(s.bill_date) = ?
        AND YEAR(s.bill_date) = ?
        AND s.status = 'Active'
      ORDER BY s.bill_date DESC
    `;

    const totalSql = `
      SELECT 
        COALESCE(SUM(total_gst), 0) as totalGST,
        COALESCE(SUM(total_amount), 0) as totalAmount
      FROM sales 
      WHERE company_id = ? 
        AND MONTH(bill_date) = ?
        AND YEAR(bill_date) = ?
        AND status = 'Active'
    `;

    const [salesResult, totalResult] = await Promise.all([
      executeQuery(salesSql, [companyId, month, year]),
      executeQuery(totalSql, [companyId, month, year]),
    ]);

    return {
      data: salesResult,
      totalGST: formatCurrency(totalResult[0]?.totalGST),
      totalAmount: formatCurrency(totalResult[0]?.totalAmount),
    };
  } catch (error) {
    console.error("Error getting monthly sales:", error);
    return { data: [], totalGST: 0, totalAmount: 0 };
  }
}

async function getMonthlyPurchases(companyId, month, year) {
  try {
    const purchasesSql = `
      SELECT 
        p.id,
        p.bill_date,
        p.bill_no,
        p.total_amount,
        p.gst_amount,
        p.transport,
        p.party_type,
        CASE 
          WHEN p.party_type = 'vendor' THEN v.vendor_name
          WHEN p.party_type = 'farmer' THEN f.name
          ELSE 'Unknown'
        END as party_name
      FROM purchases p
      LEFT JOIN vendors v ON v.id = p.vendor_id
      LEFT JOIN farmers f ON f.id = p.farmer_id
      WHERE p.company_id = ? 
        AND MONTH(p.bill_date) = ?
        AND YEAR(p.bill_date) = ?
        AND p.status = 'Active'
      ORDER BY p.bill_date DESC
    `;

    const totalSql = `
      SELECT 
        COALESCE(SUM(gst_amount), 0) as totalGST,
        COALESCE(SUM(total_amount), 0) as totalAmount
      FROM purchases 
      WHERE company_id = ? 
        AND MONTH(bill_date) = ?
        AND YEAR(bill_date) = ?
        AND status = 'Active'
    `;

    const [purchasesResult, totalResult] = await Promise.all([
      executeQuery(purchasesSql, [companyId, month, year]),
      executeQuery(totalSql, [companyId, month, year]),
    ]);

    return {
      data: purchasesResult,
      totalGST: formatCurrency(totalResult[0]?.totalGST),
      totalAmount: formatCurrency(totalResult[0]?.totalAmount),
    };
  } catch (error) {
    console.error("Error getting monthly purchases:", error);
    return { data: [], totalGST: 0, totalAmount: 0 };
  }
}

async function getMonthlyExpenses(companyId, month, year) {
  try {
    // Regular expenses
    const regularExpensesSql = `
      SELECT 
        expense_date AS bill_date,
        expenses_for,
        expenses_type,
        amount,
        remark,
        incentive,
        master AS bill_no
      FROM expenses 
      WHERE company_id = ? 
        AND MONTH(expense_date) = ?
        AND YEAR(expense_date) = ?
        AND status = 'Active'
      ORDER BY expense_date DESC
    `;

    // GST expenses
    const gstExpensesSql = `
      SELECT 
        bill_date,
        'GST Bill' as expenses_for,
        vendor_name as expenses_type,
        total_amount,
        total_gst_amount,
        remark,
        bill_no
      FROM expenses_bill 
      WHERE company_id = ? 
        AND MONTH(bill_date) = ?
        AND YEAR(bill_date) = ?
        AND status = 'active'
      ORDER BY bill_date DESC
    `;

    const [regularExpensesResult, gstExpensesResult] = await Promise.all([
      executeQuery(regularExpensesSql, [companyId, month, year]),
      executeQuery(gstExpensesSql, [companyId, month, year]),
    ]);

    // Combine and format results
    const regularExpenses = regularExpensesResult.map((exp) => ({
      ...exp,
      total_gst_amount: 0,
      bill_no: null,
    }));

    const allExpenses = [...regularExpenses, ...gstExpensesResult];

    // Calculate totals
    const totals = allExpenses.reduce(
      (acc, exp) => {
        acc.totalGST += parseFloat(exp.total_gst_amount || 0);
        acc.totalAmount +=
          parseFloat(exp.total_amount || exp.amount || 0) +
          parseFloat(exp.incentive || 0);
        return acc;
      },
      { totalGST: 0, totalAmount: 0 }
    );

    return {
      data: allExpenses,
      totalGST: formatCurrency(totals.totalGST),
      totalAmount: formatCurrency(totals.totalAmount),
    };
  } catch (error) {
    console.error("Error getting monthly expenses:", error);
    return { data: [], totalGST: 0, totalAmount: 0 };
  }
}

async function getOutstandingToReceive(companyId, month, year) {
  try {
    const sql = `
      SELECT COALESCE(SUM(s.total_amount - COALESCE(s.paid_amount, 0)), 0) as totalOutstanding
      FROM sales s
      WHERE s.company_id = ? 
        AND MONTH(s.bill_date) = ?
        AND YEAR(s.bill_date) = ?
        AND s.status = 'Active'
        AND (s.total_amount - COALESCE(s.paid_amount, 0)) > 0
    `;

    const result = await executeQuery(sql, [companyId, month, year]);
    return formatCurrency(result[0]?.totalOutstanding);
  } catch (error) {
    console.error("Error getting outstanding to receive:", error);
    return 0;
  }
}

async function getOutstandingToPay(companyId, month, year) {
  try {
    const sql = `
      SELECT COALESCE(SUM(p.total_amount - COALESCE(p.paid_amount, 0)), 0) as totalOutstanding
      FROM purchases p
      WHERE p.company_id = ? 
        AND MONTH(p.bill_date) = ?
        AND YEAR(p.bill_date) = ?
        AND p.status = 'Active'
        AND (p.total_amount - COALESCE(p.paid_amount, 0)) > 0
    `;

    const result = await executeQuery(sql, [companyId, month, year]);
    return formatCurrency(result[0]?.totalOutstanding);
  } catch (error) {
    console.error("Error getting outstanding to pay:", error);
    return 0;
  }
}

async function getClosingBalance(companyId, month, year) {
  try {
    // Get sales for the selected month
    const salesSql = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as totalSales,
        COALESCE(SUM(total_gst), 0) as totalSalesGST
      FROM sales 
      WHERE company_id = ? 
        AND MONTH(bill_date) = ?
        AND YEAR(bill_date) = ?
        AND status = 'Active'
    `;

    // Get purchases for the selected month
    const purchasesSql = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as totalPurchases,
        COALESCE(SUM(gst_amount), 0) as totalPurchasesGST
      FROM purchases 
      WHERE company_id = ? 
        AND MONTH(bill_date) = ?
        AND YEAR(bill_date) = ?
        AND status = 'Active'
    `;

    // Get expenses for the selected month (regular expenses)
    const regularExpensesSql = `
      SELECT 
        COALESCE(SUM(amount), 0) as totalExpenses,
        0 as totalExpensesGST
      FROM expenses 
      WHERE company_id = ? 
        AND MONTH(expense_date) = ?
        AND YEAR(expense_date) = ?
        AND status = 'Active'
    `;

    // Get expenses for the selected month (GST expenses)
    const gstExpensesSql = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as totalExpenses,
        COALESCE(SUM(total_gst_amount), 0) as totalExpensesGST
      FROM expenses_bill 
      WHERE company_id = ? 
        AND MONTH(bill_date) = ?
        AND YEAR(bill_date) = ?
        AND status = 'active'
    `;

    // Get outstanding to receive for the selected month
    const outstandingToReceiveSql = `
      SELECT COALESCE(SUM(s.total_amount - COALESCE(s.paid_amount, 0)), 0) as totalOutstanding
      FROM sales s
      WHERE s.company_id = ? 
        AND MONTH(s.bill_date) = ?
        AND YEAR(s.bill_date) = ?
        AND s.status = 'Active'
        AND (s.total_amount - COALESCE(s.paid_amount, 0)) > 0
    `;

    // Get outstanding to pay for the selected month
    const outstandingToPaySql = `
      SELECT COALESCE(SUM(p.total_amount - COALESCE(p.paid_amount, 0)), 0) as totalOutstanding
      FROM purchases p
      WHERE p.company_id = ? 
        AND MONTH(p.bill_date) = ?
        AND YEAR(p.bill_date) = ?
        AND p.status = 'Active'
        AND (p.total_amount - COALESCE(p.paid_amount, 0)) > 0
    `;

    const [
      salesResult,
      purchasesResult,
      regularExpensesResult,
      gstExpensesResult,
      outstandingToReceiveResult,
      outstandingToPayResult,
    ] = await Promise.all([
      executeQuery(salesSql, [companyId, month, year]),
      executeQuery(purchasesSql, [companyId, month, year]),
      executeQuery(regularExpensesSql, [companyId, month, year]),
      executeQuery(gstExpensesSql, [companyId, month, year]),
      executeQuery(outstandingToReceiveSql, [companyId, month, year]),
      executeQuery(outstandingToPaySql, [companyId, month, year]),
    ]);

    return {
      totalSales: formatCurrency(salesResult[0]?.totalSales),
      totalSalesGST: formatCurrency(salesResult[0]?.totalSalesGST),
      totalPurchases: formatCurrency(purchasesResult[0]?.totalPurchases),
      totalPurchasesGST: formatCurrency(purchasesResult[0]?.totalPurchasesGST),
      totalExpenses:
        formatCurrency(regularExpensesResult[0]?.totalExpenses) +
        formatCurrency(gstExpensesResult[0]?.totalExpenses),
      totalExpensesGST: formatCurrency(gstExpensesResult[0]?.totalExpensesGST),
      outstandingToReceive: formatCurrency(
        outstandingToReceiveResult[0]?.totalOutstanding
      ),
      outstandingToPay: formatCurrency(
        outstandingToPayResult[0]?.totalOutstanding
      ),
    };
  } catch (error) {
    console.error("Error getting closing balance:", error);
    return null;
  }
}

// Calculate profit/loss for current month
function calculateProfitLoss(monthlySales, monthlyPurchases, monthlyExpenses) {
  const totalSales = monthlySales.totalAmount || 0;
  const totalPurchases = monthlyPurchases.totalAmount || 0;
  const totalExpenses = monthlyExpenses.totalAmount || 0;

  const netProfitLoss = totalSales - (totalPurchases + totalExpenses);
  const profitMargin = totalSales > 0 ? (netProfitLoss / totalSales) * 100 : 0;

  return {
    totalSales: totalSales,
    totalPurchases: totalPurchases,
    totalExpenses: totalExpenses,
    netProfitLoss: netProfitLoss,
    profitMargin: parseFloat(profitMargin.toFixed(2)),
    isProfit: netProfitLoss >= 0,
  };
}

module.exports = balanceSheetController;
