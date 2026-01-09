const db = require("../config/db");

// number helper
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// safe query wrapper with context
const q = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        err.query = sql;
        err.params = params;
        return reject(err);
      }
      resolve([results]);
    });
  });

const SalesOrder = {
  create: async (data) => {
    const sql = `
    INSERT INTO \`sales_orders\`
    (\`so_no\`, \`party_type\`, \`party_id\`, \`buyer_type\`, \`date\`, 
     \`bill_time\`, \`address\`, \`mobile_no\`, \`gst_no\`,
     \`place_of_supply\`, \`terms_condition\`, \`other_amount\`, 
     \`other_note\`, \`total_amount\`, \`gst_amount\`, \`final_amount\`, \`status\`)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    const values = [
      data.so_no || "",
      data.party_type || "Customer",
      toNum(data.party_id),
      data.buyer_type || null,
      data.date || null,
      data.bill_time || null,
      data.address || "",
      data.mobile_no || "",
      data.gst_no || "",
      data.place_of_supply || "",
      data.terms_condition || "",
      toNum(data.other_amount || 0),
      data.other_note || "",
      toNum(data.total_amount),
      toNum(data.gst_amount),
      toNum(data.final_amount),
      data.status || "Issued",
    ];
    const [res] = await q(sql, values);
    return res;
  },

  getAllRaw: async () => {
    const sql = `
      SELECT
        so.id AS sales_order_id,
        so.so_no,
        so.party_type,
        so.party_id,
        so.date,
        so.bill_time,
        CASE
          WHEN so.party_type = 'Customer' THEN c.name
          WHEN so.party_type = 'Vendor' THEN v.firm_name
          WHEN so.party_type = 'Farmer' THEN f.name
        END AS party_name,
        so.address,
        so.mobile_no,
        so.gst_no,
        so.place_of_supply,
        so.terms_condition,
        so.total_amount  AS order_total,
        so.gst_amount    AS order_gst,
        so.final_amount  AS order_final,
        so.status,

        soi.id          AS item_id,
        soi.product_id,
        p.product_name,
        soi.hsn_code,
        soi.qty,
        soi.rate,
        soi.amount,
        soi.discount_per_qty,
        soi.discount_rate,
        soi.discount_total,
        soi.gst_percent,
        soi.gst_amount   AS item_gst,
        soi.final_amount AS item_final,
        soi.status       AS item_status,       -- FIX #2
        p.status         AS product_status     -- FIX #3
      FROM sales_orders so
      LEFT JOIN customers c ON c.id = so.party_id AND so.party_type = 'Customer'
      LEFT JOIN vendors v ON v.id = so.party_id AND so.party_type = 'Vendor'
      LEFT JOIN farmers f ON f.id = so.party_id AND so.party_type = 'Farmer'
      JOIN sales_order_items soi ON soi.sales_order_id = so.id
      JOIN products p ON p.id = soi.product_id
      WHERE (
        so.status IS NULL OR (so.status <> 'Inactive' AND so.status <> 'Completed' AND so.status <> 'Cancelled')
      )
      AND EXISTS (
        SELECT 1 FROM sales_order_items soi2
        WHERE soi2.sales_order_id = so.id
          AND (soi2.status IS NULL OR (soi2.status <> 'Inactive' AND soi2.status <> 'Cancelled'))
      )
      ORDER BY so.id DESC, soi.id ASC
    `;
    const [rows] = await q(sql);
    return rows;
  },

  getById: async (id) => {
    const sql = `SELECT * FROM sales_orders WHERE id = ?`;
    const [rows] = await q(sql, [toNum(id)]);
    return rows;
  },

  updateHeader: async (id, data) => {
    const sql = `
      UPDATE \`sales_orders\` SET
        \`so_no\` = ?,
        \`party_type\` = ?,
        \`party_id\` = ?,
        \`buyer_type\` = ?,
        \`date\` = ?,
        \`bill_time\` = ?,
        \`address\` = ?,
        \`mobile_no\` = ?,
        \`gst_no\` = ?,
        \`place_of_supply\` = ?,
        \`terms_condition\` = ?,
        \`other_amount\` = ?,
        \`other_note\` = ?,
        \`total_amount\` = ?,
        \`gst_amount\` = ?,
        \`final_amount\` = ?,
        \`status\` = ?
      WHERE \`id\` = ?
    `;
    const values = [
      data.so_no || "",
      data.party_type || "Customer",
      toNum(data.party_id),
      data.buyer_type || null,
      data.date || null,
      data.bill_time || null,
      data.address || "",
      data.mobile_no || "",
      data.gst_no || "",
      data.place_of_supply || "",
      data.terms_condition || "",
      toNum(data.other_amount || 0),
      data.other_note || "",
      toNum(data.total_amount),
      toNum(data.gst_amount),
      toNum(data.final_amount),
      data.status || "Issued",
      toNum(id),
    ];
    const [res] = await q(sql, values);
    return res;
  },

  delete: async (id) => {
    const sql = `DELETE FROM \`sales_orders\` WHERE \`id\` = ?`;
    const [res] = await q(sql, [toNum(id)]);
    return res;
  },

  // Add this method in SalesOrder model
  getByIdWithParty: async (id) => {
    const sql = `
      SELECT
        so.\`id\`,
        so.\`so_no\`,
        so.\`party_type\`,
        so.\`party_id\`,
        so.\`buyer_type\`,
        so.\`date\`,
        so.\`bill_time\`,
        so.\`address\`,
        so.\`mobile_no\`,
        so.\`gst_no\`,
        so.\`place_of_supply\`,
        so.\`terms_condition\`,
        so.\`other_amount\`,
        so.\`other_note\`,
        so.\`total_amount\`,
        so.\`gst_amount\`,
        so.\`final_amount\`,
        so.\`status\`,
        CASE
          WHEN so.\`party_type\` = 'Customer' THEN c.\`name\`
          WHEN so.\`party_type\` = 'Vendor' THEN v.\`vendor_name\`
          WHEN so.\`party_type\` = 'Farmer' THEN f.\`name\`
        END AS \`party_name\`,
        CASE
          WHEN so.\`party_type\` = 'Customer' THEN c.\`email\`
          WHEN so.\`party_type\` = 'Vendor' THEN v.\`contact_number\`
          WHEN so.\`party_type\` = 'Farmer' THEN f.\`contact_number\`
        END AS \`party_contact\`,
        CASE
          WHEN so.\`party_type\` = 'Customer' THEN c.\`address\`
          WHEN so.\`party_type\` = 'Vendor' THEN v.\`address\`
          WHEN so.\`party_type\` = 'Farmer' THEN CONCAT(f.\`village\`, ', ', f.\`district\`)
        END AS \`party_address\`,
        CASE
          WHEN so.\`party_type\` = 'Customer' THEN c.\`GST_No\`
          WHEN so.\`party_type\` = 'Vendor' THEN v.\`gst_no\`
          WHEN so.\`party_type\` = 'Farmer' THEN NULL
        END AS \`party_gst_no\`,
        CASE
          WHEN so.\`party_type\` = 'Customer' THEN c.\`balance\`
          WHEN so.\`party_type\` = 'Vendor' THEN v.\`balance\`
          WHEN so.\`party_type\` = 'Farmer' THEN f.\`balance\`
        END AS \`party_balance\`
      FROM \`sales_orders\` so
      LEFT JOIN \`customers\` c ON c.\`id\` = so.\`party_id\` AND so.\`party_type\` = 'Customer'
      LEFT JOIN \`vendors\` v ON v.\`id\` = so.\`party_id\` AND so.\`party_type\` = 'Vendor'
      LEFT JOIN \`farmers\` f ON f.\`id\` = so.\`party_id\` AND so.\`party_type\` = 'Farmer'
      WHERE so.\`id\` = ?
      LIMIT 1
    `;
    const [rows] = await q(sql, [toNum(id)]);
    return rows;
  },
};

module.exports = SalesOrder;
