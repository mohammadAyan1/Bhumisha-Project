const pool = require("../config/db");

// helper: pick first non-empty value
const pick = (...values) => {
  return values.find(
    (v) => v !== undefined && v !== null && v !== "" && v !== "-to-"
  );
};

const allExpenses = {
  /// expenses get data
  getAllExpenses: (req, res) => {
    try {
      const sql = `
      SELECT
        e.id,
        e.expenses_for,
        e.expenses_type,

        CASE
          WHEN e.expenses_for = 'emp' THEN emp.name
          ELSE e.master
        END AS master_name,

        e.amount,
        e.remark,
        e.documents,
        e.expense_date,
        e.expensedate,
        e.incentive,
       

        c.code,
        c.name

      FROM expenses e
      LEFT JOIN employees emp
        ON e.expenses_for = 'emp' AND e.master = emp.id

      LEFT JOIN companies c
        ON e.company_id = c.id
      WHERE e.status = 'Active'
    `;

      pool.query(sql, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ success: false, error: err.message });
        }
        return res.json({ success: true, data: results });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  //// createa a expenses data
  createExpenses: (req, res) => {
    const {
      amount,
      billNo,
      category,
      empName,
      from,
      expensedate,
      location,
      pnrNo,
      remark,
      subCategory,
      to,
      company_id,
      incentive,
    } = req.body;

    const files = req.files ? req.files.map((file) => file.path) : [];

    const locationFromToTo = `${from}-to-${to}`;

    const expenses_for = category;
    const expenses_type = pick(subCategory, locationFromToTo, location);
    const master = pick(empName, billNo, pnrNo);

    const safeIncentive =
      incentive && incentive !== "undefined" ? Number(incentive) : 0;

    const sql = `
  INSERT INTO expenses
  (expenses_for, expenses_type, master, amount, remark, documents, expense_date, company_id, incentive)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

    pool.query(
      sql,
      [
        expenses_for,
        expenses_type,
        master,
        amount,
        remark,
        JSON.stringify(files), // convert array of file paths to string
        expensedate,
        Number(company_id),
        safeIncentive,
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, id: result.insertId });
      }
    );
  },

  updateExpenses: (req, res) => {
    const {
      amount,
      billNo,
      category,
      empName,
      from,
      expensedate,
      location,
      pnrNo,
      remark,
      subCategory,
      to,
      company_id,
      incentive,
    } = req.body;

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Expense ID is required",
      });
    }

    // uploaded files
    const files = req.files ? req.files.map((file) => file.path) : [];

    const locationFromToTo = `${from}-to-${to}`;

    const expenses_for = category;
    const expenses_type = pick(subCategory, locationFromToTo, location);
    const master = pick(empName, billNo, pnrNo);

    const safeIncentive =
      incentive && incentive !== "undefined" ? Number(incentive) : 0;

    /**
     * NOTE:
     * - documents updated ONLY if new files are uploaded
     * - otherwise existing documents remain unchanged
     */

    let sql = `
    UPDATE expenses SET
      expenses_for = ?,
      expenses_type = ?,
      master = ?,
      amount = ?,
      remark = ?,
      expense_date = ?,
      company_id = ?,
      incentive = ?
  `;

    const params = [
      expenses_for,
      expenses_type,
      master,
      amount,
      remark,
      expensedate,
      Number(company_id),
      safeIncentive,
    ];

    // append documents only if new files exist
    if (files.length > 0) {
      sql += `, documents = ?`;
      params.push(JSON.stringify(files));
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    pool.query(sql, params, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Expense not found",
        });
      }

      res.json({
        success: true,
        message: "Expense updated successfully",
      });
    });
  },

  /// get current month expenses data
  getCurrentMonthExpenses: async (req, res) => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

      // Get the first and last day of the current month
      const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

      // Format dates for MySQL (YYYY-MM-DD)
      const startDate = firstDayOfMonth.toISOString().split("T")[0];
      const endDate = lastDayOfMonth.toISOString().split("T")[0];

      const sql = `SELECT * FROM expenses 
       WHERE expense_date BETWEEN ? AND ? 
       AND status = 'Active'
       ORDER BY expense_date DESC`;

      // Query to get current month expenses
      pool.query(sql, [startDate, endDate], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ success: false, error: err.message });
        }

        const totalAmount = result.reduce((sum, item) => {
          return sum + Number(item?.amount) + Number(item?.incentive);
        }, 0);

        return res.json({ success: true, data: result, total: totalAmount });
      });
    } catch (error) {
      console.error("Error fetching current month expenses:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching current month expenses",
        error: error.message,
      });
    }
  },

  ///// get expenses by dyynamic month
  // For dynamic month/year filtering, you could also create:
  getByMonth: (req, res) => {
    try {
      const { year, month } = req.query;

      // Use provided month/year or default to current
      const targetYear = parseInt(year) || new Date().getFullYear();
      const targetMonth = parseInt(month) || new Date().getMonth() + 1;

      // Validate month input
      if (targetMonth < 1 || targetMonth > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid month. Must be between 1 and 12",
        });
      }

      const expenses = pool.query(
        `SELECT * FROM expenses 
       WHERE MONTH(expense_date) = ? 
       AND YEAR(expense_date) = ?
       AND status = 'Active'
       ORDER BY expense_date DESC`,
        [targetMonth, targetYear]
      );

      const totalAmount = expenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount),
        0
      );

      res.status(200).json({
        success: true,
        data: expenses,
        summary: {
          month: targetMonth,
          year: targetYear,
          totalExpenses: expenses.length,
          totalAmount: totalAmount.toFixed(2),
        },
      });
    } catch (error) {
      console.error("Error fetching monthly expenses:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching monthly expenses",
        error: error.message,
      });
    }
  },

  updateExpenseStatus: (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Expense ID is required",
        });
      }

      const sql = `UPDATE expenses SET status = ? WHERE id = ?`;

      pool.query(sql, ["Inactive", id], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            error: "Database error",
            details: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            error: "Expense record not found",
          });
        }

        res.json({
          success: true,
          message: "Expense status updated to Inactive",
          affectedRows: result.affectedRows,
          id,
        });
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },

  /////////////////////////////////////////////////!SECTION

  //// update gst billing expenses data
  updateBillExpenses: (req, res) => {
    try {
      const {
        vendor,
        firm,
        gst_number,
        address,
        contact,
        bill_no,
        total_amount,
        total_gst_amount,
        number_of_item,
        expensedate,
        remark,
        company_id,
      } = req.body;

      const { id } = req.params;

      // Validate required fields
      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Expense ID is required",
        });
      }

      // Logging for debugging

      // Handle file uploads
      const files = req.files ? req.files.map((file) => file.path) : [];
      // Note: You might want to merge with existing images or replace them

      const sql = `UPDATE expenses_bill 
                 SET vendor_name = ?, 
                     firm_name = ?, 
                     gst_number = ?, 
                     address = ?, 
                     contact = ?, 
                     bill_no = ?, 
                     total_amount = ?, 
                     total_gst_amount = ?, 
                     number_of_item = ?, 
                     bill_date = ?, 
                     remark = ?, 
                     company_id = ?
                 WHERE id = ?`;

      pool.query(
        sql,
        [
          vendor || null,
          firm || null,
          gst_number || null,
          address || null,
          contact || null,
          bill_no || null,
          total_amount || 0,
          total_gst_amount || 0,
          number_of_item || 0,
          expensedate || null,
          remark || null,
          company_id || null,
          id, // This should be the last parameter (WHERE clause)
        ],
        (err, result) => {
          if (err) {
            console.error("Database error:", err);

            return res.status(500).json({
              success: false,
              error: "Database error",
              details: err.message,
            });
          }

          if (files.length > 0) {
            const sql = `UPDATE expenses_bill SET bill_image = ? WHERE id = ?`;
            pool.query(
              sql,
              [
                JSON.stringify(files), // Consider merging with existing images
                id,
              ],
              (err, result) => {
                if (err) console.error("Database error:", err);

                // For UPDATE, check affectedRows, not insertId
                if (result.affectedRows === 0) {
                  return res.status(404).json({
                    success: false,
                    error: "Expense record not found or no changes made",
                  });
                }
              }
            );
          }

          // For UPDATE, check affectedRows, not insertId
          if (result.affectedRows === 0) {
            return res.status(404).json({
              success: false,
              error: "Expense record not found or no changes made",
            });
          }

          res.json({
            success: true,
            message: "Expense updated successfully",
            affectedRows: result.affectedRows,
            id: id, // Return the ID that was updated
          });
        }
      );
    } catch (error) {
      console.error("Unexpected error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },

  /// upadte gst billing expenses data for hiding
  updateBillExpensesStatus: (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Expense ID is required",
        });
      }

      const sql = `UPDATE expenses_bill SET status = ? WHERE id = ?`;

      pool.query(sql, ["inactive", id], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            error: "Database error",
            details: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            error: "Expense record not found",
          });
        }

        res.json({
          success: true,
          message: "Expense status updated to Inactive",
          affectedRows: result.affectedRows,
          id,
        });
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },

  ////  create a gst billing expenses data
  createExpensesBill: (req, res) => {
    const {
      vendor,
      firm,
      gst_number,
      address,
      contact,
      bill_no,
      total_amount,
      total_gst_amount,
      number_of_item,
      expensedate,
      remark,
      company_id,
    } = req.body;

    const sql = `INSERT INTO expenses_bill  (vendor_name,firm_name,gst_number,address,contact,bill_no,total_amount,total_gst_amount,number_of_item,bill_date,bill_image,remark,company_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const files = req.files ? req.files.map((file) => file.path) : [];

    pool.query(
      sql,
      [
        vendor,
        firm,
        gst_number,
        address,
        contact,
        bill_no,
        total_amount,
        total_gst_amount,
        number_of_item,
        expensedate,
        JSON.stringify(files), // convert array of file paths to string
        remark,
        company_id,
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, id: result.insertId });
      }
    );
  },

  /// get current month expenses data
  getCurrentMonthGSTExpenses: async (req, res) => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

      // Get the first and last day of the current month
      const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

      // Format dates for MySQL (YYYY-MM-DD)
      const startDate = firstDayOfMonth.toISOString().split("T")[0];
      const endDate = lastDayOfMonth.toISOString().split("T")[0];

      const sql = `SELECT * FROM expenses_bill 
       WHERE bill_date BETWEEN ? AND ? 
       AND status = 'active'
       ORDER BY createdAt DESC`;

      // Query to get current month expenses
      pool.query(sql, [startDate, endDate], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ success: false, error: err.message });
        }

        const totalAmount = result.reduce((sum, item) => {
          return (
            sum + Number(item?.total_amount) + Number(item?.total_gst_amount)
          );
        }, 0);

        return res.json({ success: true, data: result, total: totalAmount });
      });
    } catch (error) {
      console.error("Error fetching current month expenses:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching current month expenses",
        error: error.message,
      });
    }
  },

  //// get all gst billing expenses if its active
  getAllExpensesBill: (req, res) => {
    const sql = `SELECT * FROM expenses_bill WHERE status = 'active'`;
    pool.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err.message });
      }
      return res.json({ success: true, data: result });
    });
  },
};

module.exports = allExpenses;
