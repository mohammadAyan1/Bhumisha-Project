const pool = require("../config/db");

const createFarm = async (req, res) => {
  const { location, size, type, farmerId } = req.body;

  if (!farmerId) {
    return res.status(400).json({ error: "farmerId is required" });
  }

  const sql = `
        INSERT INTO farmer_farm ( location, size, farm_type, farmer_id)
        VALUES (?, ?, ?, ?, ?)
    `;
  pool.query(sql, [location, size, type, farmerId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: "Database error" });
    }
    res
      .status(201)
      .json({ message: "Farm created successfully", farmId: results.insertId });
  });
};
