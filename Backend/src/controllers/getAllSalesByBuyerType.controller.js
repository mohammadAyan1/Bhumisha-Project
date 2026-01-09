const db = require("../config/db");

const allsalesByBuyerType = {
  getAllRetailSales: (req, res) => {
    try {
      const companies = req.body.data;
      const buyerType = req.params.type || "retailer"; // ← get buyer type from URL

      if (!Array.isArray(companies) || companies.length === 0) {
        return res
          .status(400)
          .json({ message: "Invalid or empty company list" });
      }

      const results = [];
      let completed = 0;

      // ⬅ GLOBAL totals
      let grandTotalSales = 0;
      let grandTotalCost = 0;

      companies.forEach((company) => {
        const code = company.code;

        const tableSales = `sales_${code}`;
        const tableItems = `sale_items_${code}`;

        // 🚀 SELECT CUSTOMER, VENDOR, FARMER DATA ALSO
        const query = `
            SELECT 
              s.id AS sale_id,
              s.buyer_type,
              si.net_total,
              si.product_detail,

              c.id AS customer_id,
              c.name AS customer_name,
              c.phone AS customer_phone,
              c.address AS customer_address,
              c.firm_name AS customer_firm,

              v.id AS vendor_id,
              v.vendor_name,
              v.firm_name AS vendor_firm,
              v.contact_number AS vendor_contact,
              v.address AS vendor_address,

              f.id AS farmer_id,
              f.name AS farmer_name,
              f.village AS farmer_village,
              f.contact_number AS farmer_contact
              
            FROM \`${tableSales}\` AS s
            LEFT JOIN \`${tableItems}\` AS si ON si.sale_id = s.id
            LEFT JOIN customers AS c ON c.id = s.customer_id
            LEFT JOIN vendors AS v ON v.id = s.vendor_id
            LEFT JOIN farmers AS f ON f.id = s.farmer_id
            WHERE s.buyer_type = ?
        `;

        db.query(query, [buyerType], (err, rows) => {
          completed++;

          if (err) {
            results.push({ companyCode: code, error: err.message });
          } else {
            let totalSales = 0;
            let totalCost = 0; // ⬅ cost_rate * qty sum
            let totalMarginPercent = 0;
            let marginCount = 0;

            const productDetailsList = [];
            const peopleDetails = {}; // customer/vendor/farmer

            rows.forEach((row) => {
              // SUM net_total
              totalSales += Number(row.net_total || 0);
              grandTotalSales += Number(row.net_total || 0);

              // Save customer/vendor/farmer details once
              if (!peopleDetails.customer && row.customer_id) {
                peopleDetails.customer = {
                  id: row.customer_id,
                  name: row.customer_name,
                  phone: row.customer_phone,
                  address: row.customer_address,
                  firm: row.customer_firm,
                };
              }

              if (!peopleDetails.vendor && row.vendor_id) {
                peopleDetails.vendor = {
                  id: row.vendor_id,
                  name: row.vendor_name,
                  contact: row.vendor_contact,
                  firm: row.vendor_firm,
                  address: row.vendor_address,
                };
              }

              if (!peopleDetails.farmer && row.farmer_id) {
                peopleDetails.farmer = {
                  id: row.farmer_id,
                  name: row.farmer_name,
                  village: row.farmer_village,
                  contact: row.farmer_contact,
                };
              }

              // product details
              try {
                let detail = {};

                if (typeof row.product_detail === "string") {
                  // parse only when it's string
                  try {
                    detail = JSON.parse(row.product_detail);
                  } catch (err) {
                    console.error("JSON Parse Error:", err);
                    detail = {};
                  }
                } else if (
                  typeof row.product_detail === "object" &&
                  row.product_detail !== null
                ) {
                  // already object
                  detail = row.product_detail;
                }

                const qty = Number(detail.qty || 0);
                const rate = Number(detail.rate || 0);
                const costRate = Number(detail.productsDetails?.cost_rate || 0);

                // SUM cost_rate * qty
                totalCost += costRate * qty;

                grandTotalCost += costRate * qty;

                // Margin %
                let marginPercent = 0;
                if (costRate > 0) {
                  marginPercent = ((rate - costRate) / costRate) * 100;
                }

                totalMarginPercent++;
                marginCount++;

                productDetailsList.push({
                  qty,
                  rate,
                  cost_rate: costRate,
                  net_cost: costRate * qty,
                  margin_percent: Number(marginPercent.toFixed(2)),
                });

                // ⬅ Add to GLOBAL total
              } catch (e) {
                console.error("JSON Parse Error:", e);
              }
            });

            const avgMargin =
              marginCount > 0 ? totalMarginPercent / marginCount : 0;

            results.push({
              companyCode: code,
              buyer_type: buyerType,
              totalSales: Number(totalSales.toFixed(2)),
              totalCost: Number(totalCost.toFixed(2)), // ⬅ cost_rate * qty sum
              averageMarginPercent: Number(avgMargin.toFixed(2)),
              products: productDetailsList,
              people: peopleDetails, // ⬅ customer, vendor, farmer
            });
          }

          if (completed === companies.length) {
            return res.json({
              data: results,
              total: {
                totalCost: Number(grandTotalCost.toFixed(2)), // ⬅ cost_rate * qty sum,
                totalSales: Number(grandTotalSales.toFixed(2)),
              },
            });
          }
        });
      });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getAllGstAmount: (req, res) => {
    const companies = req.body.data;

    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ message: "Invalid or empty company list" });
    }

    const results = [];
    let completed = 0;

    companies.forEach((company) => {
      const code = company.code;
      const tableItems = `sale_items_${code}`;

      const query = `
      SELECT 
        si.gst_amount,
        si.product_detail
      FROM \`${tableItems}\` AS si
    `;

      db.query(query, (err, rows) => {
        completed++;

        if (err) {
          results.push({ companyCode: code, error: err.message });
        } else {
          let tableGstTotal = 0; // sum of gst_amount column
          let productGstTotal = 0; // sum of calculated gst from JSON

          rows.forEach((row) => {
            // Sum table gst_amount
            tableGstTotal += Number(row.gst_amount || 0);

            // Parse product_detail JSON
            let p = {};
            try {
              if (typeof row.product_detail === "string") {
                p = JSON.parse(row.product_detail);
              } else if (row.product_detail) {
                p = row.product_detail;
              }
            } catch (e) {
              console.error("JSON parse error", e);
            }

            const qty = Number(p.qty || 0);
            const rate = Number(p.rate || 0);

            // gst percent from inside product_detail or inside productsDetails
            const gstPercent =
              Number(p.gst_percent || 0) ||
              Number(p.productsDetails?.gst_percent || 0);

            // GST = (rate * qty * gstPercent) / 100
            const gstAmount = (rate * qty * gstPercent) / 100;

            productGstTotal += gstAmount;
          });

          results.push({
            companyCode: code,
            gst_from_table: Number(tableGstTotal.toFixed(2)),
            gst_from_product_detail: Number(productGstTotal.toFixed(2)),
          });
        }

        if (completed === companies.length) {
          return res.json({
            data: results,
            total: {
              totalGstFromTable: Number(
                results
                  .reduce((sum, r) => sum + (r.gst_from_table || 0), 0)
                  .toFixed(2)
              ),
              totalGstFromProducts: Number(
                results
                  .reduce((sum, r) => sum + (r.gst_from_product_detail || 0), 0)
                  .toFixed(2)
              ),
            },
          });
        }
      });
    });
  },
};

module.exports = allsalesByBuyerType;
