const pool = require("../config/db");

function createIncentive(req, res) {
  const { employee_id, year, month, amount, remark } = req.body;

  const query = `
    INSERT INTO incentives (employee_id, year, month, amount, reason) 
    VALUES (?,?,?,?,?)
  `;

  pool.query(
    query,
    [employee_id, year, month, amount, remark],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      return res.json({
        success: true,
        id: result.insertId,
      });
    }
  );
}

function getIncentivesForEmployee(req, res) {
  const { id } = req.params;
  const { year, month } = req.query;

  const query = `
    SELECT * FROM incentives 
    WHERE employee_id = ? AND year = ? AND month = ?
  `;

  pool.query(query, [id, year, month], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    return res.json(rows);
  });
}

function getAllIncentive(req, res) {
  const query = `
    SELECT 
  i.id AS incentive_id,
  i.employee_id,
  e.name AS employee_name,
  e.phone,
  i.year,
  i.month,
  i.amount,
  i.reason,
  i.is_used,
  i.status,
  i.created_at
FROM incentives i
LEFT JOIN employees e ON e.id = i.employee_id
WHERE i.status = 'Active';
  `;

  pool.query(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    return res.json(rows);
  });
}

function updateIncentive(req, res) {
  const { employee_id, year, month, amount, remark, id } = req.body;

  if (!id) {
    return res.json({ message: "Id i required" });
  }

  const query = `
    UPDATE incentives 
    SET 
      employee_id = ?,
      year = ?,
      month = ?,
      amount = ?,
      reason = ?
    WHERE id = ?
  `;

  pool.query(
    query,
    [employee_id, year, month, amount, remark, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      return res.json({
        success: true,
        affectedRows: result.affectedRows,
      });
    }
  );
}

function deleteIncentive(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.json({ message: "Id i required" });
  }

  const query = `
    UPDATE incentives 
    SET 
      status = 'Inactive'
    WHERE id = ?
  `;

  pool.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    return res.json({
      success: true,
      affectedRows: result.affectedRows,
    });
  });
}

module.exports = {
  createIncentive,
  getIncentivesForEmployee,
  getAllIncentive,
  updateIncentive,
  deleteIncentive,
};
