const FarmerModel = require("../models/farmerModel");

// Helper: normalize any incoming status to DB enum values
const toDbStatus = (s) => {
  const x = (s || "").toString().toLowerCase();
  if (x === "active") return "Active";
  if (x === "inactive") return "Inactive";
  return undefined;
};

// Create
const createFarmer = (req, res) => {
  const {
    name,
    father_name,
    district,
    tehsil,
    patwari_halka,
    village,
    contact_number,
    khasara_number,
    bank,
    status,
    balance,
    min_balance,
  } = req.body;

  const dbStatus = toDbStatus(status) || "Active";

  FarmerModel.createFarmer(
    {
      name,
      father_name,
      district,
      tehsil,
      patwari_halka,
      village,
      contact_number,
      khasara_number,
      status: dbStatus,
      balance,
      min_balance,
    },
    bank,
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Farmer added successfully!" });
    }
  );
};

// Read
const getFarmers = (req, res) => {
  FarmerModel.getFarmers((err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

// Update
const updateFarmer = (req, res) => {
  const farmer_id = req.params.id;
  const {
    name,
    father_name,
    district,
    tehsil,
    patwari_halka,
    village,
    contact_number,
    khasara_number,
    bank,
    status,
    balance,
    min_balance,
  } = req.body;

  const dbStatus = toDbStatus(status); // undefined allowed -> model can COALESCE to keep existing

  FarmerModel.updateFarmer(
    farmer_id,
    {
      name,
      father_name,
      district,
      tehsil,
      patwari_halka,
      village,
      contact_number,
      khasara_number,
      status: dbStatus ?? undefined,
      balance,
      min_balance,
    },
    bank,
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Farmer updated successfully!" });
    }
  );
};

// Delete
const deleteFarmer = (req, res) => {
  const farmer_id = req.params.id;
  FarmerModel.deleteFarmer(farmer_id, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Farmer deleted successfully!" });
  });
};

// Update Status
const updateFarmerStatus = (req, res) => {
  const farmer_id = req.params.id;
  const dbStatus = toDbStatus(req.body.status);
  if (!dbStatus) {
    return res.status(400).json({ message: "Invalid status value" });
  }
  FarmerModel.updateFarmerStatus(farmer_id, dbStatus, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: `Farmer status updated to ${dbStatus}` });
  });
};

// Statement
// const getFarmerStatement = (req, res) => {
//   const farmerId = req.params.id;
//   const { from, to, limit = 50, offset = 0, sort = "asc" } = req.query;

//   if (!farmerId)
//     return res.status(400).json({ message: "Farmer ID is required" });
//   if (!from || !to)
//     return res.status(400).json({ message: "From and To dates are required" });

//   FarmerModel.getFarmerStatement(
//     {
//       farmerId: parseInt(farmerId),
//       from,
//       to,
//       limit: parseInt(limit),
//       offset: parseInt(offset),
//       sort,
//     },
//     (err, payload) => {
//       if (err)
//         return res.status(500).json({ message: "Failed to fetch statement" });
//       res.json(payload);
//     }
//   );
// };

// farmerStatement.controller.js

const getFarmerStatement = (req, res) => {
  const farmerId = req.params.id;
  const { from, to, limit = 50, offset = 0, sort = "asc" } = req.query;

  if (!farmerId)
    return res.status(400).json({ message: "Farmer ID is required" });
  if (!from || !to)
    return res.status(400).json({ message: "From and To dates are required" });

  FarmerModel.getFarmerStatement(
    {
      farmerId: parseInt(farmerId),
      from,
      to,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort,
    },
    (err, payload) => {
      if (err) {
        console.error("Statement Error:", err);
        return res.status(500).json({ message: "Failed to fetch statement" });
      }
      res.json(payload);
    }
  );
};

const getFarmerInvoiceDetails = (req, res) => {
  const { farmerId, invoiceId, type } = req.params;

  if (!farmerId || !invoiceId || !type) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  FarmerModel.getInvoiceDetails(
    {
      farmerId: parseInt(farmerId),
      invoiceId: parseInt(invoiceId),
      type: type.toLowerCase(),
    },
    (err, payload) => {
      if (err) {
        console.error("Invoice Details Error:", err);
        return res
          .status(500)
          .json({ message: "Failed to fetch invoice details" });
      }
      res.json(payload);
    }
  );
};

module.exports = {
  createFarmer,
  getFarmers,
  updateFarmer,
  deleteFarmer,
  updateFarmerStatus,
  getFarmerStatement,
  getFarmerInvoiceDetails,
};
