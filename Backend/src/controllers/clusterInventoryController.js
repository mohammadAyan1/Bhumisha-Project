const pool = require("../config/db");

const clusterInvetoryController = {
  getClusterInventory: (req, res) => {
    const sql = `
    SELECT 
      ci.id,
      ci.qty,
      ci.purchase_rate,
      ci.sale_rate,
      ci.unit,
      ci.created_at,
      ci.updated_at,
      
      -- Product info
      p.id AS product_id,
      p.name AS product_name,
      p.hsn_number AS product_hsn,
      
      
      -- Cluster info
      c.id AS cluster_id,
      c.cluster_location,
      c.cluster_manager,
      c.state AS cluster_state,
      c.city AS cluster_city,
      c.name AS cluster_name

    FROM cluster_inventory ci
    LEFT JOIN cluster_second_products p 
      ON ci.cluster_product_id = p.id
    LEFT JOIN company_clusters c
      ON ci.cluster_id = c.id
    ORDER BY ci.id DESC
  `;

    pool.query(sql, (err, result) => {
      if (err) {
        console.error("Error fetching cluster inventory:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, data: result });
    });
  },

  getClusterInventoryByClusterId: (req, res) => {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(401).json({
          message: "Please select cluster",
          data: null,
        });
      }

      const sql = `
  SELECT 
    ci.id,
    ci.qty,
    ci.purchase_rate,
    ci.sale_rate,
    ci.unit,
    ci.created_at,
    ci.updated_at,
    
    -- Product info
    p.id AS product_id,
    p.name AS product_name,
    p.hsn_number AS product_hsn,
    
    
    -- Cluster info
    c.id AS cluster_id,
    c.cluster_location,
    c.cluster_manager,
    c.state AS cluster_state,
    c.city AS cluster_city

  FROM cluster_inventory ci
  LEFT JOIN cluster_second_products p 
    ON ci.cluster_product_id = p.id
  LEFT JOIN company_clusters c
    ON ci.cluster_id = c.id
  WHERE ci.cluster_id = ?
  ORDER BY ci.id DESC
`;

      pool.query(sql, [id], (err, result) => {
        if (err) {
          console.error("Error fetching cluster inventory by cluster Id:", err);
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: result });
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error while fetching cluster inventory by cluster id",
        status: false,
      });
    }
  },

  getClusterProductByPurchases: (req, res) => {
    try {
      const sql = `SELECT * FROM cluster_second_products`;
      pool.query(sql, (err, result) => {
        if (err) {
          console.error("Error fetching cluster inventory by cluster Id:", err);
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: result });
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error while fetching cluster inventory by cluster id",
        status: false,
      });
    }
  },

  createClusterInventory: (req, res) => {
    const { productId, clusterId, qty, purchase, sale, date, unit } = req.body;

    if (!productId || !clusterId || !qty || !unit) {
      return res
        .status(400)
        .json({ success: false, error: "Required fields missing" });
    }

    const entryDate = date || new Date(); // <-- Auto current datetime

    // First, check if the product + cluster already exists
    const checkSql = `
    SELECT * FROM cluster_inventory 
    WHERE cluster_product_id = ? AND cluster_id = ?
  `;
    pool.query(checkSql, [productId, clusterId], (err, results) => {
      if (err) {
        console.error("Error checking existing inventory:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      if (results.length > 0) {
        // Exists, so update quantity, purchase_rate, sale_rate,
        const existing = results[0];
        const newQty = parseFloat(existing.qty) + parseFloat(qty);
        const updateSql = `
        UPDATE cluster_inventory
        SET qty = ?, 
            purchase_rate = ?, 
            sale_rate = ?, 
            unit = ?
        WHERE cluster_product_id = ? AND cluster_id = ?
      `;
        pool.query(
          updateSql,
          [
            newQty,
            purchase || existing.purchase_rate,
            sale || existing.sale_rate,
            unit,
            productId,
            clusterId,
          ],
          (err) => {
            if (err) {
              console.error("Error updating inventory:", err);
              return res
                .status(500)
                .json({ success: false, error: err.message });
            }
            return res.json({
              success: true,
              message: "Inventory updated successfully",
            });
          }
        );
      } else {
        // Not exists, insert new row
        const insertSql = `
        INSERT INTO cluster_inventory 
          (cluster_product_id, cluster_id, qty, purchase_rate, sale_rate, unit)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
        pool.query(
          insertSql,
          [productId, clusterId, qty, purchase, sale, unit],
          (err, result) => {
            if (err) {
              console.error("Error creating inventory:", err);
              return res
                .status(500)
                .json({ success: false, error: err.message });
            }
            return res.json({
              success: true,
              message: "Inventory added successfully",
            });
          }
        );
      }
    });
  },

  updateCluster: (req, res) => {
    const { id } = req.params;
    const { productId, clusterId, qty, purchase, sale, unit } = req.body;

    if (!id) {
      return res.status(400).json({ message: "ID required" });
    }

    const sql = `
    UPDATE cluster_inventory
    SET
      cluster_product_id = ?,
      cluster_id = ?,
      qty = ?,
      purchase_rate = ?,
      sale_rate = ?,
      unit = ?,
      updated_at = NOW()
    WHERE id = ?
  `;

    pool.query(
      sql,
      [productId, clusterId, qty, purchase, sale, unit, id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Record not found" });
        }

        return res.json({
          success: true,
          message: "Cluster inventory updated successfully",
        });
      }
    );
  },

  deleteCluster: (req, res) => {
    const { id } = req.params; // ✅ correct source

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID required",
      });
    }

    const sql = `
    UPDATE cluster_inventory
    SET status = 'Inactive', updated_at = NOW()
    WHERE id = ?
  `;

    pool.query(sql, [id], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });
      }

      return res.json({
        success: true,
        message: "Cluster inventory deleted successfully",
      });
    });
  },
};

module.exports = clusterInvetoryController;
