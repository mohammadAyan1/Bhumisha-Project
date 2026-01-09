const db = require("../config/db");
function q(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.query(sql, params, (e, rows) => (e ? reject(e) : resolve(rows)))
  );
}
module.exports = {
  async create({
    code,
    name,
    address = null,
    gst_no = null,
    contact_no = null,
    email = null,
    owner_name = null,
    image_url = null,
    bank_detail_id = null,
  }) {
    await q(
      `INSERT INTO companies (code, name, address, gst_no, contact_no, email, owner_name, status, image_url, bank_detail_id)
       VALUES (?,?,?,?,?,?,?,'Active',?,?)`,
      [code, name, address, gst_no, contact_no, email, owner_name, image_url, bank_detail_id]
    );
    return { code };
  },
  async list() {
    return await q(`SELECT * FROM companies ORDER BY id DESC`);
  },
  async getByCode(code) {
    const rows = await q(
      `SELECT c.*, 
              b.pan_number   AS bank_pan_number,
              b.account_holder_name AS bank_account_holder_name,
              b.bank_name     AS bank_bank_name,
              b.account_number AS bank_account_number,
              b.ifsc_code     AS bank_ifsc_code,
              b.branch_name   AS bank_branch_name,
              b.upi_id        AS bank_upi_id
       FROM companies c
       LEFT JOIN company_bank_details b ON b.id = c.bank_detail_id
       WHERE c.code = ? LIMIT 1`,
      [code]
    );
    return rows && rows[0] ? rows[0] : null;
  },
  async update(id, data) {
    const allowed = new Set([
      "code",
      "name",
      "address",
      "gst_no",
      "contact_no",
      "email",
      "owner_name",
      "status",
      "image_url",
      "bank_detail_id",
    ]);
    const fields = [];
    const vals = [];
    Object.entries(data || {}).forEach(([k, v]) => {
      if (allowed.has(k)) {
        fields.push(`${k} = ?`);
        vals.push(v);
      }
    });
    if (!fields.length) return { affectedRows: 0 };
    vals.push(id);
    const res = await q(
      `UPDATE companies SET ${fields.join(", ")} WHERE id = ?`,
      vals
    );
    return res;
  },
  async createBankDetails({
    pan_number = null,
    account_holder_name = null,
    bank_name = null,
    account_number = null,
    ifsc_code = null,
    branch_name = null,
    upi_id = null,
  }) {
    const res = await q(
      `INSERT INTO company_bank_details (pan_number, account_holder_name, bank_name, account_number, ifsc_code, branch_name, upi_id)
       VALUES (?,?,?,?,?,?,?)`,
      [
        pan_number,
        account_holder_name,
        bank_name,
        account_number,
        ifsc_code,
        branch_name,
        upi_id,
      ]
    );
    return res;
  },
  async updateBankDetails(id, data) {
    const allowed = new Set([
      "pan_number",
      "account_holder_name",
      "bank_name",
      "account_number",
      "ifsc_code",
      "branch_name",
      "upi_id",
    ]);
    const fields = [];
    const vals = [];
    Object.entries(data || {}).forEach(([k, v]) => {
      if (allowed.has(k)) {
        fields.push(`${k} = ?`);
        vals.push(v);
      }
    });
    if (!fields.length) return { affectedRows: 0 };
    vals.push(id);
    return await q(
      `UPDATE company_bank_details SET ${fields.join(", ")} WHERE id = ?`,
      vals
    );
  },
};
