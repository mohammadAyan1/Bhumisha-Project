const pool = require("../config/db");
const { update } = require("./purchaseOrder.controller");

const secondClusterProducts = {
  async create(req, res) {
    try {
      const { name, hsn } = req.body;

      const sql = `
        INSERT INTO cluster_second_products 
        (name, hsn_number)
        VALUES (?, ?)
      `;

      pool.query(sql, [name, hsn], (err, result) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ error: "Database error", details: err, success: false });
        }

        res.status(201).json({
          message: "Cluster created",
          id: result.insertId,
          success: true,
        });
      });
    } catch (error) {
      res.status(500).json({
        error: "Server error",
        details: error.message,
        success: false,
      });
    }
  },
  async getAll(req, res) {
    try {
      const sql = `SELECT * FROM cluster_second_products WHERE status='Active'`;

      pool.query(sql, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            error: "Database error",
            details: err,
            success: false,
          });
        }

        res.status(200).json({
          message: "Cluster Second Products Retrieved Successfully",
          data: result,
          success: true,
        });
      });
    } catch (error) {
      res.status(500).json({
        error: "Server error",
        details: error.message,
        success: false,
      });
    }
  },

  async update(req, res) {
    const { id } = req.params;
    const { name, hsn } = req.body;

    // ✅ Validation
    if (!id || !name || !hsn) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        success: false,
      });
    }

    const sql = `
    UPDATE cluster_second_products
    SET name = ?, hsn_number = ?
    WHERE id = ?
  `;

    pool.query(sql, [name, hsn, id], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error while updating cluster product",
          success: false,
        });
      }

      // ✅ If ID not found
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
          success: false,
        });
      }

      return res.json({
        success: true,
        message: "Cluster product updated successfully",
        success: true,
      });
    });
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      // ✅ Validation
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID is required",
          success: false,
        });
      }

      const sql = `
      UPDATE cluster_second_products
      SET status = 'Inactive'
      WHERE id = ?
    `;

      pool.query(sql, [id], (err, result) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error while deleting cluster product",
            success: false,
          });
        }

        // ✅ If ID not found
        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: "Product not found",
            success: false,
          });
        }

        return res.json({
          success: true,
          message: "Cluster product deleted successfully",
          success: true,
        });
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        success: false,
      });
    }
  },
};

module.exports = secondClusterProducts;
