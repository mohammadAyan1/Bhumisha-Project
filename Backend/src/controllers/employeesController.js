const pool = require("../config/db");

function createEmployee(req, res) {
  const { name, email, phone, position, base_salary, join_date } = req.body;

  const photo = req.file ? req.file.filename : null;

  // Always use the fixed salary date
  const salary_date = "2025-12-01";

  // Validate join_date
  const jd = new Date(join_date);
  if (isNaN(jd.getTime())) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid join_date" });
  }

  // Validate salary_date
  const sd = new Date(salary_date);
  if (isNaN(sd.getTime())) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid salary_date" });
  }

  const mysqlJoiningDate = jd.toISOString().slice(0, 19).replace("T", " ");
  const mysqlSalaryDate = sd.toISOString().slice(0, 19).replace("T", " ");

  const sql = `
    INSERT INTO employees 
    (name, email, phone, position, base_salary, join_date, photo,salary_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?,?)
  `;

  pool.query(
    sql,
    [
      name,
      email,
      phone,
      position,
      base_salary,
      mysqlJoiningDate,
      photo,
      mysqlSalaryDate,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, id: result.insertId });
    }
  );
}

function editEmployee(req, res) {
  const { id } = req.params; // <-- Make sure id comes from params
  const { name, email, phone, position, base_salary, join_date } = req.body;

  // Always use the fixed salary date
  const salary_date = "2025-12-01";

  // If a new photo is uploaded use it, else keep old photo
  const photo = req.file ? req.file.filename : null;

  // Convert date only if provided
  let mysqlJoiningDate = null;
  if (join_date) {
    mysqlJoiningDate = new Date(join_date)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  }

  let mysqlSalaryDate = null;
  if (salary_date) {
    mysqlSalaryDate = new Date(salary_date)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  }

  const sql = `
    UPDATE employees
    SET 
        name = ?,
        email = ?,
        phone = ?,
        position = ?,
        base_salary = ?,
        join_date = ?,
        photo = COALESCE(?, photo),
        salary_date = ?
    WHERE id = ?;
  `;

  pool.query(
    sql,
    [
      name,
      email,
      phone,
      position,
      base_salary,
      mysqlJoiningDate,
      photo,
      mysqlSalaryDate,
      id, // 👈 FIXED (8th parameter)
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err.message });
      }

      res.json({
        success: true,
        affectedRows: result.affectedRows,
        message: "Employee updated successfully",
      });
    }
  );
}

function deleteEmployee(req, res) {
  const id = Number(req.params.id);

  if (isNaN(id))
    return res.status(400).json({ success: false, message: "Invalid ID" });

  const sql = `UPDATE employees SET status = 'inactive' WHERE id = ?`;

  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: err.message });
    }

    return res.json({
      success: true,
      affectedRows: result.affectedRows,
      message: "Employee status changed to inactive",
    });
  });
}

function getAllEmployees(req, res) {
  const sql = `SELECT * FROM employees WHERE status = 'active' ORDER BY id DESC`;

  pool.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

function getEmployee(req, res) {
  const { id } = req.params;

  pool.query("SELECT * FROM employees WHERE id = ?", [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });

    res.json(rows[0]);
  });
}

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployee,
  editEmployee,
  deleteEmployee,
};
