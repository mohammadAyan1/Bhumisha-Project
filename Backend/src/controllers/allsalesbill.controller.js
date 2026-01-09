const db = require("../config/db");

const allSalesBillController = {
  getAllSalesBillsWithItems: (req, res) => {
    try {
      const companies = req.body.data; // expect [{ code: '011' }, ...]

      if (!Array.isArray(companies) || companies.length === 0) {
        return res
          .status(400)
          .json({ message: "Invalid or empty company list" });
      }

      const allResults = [];
      let completed = 0;

      companies.forEach((company) => {
        const code = company.code;
        const tableItems = `sale_items_${code}`;
        const tableSales = `sales_${code}`;

        const query = `
          SELECT
            s.*,         
            si.*,        
            p.product_name,
            p.hsn_code,
            p.size,
            c.*,         
            v.id AS vendor_id, v.vendor_name AS vendor_name, v.firm_name AS vendor_firm_name, v.contact_number AS vendor_contact_number,
            f.id AS farmer_id, f.name AS farmer_name, f.contact_number AS farmer_contact_number,
            cu.id AS customer_id, cu.name AS customer_name, cu.phone AS customer_phone
          FROM \`${tableItems}\` AS si
          INNER JOIN \`${tableSales}\` AS s ON si.sale_id = s.id
          INNER JOIN products AS p ON si.product_id = p.id
          INNER JOIN categories AS c ON p.category_id = c.id
          LEFT JOIN vendors AS v ON s.vendor_id = v.id
          LEFT JOIN farmers AS f ON s.farmer_id = f.id
          LEFT JOIN customers AS cu ON s.customer_id = cu.id
          ORDER BY si.sale_id;
        `;

        db.query(query, (err, rows) => {
          completed++;

          if (err) {
            console.error(
              `Error fetching sales for company ${code}:`,
              err.message || err
            );
            allResults.push({
              companyCode: code,
              error: err.message || String(err),
            });
          } else {
            const grouped = {};

            rows.forEach((row) => {
              const saleId = row.sale_id || row.id || row.saleId;
              if (!grouped[saleId]) {
                // build sale-level object from row
                grouped[saleId] = {
                  companyCode: code,
                  sale_id: saleId,
                  saleDetails: { ...row },
                  customerDetails: row.customer_id
                    ? {
                        id: row.customer_id,
                        name: row.customer_name,
                        phone: row.customer_phone,
                      }
                    : null,
                  vendorDetails: row.vendor_id
                    ? {
                        id: row.vendor_id,
                        name: row.vendor_name,
                        firm_name: row.vendor_firm_name,
                        contact_number: row.vendor_contact_number,
                      }
                    : null,
                  farmerDetails: row.farmer_id
                    ? {
                        id: row.farmer_id,
                        name: row.farmer_name,
                        contact_number: row.farmer_contact_number,
                      }
                    : null,
                  categoryDetails: {
                    id: row.category_id,
                    name: row.name,
                  },
                  items: [],
                };
              }

              grouped[saleId].items.push({
                ...row, // contains sale_items columns
                product_name: row.product_name,
                hsn_code: row.hsn_code,
                size: row.size,
              });
            });

            allResults.push({
              companyCode: code,
              sales: Object.values(grouped),
            });
          }

          if (completed === companies.length) {
            res.json(allResults);
          }
        });
      });
    } catch (err) {
      console.error("Controller error (allsales):", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getAllSalesBillsWithItemsCurrentMonth: (req, res) => {
    try {
      const companies = req.body.data; // expect [{ code: '011' }, ...]

      if (!Array.isArray(companies) || companies.length === 0) {
        return res
          .status(400)
          .json({ message: "Invalid or empty company list" });
      }

      const allResults = [];
      let completed = 0;

      // Get current month and year
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

      companies.forEach((company) => {
        const code = company.code;
        const tableItems = `sale_items_${code}`;
        const tableSales = `sales_${code}`;

        // Option 1: Using MONTH() and YEAR() functions (Recommended)
        const query = `
        SELECT
          s.*,         
          si.*,        
          p.product_name,
          p.hsn_code,
          p.size,
          c.*,         
          v.id AS vendor_id, v.vendor_name AS vendor_name, v.firm_name AS vendor_firm_name, v.contact_number AS vendor_contact_number,
          f.id AS farmer_id, f.name AS farmer_name, f.contact_number AS farmer_contact_number,
          cu.id AS customer_id, cu.name AS customer_name, cu.phone AS customer_phone
        FROM \`${tableItems}\` AS si
        INNER JOIN \`${tableSales}\` AS s ON si.sale_id = s.id
        INNER JOIN products AS p ON si.product_id = p.id
        INNER JOIN categories AS c ON p.category_id = c.id
        LEFT JOIN vendors AS v ON s.vendor_id = v.id
        LEFT JOIN farmers AS f ON s.farmer_id = f.id
        LEFT JOIN customers AS cu ON s.customer_id = cu.id
        WHERE YEAR(s.bill_date) = ? AND MONTH(s.bill_date) = ?
        ORDER BY si.sale_id;
      `;

        // Option 2: Using DATE_FORMAT (alternative)
        // WHERE DATE_FORMAT(s.bill_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')

        // Option 3: Using BETWEEN for date range (alternative)
        // WHERE s.bill_date >= DATE_FORMAT(NOW(), '%Y-%m-01')
        // AND s.bill_date < DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')

        db.query(query, [currentYear, currentMonth], (err, rows) => {
          completed++;

          if (err) {
            console.error(
              `Error fetching sales for company ${code}:`,
              err.message || err
            );
            allResults.push({
              companyCode: code,
              error: err.message || String(err),
            });
          } else {
            const grouped = {};

            rows.forEach((row) => {
              const saleId = row.sale_id || row.id || row.saleId;
              if (!grouped[saleId]) {
                // build sale-level object from row
                grouped[saleId] = {
                  companyCode: code,
                  sale_id: saleId,
                  saleDetails: { ...row },
                  customerDetails: row.customer_id
                    ? {
                        id: row.customer_id,
                        name: row.customer_name,
                        phone: row.customer_phone,
                      }
                    : null,
                  vendorDetails: row.vendor_id
                    ? {
                        id: row.vendor_id,
                        name: row.vendor_name,
                        firm_name: row.vendor_firm_name,
                        contact_number: row.vendor_contact_number,
                      }
                    : null,
                  farmerDetails: row.farmer_id
                    ? {
                        id: row.farmer_id,
                        name: row.farmer_name,
                        contact_number: row.farmer_contact_number,
                      }
                    : null,
                  categoryDetails: {
                    id: row.category_id,
                    name: row.name,
                  },
                  items: [],
                };
              }

              grouped[saleId].items.push({
                ...row, // contains sale_items columns
                product_name: row.product_name,
                hsn_code: row.hsn_code,
                size: row.size,
              });
            });

            allResults.push({
              companyCode: code,
              sales: Object.values(grouped),
            });
          }

          if (completed === companies.length) {
            res.json(allResults);
          }
        });
      });
    } catch (err) {
      console.error("Controller error (allsales):", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = allSalesBillController;
