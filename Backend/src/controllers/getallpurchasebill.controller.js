const db = require("../config/db");

const getAllPurchasesBillController = {
  getAllPurchasesBills: (req, res) => {
    try {
      const companies = req.body.data; // [{ code: '011' }, { code: '012' }, ...]

      if (!Array.isArray(companies) || companies.length === 0) {
        return res
          .status(400)
          .json({ message: "Invalid or empty company list" });
      }

      const allResults = [];
      let completed = 0;

      companies.forEach((company) => {
        const code = company.code;
        const tableItems = `purchase_items_${code}`;
        const tablePurchases = `purchases_${code}`;

        const query = `
          SELECT
            pr.*,              -- all columns from purchases_<code>
            pi.*,              -- all columns from purchase_items_<code>
            p.product_name,
            p.hsn_code,
            c.*,               -- all category columns
            v.*,               -- all vendor columns
            f.*                -- all farmer columns
          FROM \`${tableItems}\` AS pi
          INNER JOIN \`${tablePurchases}\` AS pr ON pi.purchase_id = pr.id
          INNER JOIN products AS p ON pi.product_id = p.id
          INNER JOIN categories AS c ON p.category_id = c.id
          LEFT JOIN vendors AS v ON pr.vendor_id = v.id
          LEFT JOIN farmers AS f ON pr.farmer_id = f.id
          ORDER BY pi.purchase_id;
        `;

        db.query(query, (err, rows) => {
          completed++;

          if (err) {
            console.error(`❌ Error fetching data for company ${code}:`, err);
            allResults.push({
              companyCode: code,
              error: err.message,
            });
          } else {
            const grouped = {};

            rows.forEach((row) => {
              if (!grouped[row.purchase_id]) {
                grouped[row.purchase_id] = {
                  companyCode: code,
                  purchase_id: row.purchase_id,
                  purchaseDetails: { ...row }, // all purchase columns
                  vendorDetails: row.vendor_id
                    ? {
                        id: row.vendor_id,
                        ...row, // includes all vendor columns
                      }
                    : null,
                  farmerDetails: row.farmer_id
                    ? {
                        id: row.farmer_id,
                        ...row, // includes all farmer columns
                      }
                    : null,
                  categoryDetails: {
                    ...row, // all category columns
                  },
                  items: [],
                };
              }

              grouped[row.purchase_id].items.push({
                ...row, // all purchase_items columns
                product_name: row.product_name,
                hsn_code: row.hsn_code,
              });
            });

            allResults.push({
              companyCode: code,
              purchases: Object.values(grouped),
            });
          }

          if (completed === companies.length) {
            res.json(allResults);
          }
        });
      });
    } catch (err) {
      console.error("🔥 Controller error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = getAllPurchasesBillController;
