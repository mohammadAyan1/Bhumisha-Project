const SalesOrder = require("../models/salesOrder.model");
const SalesOrderItem = require("../models/salesOrderItem.model");

// numeric helper
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// calc same as PO (percent-per-qty of rate)
// const calcItem = (it) => {
//   const qty = toNum(it.qty);
//   const rate = toNum(it.rate);
//   const amount = qty * rate;

//   const discRatePerUnit = (rate * toNum(it.discount_per_qty)) / 100;
//   const discTotal = discRatePerUnit * qty;

//   const taxable = amount - discTotal;
//   const gst_amount = (taxable * toNum(it.gst_percent)) / 100;
//   const final_amount = taxable + gst_amount;

//   return {
//     amount: Number(amount.toFixed(2)),
//     discount_rate: Number(discRatePerUnit.toFixed(2)),
//     discount_total: Number(discTotal.toFixed(2)),
//     gst_amount: Number(gst_amount.toFixed(2)),
//     final_amount: Number(final_amount.toFixed(2)),
//   };
// };

// Helper function to convert quantity based on unit
const convertQuantityToBaseUnit = (quantity, unit) => {
  const qty = Number(quantity) || 0;
  switch (unit?.toLowerCase()) {
    case "ton":
      return qty * 1000; // Convert tons to KG
    case "quantal":
      return qty * 100; // Convert quantal to KG
    case "kg":
      return qty; // Already in KG
    case "gram":
      return qty / 1000; // Convert grams to KG
    case "pcs":
      return qty; // For pieces, assume 1 piece = 1 KG
    default:
      return qty; // Default to KG
  }
};

// Helper function to get unit conversion factor
const getUnitConversionFactor = (unit) => {
  switch (unit?.toLowerCase()) {
    case "ton":
      return 1000; // 1 ton = 1000 KG
    case "quantal":
      return 100; // 1 quantal = 100 KG
    case "kg":
      return 1; // Base unit
    case "gram":
      return 0.001; // 1 gram = 0.001 KG
    case "pcs":
      return 1; // 1 piece = 1 KG
    default:
      return 1;
  }
};

// Updated calcItem function
const calcItem = (item) => {
  const qty = Number(item?.qty || 0);
  const rate = Number(item?.rate || 0); // This should be rate per selected unit
  const discountPerQty = Number(item?.discount_per_qty || 0);
  const gstPercent = Number(item?.gst_percent || 0);
  const unit = item?.unit || "kg";

  // Convert quantity to KG based on unit
  let qtyInKg;
  switch (unit.toLowerCase()) {
    case "ton":
      qtyInKg = qty * 1000;
      break;
    case "quantal":
      qtyInKg = qty * 100;
      break;
    case "kg":
      qtyInKg = qty;
      break;
    case "gram":
      qtyInKg = qty / 1000;
      break;
    default:
      qtyInKg = qty; // Assume kg if unknown
  }

  // IMPORTANT: The rate should be per selected unit, not per kg
  // So we need to calculate the total amount based on qty and rate
  const amount = qtyInKg * rate; // This is correct: qty * rate per selected unit

  // Convert discount to appropriate unit if needed
  // Assuming discount_per_qty is a percentage, not unit-specific
  const discountTotal = (amount * discountPerQty) / 100;

  const taxableAmount = Math.max(amount - discountTotal, 0);
  const gstAmount = (taxableAmount * gstPercent) / 100;
  const finalAmount = taxableAmount + gstAmount;

  return {
    amount: Number(amount.toFixed(2)),
    discount_total: Number(discountTotal.toFixed(2)),
    taxable_amount: Number(taxableAmount.toFixed(2)),
    gst_amount: Number(gstAmount.toFixed(2)),
    final_amount: Number(finalAmount.toFixed(2)),
    qty_in_kg: Number(qtyInKg.toFixed(3)),
    rate_per_kg: unit === "kg" ? rate : rate / (qtyInKg / qty), // Rate per kg
    unit: unit,
  };
};

