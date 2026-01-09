const pool = require("../config/db");

const clusterProductsController = {
  getClusterProducts: (req, res) => {
    const sql = `SELECT * FROM cluster_products ORDER BY id DESC`;

    pool.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching cluster products:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, data: results });
    });
  },
  // getGivenClusterProducts: (req, res) => {
  //   const sql = `SELECT * FROM cluster_products WHERE status = 'giver'  ORDER BY id DESC`;
  //   pool.query(sql, (err, results) => {
  //     if (err) {
  //       console.error("Error fetching given cluster products:", err);
  //       return res.status(500).json({ success: false, error: err.message });
  //     }
  //     res.json({ success: true, data: results });
  //   });
  // },

  getGivenClusterProducts: (req, res) => {
    const sql = `
    SELECT 
      cp.*, 
      p.product_name,
      p.size,
      p.unit AS product_unit,
      p.purchase_rate,
      p.transport_charge,
      p.local_transport,
      p.packaging_cost,
      p.packing_weight,
      p.total,
      p.hsn_code
    FROM cluster_products cp
    LEFT JOIN products p ON cp.product_id = p.id
    WHERE cp.status = 'giver'
    ORDER BY cp.id DESC
  `;

    pool.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching given cluster products:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      res.json({
        success: true,
        data: results,
      });
    });
  },

  getReceivedClusterProducts: (req, res) => {
    const sql = `SELECT * FROM cluster_products WHERE status = 'receive'  ORDER BY id DESC`;
    pool.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching received cluster products:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, data: results });
    });
  },
  createClusterProduct: (req, res) => {
    const {
      clusterId,
      product_id,
      name,
      quantity_in_gram,
      unit,
      farmerId,
      rate_per_kg,
    } = req.body;

    const sql = `
        INSERT INTO cluster_products (cluster_id, product_id, farmer_id,rate,name, quantity, unit )
        VALUES ?
  `;

    // Convert products into array-of-arrays
    const values = req?.body?.map((p) => [
      clusterId,
      p.product_id || null,
      farmerId || null,
      p.rate_per_kg,
      p.name,
      p.quantity_in_gram,
      p.unit,
    ]);

    pool.query(sql, [values], (err, results) => {
      if (err) {
        console.error("Error creating cluster product:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({
        success: true,
        inserted: results.affectedRows,
        message: "Products added to cluster successfully",
      });
    });
  },

  updateClusterProduct: (req, res) => {
    const { id } = req.params;
    const { clusterId, productId, name, quantity, unit, isCustomProduct } =
      req.body;
    const sql = `
      UPDATE cluster_products
      SET cluster_id = ?, product_id = ?, name = ?, quantity = ?, unit = ?, is_custom_product = ?
        WHERE id = ?
`;
    pool.query(
      sql,
      [
        clusterId,
        productId || null,
        name,
        quantity,
        unit,
        isCustomProduct ? 1 : 0,
        id,
      ],
      (err, results) => {
        if (err) {
          console.error("Error updating cluster product:", err);
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: results });
      }
    );
  },
  deleteClusterProduct: (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM cluster_products WHERE id = ?`;
    pool.query(sql, [id], (err, results) => {
      if (err) {
        console.error("Error deleting cluster product:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, data: results });
    });
  },
};

module.exports = clusterProductsController;
