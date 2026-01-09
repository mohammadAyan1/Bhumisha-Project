// const pool = require("../config/db");
// const clusterAssignProductController = {
//   assignProductToCluster: (req, res) => {
//     try {
//       const products = req.body; // Expecting an array of products
//       if (!Array.isArray(products) || products.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Request body must be a non-empty array of products",
//         });
//       }

//       // Filter out invalid products and ensure IDs are numbers
//       const productsToInsert = products
//         .map((p) => {
//           const cluster_id = Number(p.cluster_id);
//           const product_id = Number(p.product_id);
//           const rate = Number(p.rate) || 0;
//           const quantity = Number(p.quantity) || 0;

//           if (!cluster_id || !product_id || quantity <= 0) return null;

//           return [cluster_id, product_id, quantity, "gram", rate];
//         })
//         .filter(Boolean);

//       if (productsToInsert.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "No valid products/clusters to insert",
//         });
//       }

//       const sql = `
//       INSERT INTO cluster_assign_products (cluster_id, product_id, quantity, unit, rate)
//       VALUES ?
//     `;

//       pool.query(sql, [productsToInsert], (error, results) => {
//         if (error) {
//           console.error("Error assigning products to cluster:", error);
//           return res.status(500).json({ success: false, error: error.message });
//         }

//         return res.json({
//           success: true,
//           message: "Products assigned to cluster successfully",
//           inserted: results.affectedRows,
//         });
//       });
//     } catch (err) {
//       console.error(err);
//       return res
//         .status(500)
//         .json({ success: false, message: "Server error", error: err.message });
//     }
//   },

//   getAllAssignedProducts: (req, res) => {
//     const sql = "SELECT * FROM cluster_assign_products";
//     pool.query(sql, (error, results) => {
//       if (error) {
//         console.error("Error fetching assigned products:", error);
//         return res.status(500).json({ success: false, error: error.message });
//       }
//       return res.json({ success: true, data: results });
//     });
//   },
// };

// module.exports = clusterAssignProductController;

const pool = require("../config/db");
const clusterAssignProductController = {
  assignProductToCluster: (req, res) => {
    try {
      const products = req.body; // Expecting an array of products
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Request body must be a non-empty array of products",
        });
      }

      // Filter out invalid products and ensure IDs are numbers
      const productsToInsert = products
        .map((p) => {
          const cluster_id = Number(p.cluster_id);
          const product_id = Number(p.product_id);
          const rate = Number(p.rate) || 0;
          const quantity = Number(p.quantity) || 0;

          if (!cluster_id || !product_id || quantity <= 0) return null;

          return [cluster_id, product_id, quantity, "gram", rate];
        })
        .filter(Boolean);

      if (productsToInsert.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid products/clusters to insert",
        });
      }

      const sql = `
      INSERT INTO cluster_assign_products (cluster_id, product_id, quantity, unit, rate)
      VALUES ?
    `;

      pool.query(sql, [productsToInsert], (error, results) => {
        if (error) {
          console.error("Error assigning products to cluster:", error);
          return res.status(500).json({ success: false, error: error.message });
        }

        return res.json({
          success: true,
          message: "Products assigned to cluster successfully",
          inserted: results.affectedRows,
        });
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ success: false, message: "Server error", error: err.message });
    }
  },

  getAllAssignedProducts: (req, res) => {
    const sql = "SELECT * FROM cluster_assign_products";
    pool.query(sql, (error, results) => {
      if (error) {
        console.error("Error fetching assigned products:", error);
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true, data: results });
    });
  },
};

module.exports = clusterAssignProductController;
