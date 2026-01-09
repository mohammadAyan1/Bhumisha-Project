const pool = require("../config/db");

// ------------------------------
// MARK ATTENDANCE
// ------------------------------
function markAttendance(req, res) {
  const {
    employee_id,
    attendenceDate,
    status,
    reason,
    leave_type = "unpaid",
  } = req.body;

  const isoDate = attendenceDate;
  const sqlDate = new Date(isoDate).toISOString().split("T")[0];

  const query = `
    INSERT INTO attendance (employee_id, date, status, reason, leave_type)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      status = VALUES(status), 
      reason = VALUES(reason), 
      leave_type = VALUES(leave_type), 
      created_at = CURRENT_TIMESTAMP
  `;

  pool.query(
    query,
    [employee_id, sqlDate, status, reason, leave_type],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      return res.json({ success: true });
    }
  );
}

// ------------------------------
// GET ATTENDANCE FOR EMPLOYEE
// ------------------------------
function getAttendanceForEmployee(req, res) {
  const { id } = req.params;
  const { year, month } = req.query;

  const query = `
    SELECT date, status, reason 
    FROM attendance 
    WHERE employee_id = ? AND YEAR(date) = ? AND MONTH(date) = ?
    ORDER BY date
  `;

  pool.query(query, [id, year, month], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json(rows);
  });
}

// ------------------------------
// GET ATTENDANCE FOR MONTH
// ------------------------------
function getAttendanceForMonth(req, res) {
  const { year, month } = req.query;

  const query = `
    SELECT 
        a.id,
        a.employee_id,
        e.name AS employee_name,
        DATE(a.date) AS date,
        a.status,
        a.reason,
        a.leave_type
    FROM attendance a
    INNER JOIN employees e ON a.employee_id = e.id
    WHERE YEAR(DATE(a.date)) = ? 
      AND MONTH(DATE(a.date)) = ?
    ORDER BY a.employee_id, a.date
  `;

  pool.query(query, [year, month], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json(rows);
  });
}

// ------------------------------
// DELETE ATTENDANCE
// ------------------------------
function deleteAttendance(req, res) {
  const { attendance_id } = req.body;

  pool.query(`DELETE FROM attendance WHERE id = ?`, [attendance_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ success: true });
  });
}

function deletePresent(req, res) {
  const { attendenceDate, employee_id } = req.query;

  const sqlDate = new Date(attendenceDate).toISOString().split("T")[0];

  pool.query(
    `DELETE FROM attendance WHERE employee_id = ? AND date = ?`,
    [employee_id, sqlDate],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ success: true });
    }
  );
}

module.exports = {
  markAttendance,
  getAttendanceForEmployee,
  getAttendanceForMonth,
  deleteAttendance,
  deletePresent,
};
