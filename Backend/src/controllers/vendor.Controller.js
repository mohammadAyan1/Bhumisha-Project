const VendorModel = require("../models/vendorModel");
const db = require("../config/db");
const createVendor = (req, res) => {
  try {
    const {
      vendor_name,
      firm_name,
      gst_no,
      address,
      contact_number,
      bank,
      status,
      balance,
      min_balance,
    } = req.body;

    VendorModel.createVendor(
      {
        vendor_name,
        firm_name,
        gst_no,
        address,
        contact_number,
        status,
        balance,
        min_balance,
      },
      bank,
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        VendorModel.getVendorById(result.insertId, (err, vendor) => {
          if (err) {
            return res.status(201).json({
              message: "Vendor added successfully!",
              vendor: {
                id: result.insertId,
                vendor_name,
                firm_name,
                gst_no,
                address,
                contact_number,
                status,
                balance: balance ?? undefined,
                min_balance: min_balance ?? undefined,
                bank,
              },
            });
          }
          res
            .status(201)
            .json({ message: "Vendor added successfully!", vendor });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =============== Update ==================

const updateVendor = (req, res) => {
  const vendor_id = req.params.id;
  const {
    vendor_name,
    firm_name,
    gst_no,
    address,
    contact_number,
    bank,
    status,
    balance,
    min_balance,
  } = req.body;

  VendorModel.updateVendor(
    vendor_id,
    {
      vendor_name,
      firm_name,
      gst_no,
      address,
      contact_number,
      status,
      balance,
      min_balance,
    },
    bank,
    (err) => {
      if (err) return res.status(500).json(err);
      VendorModel.getVendorById(vendor_id, (err, vendor) => {
        if (err) return res.status(500).json(err);
        res.status(200).json({
          message: "Vendor updated successfully!",
          vendor: { ...vendor, bank: bank || {} },
        });
      });
    }
  );
};
// =============== Read ==================
const getVendors = (req, res) => {
  VendorModel.getVendors((err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

// =============== Delete ==================
const deleteVendor = (req, res) => {
  const vendor_id = req.params.id;

  VendorModel.deleteVendor(vendor_id, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Vendor deleted successfully!" });
  });
};

// =============== Update Status (Active/Inactive) ==================
const updateVendorStatus = (req, res) => {
  const vendor_id = req.params.id;
  const { status } = req.body;

  // Convert to lowercase and validate
  const normalizedStatus = status.toLowerCase();
  if (!["active", "inactive"].includes(normalizedStatus)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  VendorModel.updateVendorStatus(vendor_id, normalizedStatus, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: `Vendor status updated to ${normalizedStatus}` });
  });
};

const getVendorById = (vendor_id, callback) => {
  const query = `SELECT v.id,v.vendor_name, v.firm_name, v.gst_no, v.address, v.contact_number, v.status,
                 b.pan_number, b.account_holder_name, b.bank_name, b.account_number, b.ifsc_code, b.branch_name
                 FROM vendors v
                 LEFT JOIN vendor_bank_details b ON v.id = b.vendor_id
                 WHERE v.id = ?`;
  db.query(query, [vendor_id], (err, results) => {
    if (err) {
      console.error("Error in getVendorById:", err);
      return callback(err);
    }

    // Check if we got any results
    if (results.length === 0) {
      return callback(null, null);
    }

    // Return the first result (should be only one)
    callback(null, results[0]);
  });
};

const getVendorStatement = (req, res) => {
  const vendorId = req.params.id;
  const { from, to, limit = 50, offset = 0, sort = "asc" } = req.query;

  if (!vendorId)
    return res.status(400).json({ message: "Vendor ID is required" });

  // Set default dates if not provided (last 30 days)
  const toDate = to || new Date().toISOString().split("T")[0];
  const fromDate =
    from ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  VendorModel.getVendorStatement(
    {
      vendorId: parseInt(vendorId),
      from: fromDate,
      to: toDate,
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

const getVendorInvoiceDetails = (req, res) => {
  const { vendorId, invoiceId, type } = req.params;

  if (!vendorId || !invoiceId || !type) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  VendorModel.getInvoiceDetails(
    {
      vendorId: parseInt(vendorId),
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

const fetchVendorByName = (req, res) => {
  const { mobile_no } = req.query; // safely extract from body

  if (!mobile_no) {
    return res.status(400).json({
      success: false,
      message: "Vendor phone number is required is required",
    });
  }

  const sql = `
    SELECT
      v.vendor_name,
      v.firm_name,
      v.gst_no,
      vb.account_holder_name,
      vb.bank_name,
      vb.account_number,
      vb.ifsc_code,
      vb.branch_name
    FROM vendors AS v
    JOIN vendor_bank_details AS vb
      ON v.id = vb.vendor_id
    WHERE v.contact_number  = ?;
  `;

  // Use parameterized query to prevent SQL injection
  db.query(sql, [mobile_no], (err, results) => {
    if (err) {
      console.error("Error fetching vendor:", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: results[0],
    });
  });
};

module.exports = {
  createVendor,
  getVendors,
  updateVendor,
  deleteVendor,
  updateVendorStatus,
  getVendorById,
  getVendorStatement,
  fetchVendorByName,
  getVendorInvoiceDetails,
};
