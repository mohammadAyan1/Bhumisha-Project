const db = require("../config/db");

const AllHolidayController = {
  createHoliday: (req, res) => {
    const { holidayDate, holidayRemark } = req.body;

    if (!holidayDate) {
      return res.json({
        success: false,
        message: "Holiday date is required",
      });
    }

    const checkQuery = `SELECT id FROM holidays WHERE holiday_date = ?`;

    db.query(checkQuery, [holidayDate], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // ✅ Already exists
      if (result.length > 0) {
        return res.json({
          success: false,
          message: "This date is already declared as a holiday",
        });
      }

      // ✅ Insert only if not exists
      const insertQuery = `
      INSERT INTO holidays (holiday_date, remark)
      VALUES (?, ?)
    `;

      db.query(insertQuery, [holidayDate, holidayRemark], (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        return res.json({
          success: true,
          id: result.insertId,
          message: "Holiday created successfully",
        });
      });
    });
  },

  getAllHoliday: (req, res) => {
    const sql = `SELECT id, holiday_date, remark FROM holidays WHERE status='Active'`;
    db.query(sql, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      return res.json(result); // <-- returns pure array
    });
  },

  updateHoliday: (req, res) => {
    const { holidayDate, holidayRemark, id } = req.body;

    if (!holidayDate) {
      return res.json({
        success: false,
        message: "Holiday date is required",
      });
    }

    if (!id) {
      return res.json({
        success: false,
        message: "Holiday ID is required",
      });
    }

    // ✅ Check if date already exists for another record
    const checkQuery = `
    SELECT id 
    FROM holidays 
    WHERE holiday_date = ? AND id != ?
  `;

    db.query(checkQuery, [holidayDate, id], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // ❌ Date already exists
      if (rows.length > 0) {
        return res.json({
          success: false,
          message: "This date is already declared as a holiday",
        });
      }

      // ✅ Update holiday
      const updateQuery = `
      UPDATE holidays 
      SET holiday_date = ?, remark = ?
      WHERE id = ?
    `;

      db.query(updateQuery, [holidayDate, holidayRemark, id], (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        return res.json({
          success: true,
          message: "Holiday updated successfully",
        });
      });
    });
  },
  deleteHoliday: (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Holiday ID is required",
      });
    }

    const sql = `UPDATE holidays SET status = 'Inactive' WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Holiday not deleted",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Holiday not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Holiday deleted successfully",
      });
    });
  },
};

module.exports = AllHolidayController;
