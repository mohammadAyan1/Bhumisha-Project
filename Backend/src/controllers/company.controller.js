const Company = require("../models/company.model");
const { createCompanyTables } = require("../services/companyTables");
const path = require("path");

exports.create = async (req, res) => {
  try {
    const { code, name, address, gst_no, contact_no, email, owner_name, bank } =
      req.body;

    let cc = String(code || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_");
    cc = cc.replace(/_+/g, "_").replace(/^_+|_+$/g, "");

    if (!cc || !/^[a-z0-9_]+$/.test(cc))
      return res.status(400).json({ error: "invalid code" });
    if (!name) return res.status(400).json({ error: "name required" });

    // Get image URL if file uploaded
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // If bank details provided, create bank record first
    let bank_detail_id = null;
    let bankObj = null;
    if (bank) {
      if (typeof bank === "string") {
        try {
          bankObj = JSON.parse(bank);
        } catch {}
      } else if (typeof bank === "object") {
        bankObj = bank;
      }
    }
    if (bankObj && typeof bankObj === "object") {
      try {
        const r = await Company.createBankDetails({
          pan_number: bankObj.pan_number,
          account_holder_name: bankObj.account_holder_name,
          bank_name: bankObj.bank_name,
          account_number: bankObj.account_number,
          ifsc_code: bankObj.ifsc_code,
          branch_name: bankObj.branch_name,
          upi_id: bankObj.upi_id,
        });
        bank_detail_id = r.insertId || null;
      } catch (e) {}
    }

    await Company.create({
      code: cc,
      name,
      address,
      gst_no,
      contact_no,
      email,
      owner_name,
      image_url,
      bank_detail_id,
    });

    await createCompanyTables(cc);

    res.status(201).json({
      message: "Company created successfully",
      code: cc,
      image_url,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.list = async (_req, res) => {
  try {
    res.json(await Company.list());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "id required" });

    // Build update payload; allow multipart with optional file
    const body = req.body || {};
    const payload = {
      code: body.code ? String(body.code).trim().toLowerCase() : undefined,
      name: body.name,
      address: body.address,
      gst_no: body.gst_no,
      contact_no: body.contact_no,
      email: body.email,
      owner_name: body.owner_name,
      status: body.status,
    };
    if (req.file) {
      payload.image_url = `/uploads/${req.file.filename}`;
    }

    // Remove undefined keys
    Object.keys(payload).forEach(
      (k) => payload[k] === undefined && delete payload[k]
    );

    // Handle bank upsert if provided
    let bankPayload = null;
    if (body.bank) {
      if (typeof body.bank === "string") {
        try {
          bankPayload = JSON.parse(body.bank);
        } catch {}
      } else if (typeof body.bank === "object") {
        bankPayload = body.bank;
      }
    }
    if (bankPayload && typeof bankPayload === "object") {
      try {
        const current = await Company.list(); // we don't have getById; using list then filter
        const comp = (current || []).find((c) => String(c.id) === String(id));
        if (comp && comp.bank_detail_id) {
          await Company.updateBankDetails(comp.bank_detail_id, bankPayload);
        } else {
          const r = await Company.createBankDetails(bankPayload);
          payload.bank_detail_id = r.insertId || null;
        }
      } catch {}
    }

    const result = await Company.update(id, payload);
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ error: "Company not found or nothing to update" });
    return res.json({
      message: "Company updated",
      image_url: payload.image_url,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
