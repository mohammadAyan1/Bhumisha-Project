const { dash } = require("pdfkit");
const pool = require("../config/db");
const { data } = require("autoprefixer");

// Get all clusters WITH company details
const getClusters = (req, res) => {
  const sql = `
    SELECT 
      cc.id,
      cc.company_id,
      c.code AS company_code,
      c.name AS company_name,
      cc.cluster_location,
      cc.cluster_manager,
      cc.district,
      cc.state,
      cc.city,
      cc.name AS cluster_name_changes
    FROM company_clusters cc
    LEFT JOIN companies c ON cc.company_id = c.id
    WHERE cc.status='Active'
    ORDER BY cc.id DESC
  `;

  pool.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
};

// Create new cluster
const createCluster = (req, res) => {
  const { companyId, location, manager, state, village, district, name } =
    req.body;

  const sql =
    "INSERT INTO company_clusters (company_id, cluster_location, cluster_manager,state,city,district,name) VALUES (?, ?, ?,?,?,?,?)";
  pool.query(
    sql,
    [companyId, location, manager, state, village, district, name],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).json({ message: "Cluster created", id: result.insertId });
    }
  );
};
// Update cluster
const updateCluster = (req, res) => {
  const { id } = req.params;
  const { name, district, village, state, manager, location, companyId } =
    req.body;

  const sql =
    "UPDATE company_clusters SET name = ?,company_id=?,cluster_location=?,cluster_manager=?,state=?,city=?,district=? WHERE id = ?";
  pool.query(
    sql,
    [name, companyId, location, manager, state, village, district, id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      if (!(result?.affectedRows > 0))
        throw new Error("Something went wrong While Updating Cluster");

      res.json({
        message: "Cluster updated",
        success: true,
        data: result?.affectedRows,
      });
    }
  );
};
// Delete cluster
const deleteCluster = (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE company_clusters SET status='Inactive' WHERE id = ?";
  pool.query(sql, [id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Cluster deleted", id, success: true });
  });
};
module.exports = {
  getClusters,
  createCluster,
  updateCluster,
  deleteCluster,
};
