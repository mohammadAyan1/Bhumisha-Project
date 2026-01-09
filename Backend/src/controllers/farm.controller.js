const pool = require("../config/db");

const farmController = {
  getAllFarm: (req, res) => {
    const sql = `
    SELECT 
      ff.id AS farm_id,
      ff.location,
      ff.size,
      ff.farm_type,
      ff.farmer_id,
      ff.state AS farm_state,
      ff.city,
      ff.district AS farm_district,

      f.name,
      f.father_name,
      f.district,
      f.tehsil,
      f.patwari_halka,
      f.village,
      f.contact_number,
      f.khasara_number,
      f.state,
      f.grade
    FROM farmer_farm ff
    LEFT JOIN farmers f ON ff.farmer_id = f.id
    WHERE ff.status = 'Active'
    ORDER BY ff.id DESC
  `;

    pool.query(sql, (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      return res.json({ success: true, data: results });
    });
  },

  getAllFarmSizeByFarmerId: (req, res) => {
    const { id } = req.query;

    const sql = `
    SELECT 
      *
    FROM farmer_farm 
    WHERE farmer_id = ? AND status='Active'
  `;

    pool.query(sql, [id], (err, results) => {
      if (err) {
        console.error("Error fetching farms:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      return res.json({ success: true, data: results });
    });
  },

  createFarm: (req, res) => {
    const { farmerId, location, size, type, state, village, district } =
      req.body;

    if (!farmerId) {
      return res.status(400).json({ message: "Farmer ID is required" });
    }

    const sql = `
    INSERT INTO farmer_farm
    (farmer_id, location, size, farm_type, state, city, district)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

    pool.query(
      sql,
      [farmerId, location, size, type, state, village, district],
      (err, result) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
        return res.json({
          success: true,
          message: "Farm created successfully",
          farmId: result.insertId,
        });
      }
    );
  },

  updateFarm: (req, res) => {
    const { farmerId, location, size, type, state, village, district, id } =
      req.body;

    if (!id) {
      return res.status(400).json({ message: "Id is Required" });
    }

    const sql = `
    UPDATE farmer_farm
    SET 
      farmer_id = ?,
      location = ?,
      size = ?,
      farm_type = ?,
      state = ?,
      city = ?,
      district = ?
    WHERE id = ? AND status = 'Active'
  `;

    pool.query(
      sql,
      [farmerId, location, size, type, state, village, district, id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Farm not found" });
        }

        return res.json({
          success: true,
          message: "Farm updated successfully",
        });
      }
    );
  },

  deleteFarm: (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID is Required" });
    }

    const sql = `
    UPDATE farmer_farm
    SET status = 'Inactive'
    WHERE id = ? AND status = 'Active'
  `;

    pool.query(sql, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Farm not found" });
      }

      return res.json({ success: true, message: "Farm deleted successfully" });
    });
  },
};

module.exports = farmController;
