const db = require("../config/db");
const { tn } = require("../services/tableName");
const { normalize } = require("../services/companyCode");

// Helpers
const toSQLDate = (d) => {
  if (!d) return null;
  const t = Date.parse(d);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString().split("T")[0];
};

const Purchase = {
  create: async (company_code, data) => {
    const code = normalize(company_code || "");
    if (!code) throw new Error("company_code required");

    const purchasesTable = tn(code, "purchases");
    const itemsTable = tn(code, "purchase_items");

    const {
      party_type,
      vendor_id,
      farmer_id,
      gst_no,
      bill_no,
      bill_date,
      status,
      items,
      bill_img,
    } = data || {};

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Items must be a non-empty array");
    }
    if (!bill_no) throw new Error("bill_no is required");
    if (!bill_date) throw new Error("bill_date is required");
    if (!["vendor", "farmer"].includes(String(party_type))) {
      throw new Error("party_type must be 'vendor' or 'farmer'");
    }

    const conn = db.promise();
    try {
      await conn.query("START TRANSACTION");

      const formattedDate = toSQLDate(bill_date);
      if (!formattedDate) throw new Error("Invalid bill_date");

      const total_amount = items.reduce(
        (sum, i) => sum + Number(i.rate || 0) * Number(i.size || 0),
        0
      );

      const [purchaseResult] = await conn.query(
        `INSERT INTO \`${purchasesTable}\`
           (vendor_id, farmer_id, party_type, gst_no, bill_no, bill_date, total_amount, status, bill_img)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          party_type === "vendor" ? vendor_id ?? null : null,
          party_type === "farmer" ? farmer_id ?? null : null,
          party_type,
          gst_no || null,
          bill_no,
          formattedDate,
          total_amount,
          status || "Active",
          bill_img || null,
        ]
      );

      const purchaseId = purchaseResult.insertId;

      // Prepare item rows; unit defaults to 'PCS' to match schema default
      const values = items.map((i) => [
        purchaseId,
        Number(i.product_id),
        Number(i.rate || 0),
        Number(i.size || 0),
        i.unit || "PCS",
        "Active",
      ]);

      await conn.query(
        `INSERT INTO \`${itemsTable}\`
           (purchase_id, product_id, rate, size, unit, status)
         VALUES ?`,
        [values]
      );

      // Stock increment (global products table as per current design)
      for (const i of items) {
        const pid = Number(i.product_id);
        const inc = Number(i.size || 0);
        if (!Number.isFinite(pid) || pid <= 0)
          throw new Error(`Invalid product_id ${i.product_id}`);
        if (!Number.isFinite(inc) || inc < 0)
          throw new Error(`Invalid size for product ${i.product_id}`);

        const [prodRows] = await conn.query(
          `SELECT id, size FROM products WHERE id = ? FOR UPDATE`,
          [pid]
        );
        if (!prodRows.length) throw new Error(`product ${pid} not found`);

        const curr = Number(prodRows[0].size || 0);
        const newSize = curr + inc;
        await conn.query(`UPDATE products SET size = ? WHERE id = ?`, [
          newSize,
          pid,
        ]);
      }

      await conn.query("COMMIT");
      return { id: purchaseId, bill_img: bill_img || null };
    } catch (err) {
      try {
        await conn.query("ROLLBACK");
      } catch {}
      throw err;
    }
  },

  // UPDATE purchase header fields (no item diff here; keep parity with simple header updates)
  // If you need full diff + stock sync, use the controller's update flow.
  updateHeader: async (company_code, id, data) => {
    const code = normalize(company_code || "");
    if (!code) throw new Error("company_code required");

    const purchasesTable = tn(code, "purchases");
    const conn = db.promise();

    const {
      party_type,
      vendor_id,
      farmer_id,
      gst_no,
      bill_no,
      bill_date,
      status,
      total_amount,
      bill_img,
    } = data || {};

    const fields = [];
    const vals = [];
    const push = (col, val) => {
      fields.push(`${col} = ?`);
      vals.push(val);
    };

    if (party_type) {
      if (!["vendor", "farmer"].includes(String(party_type))) {
        throw new Error("party_type must be 'vendor' or 'farmer'");
      }
      push("party_type", party_type);
      push("vendor_id", party_type === "vendor" ? vendor_id ?? null : null);
      push("farmer_id", party_type === "farmer" ? farmer_id ?? null : null);
    } else {
      if (vendor_id !== undefined) push("vendor_id", vendor_id);
      if (farmer_id !== undefined) push("farmer_id", farmer_id);
    }

    if (gst_no !== undefined) push("gst_no", gst_no || null);
    if (bill_no !== undefined) push("bill_no", bill_no);
    if (bill_date !== undefined) {
      const d = toSQLDate(bill_date);
      if (bill_date && !d) throw new Error("Invalid bill_date");
      push("bill_date", d);
    }
    if (status !== undefined) push("status", status);
    if (total_amount !== undefined)
      push("total_amount", Number(total_amount || 0));
    if (bill_img !== undefined) push("bill_img", bill_img || null);

    if (!fields.length) return false;

    vals.push(id);

    await conn.query(
      `UPDATE \`${purchasesTable}\` SET ${fields.join(", ")} WHERE id = ?`,
      vals
    );

    return true;
  },

  // LIST purchases + items for tenant
  findAll: async (company_code) => {
    const code = normalize(company_code || "");
    if (!code) throw new Error("company_code required");

    const purchasesTable = tn(code, "purchases");
    const itemsTable = tn(code, "purchase_items");

    const conn = db.promise();

    const [purchases] = await conn.query(`
      SELECT
        p.id, p.bill_no, p.bill_date, p.total_amount, p.status, p.party_type, p.bill_img,
        v.vendor_name, v.firm_name, f.name AS farmer_name
      FROM \`${purchasesTable}\` p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN farmers f ON p.farmer_id = f.id
      ORDER BY p.id DESC
    `);

    if (purchases.length === 0) return [];

    const purchaseIds = purchases.map((p) => p.id);

    const [items] = await conn.query(
      `
      SELECT pi.*, pr.product_name
      FROM \`${itemsTable}\` pi
      JOIN products pr ON pi.product_id = pr.id
      WHERE pi.purchase_id IN (?)
      `,
      [purchaseIds]
    );

    return purchases.map((p) => {
      const party_name =
        p.party_type === "vendor" ? p.vendor_name : p.farmer_name;
      return {
        ...p,
        party_name,
        items: items.filter((i) => i.purchase_id === p.id),
      };
    });
  },

  // DETAIL by id for tenant
  findById: async (company_code, id) => {
    const code = normalize(company_code || "");
    if (!code) throw new Error("company_code required");

    const purchasesTable = tn(code, "purchases");
    const itemsTable = tn(code, "purchase_items");
    const conn = db.promise();

    const [rows] = await conn.query(
      `
      SELECT p.*, v.vendor_name, v.firm_name, f.name AS farmer_name
      FROM \`${purchasesTable}\` p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN farmers f ON p.farmer_id = f.id
      WHERE p.id = ?
    `,
      [id]
    );

    if (!rows.length) return null;

    const [items] = await conn.query(
      `
      SELECT pi.*, pr.product_name
      FROM \`${itemsTable}\` pi
      JOIN products pr ON pi.product_id = pr.id
      WHERE pi.purchase_id = ?
      `,
      [id]
    );

    const purchase = rows[0];
    const party_name =
      purchase.party_type === "vendor"
        ? purchase.vendor_name
        : purchase.farmer_name;

    return { ...purchase, party_name, items };
  },
};

module.exports = Purchase;