const salesOrderController = {
  // Create SO (header + items)
  create: async (req, res) => {
    try {
      const {
        so_no,
        party_type,
        party_id,
        buyer_type,
        date,
        bill_time,
        address,
        mobile_no,
        gst_no,
        place_of_supply,
        terms_condition,
        other_amount = 0,
        other_note = "",
        items = [],
        status,
      } = req.body;

      if (!party_type || !party_id)
        return res
          .status(400)
          .json({ error: "party_type and party_id are required" });
      if (!Array.isArray(items) || items.length === 0)
        return res.status(400).json({ error: "items are required" });

      // header totals from items
      let totalAmount = 0,
        totalGST = 0,
        finalAmount = 0;

      const computed = items.map((it) => {
        const c = calcItem(it);

        totalAmount += c.amount;
        totalGST += c.gst_amount;
        finalAmount += c.final_amount;
        return { raw: it, calc: c };
      });

      const header = {
        so_no,
        party_type,
        party_id: Number(party_id),
        buyer_type: buyer_type || null,
        date,
        bill_time,
        address: address || "",
        mobile_no: mobile_no || "",
        gst_no: gst_no || "",
        place_of_supply: place_of_supply || "",
        terms_condition: terms_condition || "",
        total_amount: Number(totalAmount.toFixed(2)),
        gst_amount: Number(totalGST.toFixed(2)),
        // include other amount in final
        final_amount: Number(
          (finalAmount + Math.max(0, Number(other_amount || 0))).toFixed(2)
        ),
        other_amount: Math.max(0, Number(other_amount || 0)),
        other_note: other_note || "",
        status: status || "Issued",
      };

      let headerResult;
      try {
        headerResult = await SalesOrder.create(header);
      } catch (e) {
        if (
          e.code === "ER_DUP_ENTRY" &&
          String(e.sqlMessage || "").includes("sales_orders.so_no")
        ) {
          return res.status(409).json({
            error: "SO number already exists. Please use a unique SO No.",
          });
        }
        throw e;
      }
      const sales_order_id = headerResult.insertId;

      // const createdItems = [];
      // for (const { raw } of computed) {
      //   // Generated columns DB me auto compute honge
      //   const data = {
      //     sales_order_id,
      //     product_id: Number(raw.product_id),
      //     hsn_code: raw.hsn_code || "",
      //     qty: Number(raw.qty || 0),
      //     rate: Number(raw.rate || 0),
      //     discount_per_qty: Number(raw.discount_per_qty || 0),
      //     gst_percent: Number(raw.gst_percent || 0),
      //     status: raw.status || "Active",
      //   };
      //   const itemRes = await SalesOrderItem.create(data);
      //   createdItems.push({ id: itemRes.insertId, ...data });
      // }

      // Create sales order items with all calculated fields
      const createdItems = [];
      for (const { raw, calc } of computed) {
        const data = {
          sales_order_id,
          product_id: Number(raw.product_id),
          hsn_code: raw.hsn_code || "",
          qty: Number(raw.qty || 0),
          rate: Number(raw.rate || 0), // Rate per unit (ton/kg/etc)
          unit: raw.unit || "kg", // Store the unit
          amount: calc.amount,
          discount_per_qty: Number(raw.discount_per_qty || 0),
          discount_total: calc.discount_total,
          discount_rate: calc.discount_total, // This might need adjustment based on your logic
          gst_percent: Number(raw.gst_percent || 0),
          gst_amount: calc.gst_amount,
          final_amount: calc.final_amount,
          status: raw.status || "Active",
          buyer_type: buyer_type?.toLowerCase() || "retailer", // Store buyer type
        };

        const itemRes = await SalesOrderItem.create(data);
        createdItems.push({
          id: itemRes.insertId,
          ...data,
          qty_in_kg: calc.qty_in_kg, // Store quantity in KG for reference
          rate_per_kg: calc.rate_per_kg, // Store rate per KG for reference
        });
      }

      return res.status(201).json({
        message: "Sales Order created successfully",
        sales_order: {
          id: sales_order_id,
          ...header,
          items: createdItems,
          summary: {
            total_taxable: Number(totalAmount.toFixed(2)),
            total_gst: Number(totalGST.toFixed(2)),
            grand_total: Number(
              (finalAmount + Math.max(0, Number(other_amount || 0))).toFixed(2)
            ),
          },
        },
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  },

  // Get all SOs (grouped + summary)
  getAll: async (_req, res) => {
    try {
      const rows = await SalesOrder.getAllRaw();
      const map = {};
      for (const r of rows) {
        const id = r.sales_order_id;
        if (!map[id]) {
          map[id] = {
            id,
            so_no: r.so_no,
            party_name: r.party_name,
            date: r.date,
            bill_time: r.bill_time,
            address: r.address,
            mobile_no: r.mobile_no,
            gst_no: r.gst_no,
            place_of_supply: r.place_of_supply,
            terms_condition: r.terms_condition,
            status: r.status,
            items: [],
            summary: { total_taxable: 0, total_gst: 0, grand_total: 0 },
          };
        }
        map[id].items.push({
          id: r.item_id,
          product_id: r.product_id,
          product_name: r.product_name,
          hsn_code: r.hsn_code,
          qty: Number(r.qty),
          rate: Number(r.rate),
          amount: Number(r.amount),
          discount_per_qty: Number(r.discount_per_qty),
          discount_rate: Number(r.discount_rate),
          discount_total: Number(r.discount_total),
          gst_percent: Number(r.gst_percent),
          gst_amount: Number(r.item_gst),
          final_amount: Number(r.item_final),
        });
        map[id].summary.total_taxable +=
          Number(r.amount) - Number(r.discount_total);
        map[id].summary.total_gst += Number(r.item_gst);
        map[id].summary.grand_total += Number(r.item_final);
      }
      const list = Object.values(map).map((x) => ({
        ...x,
        summary: {
          total_taxable: Number(x.summary.total_taxable.toFixed(2)),
          total_gst: Number(x.summary.total_gst.toFixed(2)),
          grand_total: Number(x.summary.grand_total.toFixed(2)),
        },
      }));
      return res.json(list);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  },

  // Get single SO (head + items + computed summary + full party details)
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const headRows = await SalesOrder.getByIdWithParty(id);
      if (headRows.length === 0)
        return res.status(404).json({ message: "SO not found" });

      const items = await SalesOrderItem.getBySOId(id);
      const summary = items.reduce(
        (a, it) => {
          a.total_taxable += Number(it.amount) - Number(it.discount_total);
          a.total_gst += Number(it.gst_amount);
          a.grand_total += Number(it.final_amount);
          return a;
        },
        { total_taxable: 0, total_gst: 0, grand_total: 0 }
      );

      const head = headRows[0];
      // Construct customer object from joined fields (for backward compatibility with invoice)
      const customer = {
        id: head.party_id,
        name: head.party_name,
        email: head.party_contact, // using contact as email for now
        phone: head.party_contact,
        address: head.party_address,
        gst_no: head.party_gst_no,
      };

      // Attach company from header code if available
      try {
        const { normalize } = require("../services/companyCode");
        const Company = require("../models/company.model");
        const code = normalize(
          req.headers["x-company-code"] || req.query.company_code || ""
        );
        if (code) {
          const company = await Company.getByCode(code);
          if (company) head.company = company;
        }
      } catch {}

      return res.json({
        ...head,
        customer,
        items,
        summary: {
          total_taxable: Number(summary.total_taxable.toFixed(2)),
          total_gst: Number(summary.total_gst.toFixed(2)),
          grand_total: Number(summary.grand_total.toFixed(2)),
        },
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  },

  // Update SO (header + replace items)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        so_no,
        party_type,
        party_id,
        buyer_type,
        date,
        bill_time,
        address,
        mobile_no,
        gst_no,
        place_of_supply,
        terms_condition,
        status,
        other_amount = 0,
        other_note = "",
        items = [],
      } = req.body;

      if (!party_type || !party_id)
        return res
          .status(400)
          .json({ error: "party_type and party_id are required" });
      if (!Array.isArray(items) || items.length === 0)
        return res.status(400).json({ error: "items are required" });

      // recompute header totals
      let totalAmount = 0,
        totalGST = 0,
        finalAmount = 0;
      const computed = items.map((it) => {
        const c = calcItem(it);
        totalAmount += c.amount - c.discount_total;
        totalGST += c.gst_amount;
        finalAmount += c.final_amount;
        return { raw: it, calc: c };
      });

      await SalesOrder.updateHeader(id, {
        so_no,
        party_type,
        party_id: Number(party_id),
        buyer_type: buyer_type || null,
        date,
        bill_time,
        address: address || "",
        mobile_no: mobile_no || "",
        gst_no: gst_no || "",
        place_of_supply: place_of_supply || "",
        terms_condition: terms_condition || "",
        total_amount: Number(totalAmount.toFixed(2)),
        gst_amount: Number(totalGST.toFixed(2)),
        final_amount: Number(
          (finalAmount + Math.max(0, Number(other_amount || 0))).toFixed(2)
        ),
        other_amount: Math.max(0, Number(other_amount || 0)),
        other_note: other_note || "",
        status: status || "Issued",
      });

      // Delete all existing items and recreate
      await SalesOrderItem.deleteBySOId(id);
      for (const { raw } of computed) {
        const data = {
          sales_order_id: id,
          product_id: Number(raw.product_id),
          hsn_code: raw.hsn_code || "",
          qty: Number(raw.qty || 0),
          rate: Number(raw.rate || 0),
          discount_per_qty: Number(raw.discount_per_qty || 0),
          gst_percent: Number(raw.gst_percent || 0),
          status: raw.status || "Active",
        };
        await SalesOrderItem.create(data);
      }

      return res.json({ message: "Sales Order updated successfully" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  },

  // Delete SO (items then header)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await SalesOrderItem.deleteBySOId(id);
      await SalesOrder.delete(id);
      return res.json({ message: "Sales Order deleted successfully" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  },

  // Get SO data formatted for creating a sale
  getForSale: async (req, res) => {
    try {
      const { id } = req.params;
      const headRows = await SalesOrder.getByIdWithParty(id);
      if (headRows.length === 0) {
        return res.status(404).json({ error: "Sales Order not found" });
      }

      const so = headRows[0];
      if (so.status === "Cancelled") {
        return res.status(400).json({ error: "Sales Order is cancelled" });
      }

      // Get items with product names
      const [itemRows] = await db.promise().query(
        `SELECT 
          i.id AS so_item_id,
          i.product_id,
          p.product_name AS item_name,
          COALESCE(i.hsn_code, p.hsn_code, '') AS hsn_code,
          i.qty,
          i.rate,
          i.discount_per_qty,
          i.gst_percent
        FROM sales_order_items i
        LEFT JOIN products p ON p.id = i.product_id
        WHERE i.sales_order_id = ? AND (i.status IS NULL OR i.status != 'Cancelled')`,
        [id]
      );

      // Format for sale creation
      const header = {
        party_type: so.party_type || "customer",
        party_id: so.party_id,
        buyer_type: so.buyer_type,
        address: so.address || "",
        mobile_no: so.mobile_no || "",
        gst_no: so.gst_no || "",
        place_of_supply: so.place_of_supply || "",
        terms_condition: so.terms_condition || "",
        party_name: so.party_name || "",
      };

      const items = itemRows.map((r) => ({
        so_item_id: r.so_item_id,
        product_id: r.product_id,
        item_name: r.item_name || "",
        hsn_code: r.hsn_code || "",
        qty: Number(r.qty || 0),
        pending_qty: Number(r.qty || 0), // For future: qty - sold_qty
        rate: Number(r.rate || 0),
        discount_per_qty: Number(r.discount_per_qty || 0),
        gst_percent: Number(r.gst_percent || 0),
      }));

      return res.json({ header, items });
    } catch (err) {
      console.error("getForSale error:", err);
      return res.status(500).json({
        message: "Internal server error",
        error: { message: err.message },
      });
    }
  },

  // Invoice payload (party join safe)
  // controllers/salesOrder.controller.js

  getInvoice: async (req, res) => {
    try {
      const { id } = req.params;

      // Deterministic head with party
      const headRows = await SalesOrder.getByIdWithParty(id);
      if (!headRows || headRows.length === 0) {
        return res.status(404).json({ message: "SO not found" });
      }
      const head = headRows[0];

      // Items
      const items = await SalesOrderItem.getBySOId(id);

      const summary = items.reduce(
        (a, it) => {
          a.total_taxable += Number(it.amount) - Number(it.discount_total);
          a.total_gst += Number(it.gst_amount);
          a.grand_total += Number(it.final_amount);
          return a;
        },
        { total_taxable: 0, total_gst: 0, grand_total: 0 }
      );

      // Attach company for invoice
      let company = null;
      try {
        const { normalize } = require("../services/companyCode");
        const Company = require("../models/company.model");
        const code = normalize(
          req.headers["x-company-code"] || req.query.company_code || ""
        );
        if (code) company = await Company.getByCode(code);
      } catch {}

      return res.json({
        invoiceNo: `SIN-${head.id}`,
        date: head.date,
        party: {
          name: head.party_name || "",
          address: head.party_address,
          gst_no: head.party_gst_no,
        },
        company,
        other_amount: Number(head.other_amount || 0),
        other_note: head.other_note || "",
        buyer_type: head.buyer_type || null,
        items,
        summary: {
          total_taxable: Number(summary.total_taxable.toFixed(2)),
          total_gst: Number(summary.total_gst.toFixed(2)),
          grand_total: Number(
            (summary.grand_total + Number(head.other_amount || 0)).toFixed(2)
          ),
        },
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  },
};

module.exports = salesOrderController;
