import React, { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import salesAPI from "../../axios/salesAPI";
import { soApi } from "../../axios/soApi.js";
import { useLocation } from "react-router-dom";
import customersAPI from "../../axios/customerAPI";
import vendorAPI from "../../axios/vendorsAPI";
import farmerAPI from "../../axios/farmerAPI";
import productsAPI from "../../axios/productAPI";
import { useNavigate } from "react-router-dom";

// Unit conversion constants (to grams)
const UNIT_CONVERSIONS = {
  ton: 1000000, // 1 ton = 1,000,000 grams
  quantal: 100000, // 1 quantal = 100,000 grams
  kg: 1000, // 1 kg = 1,000 grams
  gram: 1, // 1 gram = 1 gram
  pcs: 1, // Default for pieces
};

// Helper function to convert grams to selected unit
const convertFromGrams = (grams, unit) => {
  if (!unit || !UNIT_CONVERSIONS[unit.toLowerCase()]) return grams / 1000; // Default to kg
  return grams / UNIT_CONVERSIONS[unit.toLowerCase()];
};

// Helper function to convert from selected unit to grams
const convertToGrams = (quantity, unit) => {
  if (!unit || !UNIT_CONVERSIONS[unit.toLowerCase()]) return quantity * 1000; // Default to kg
  return quantity * UNIT_CONVERSIONS[unit.toLowerCase()];
};

// Helper function to convert grams to KG (for display only)
const convertGramsToKG = (grams) => {
  const g = Number(grams) || 0;
  return g / 1000; // Convert grams to KG
};

// Helper function to convert unit to KG for calculations
const convertUnitToKG = (quantity, unit) => {
  const qty = Number(quantity) || 0;
  switch (unit.toLowerCase()) {
    case "ton":
      return qty * 1000; // 1 ton = 1,000 KG
    case "quantal":
      return qty * 100; // 1 quantal = 100 KG
    case "kg":
      return qty; // Already in KG
    case "litter":
      return qty; // Already in KG
    case "gram":
      return qty / 1000; // Convert grams to KG
    case "pcs":
      return qty; // For pieces, assume 1 piece = 1 kg for calculations
    default:
      return qty; // Assume already in KG
  }
};

export default function SalesForm({
  sale = null,
  isEditMode = false,
  onSubmitted = null,
}) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productDataWithoutChange, setProductDataWithoutChange] = useState({});

  const navigate = useNavigate();

  const emptyRow = {
    product_id: "",
    item_name: "",
    hsn_code: "",
    available_grams: 0, // Available quantity in grams
    available_display: 0, // Available quantity in KG for display
    qty: 1,
    qty_in_kg: 0, // Quantity in kg for calculations
    cost_rate: 0, // Cost per kg
    rate: 0, // Rate per kg (always per kg)
    manualRate: false,
    d1_percent: 0,
    gst_percent: 0,
    unit: "",
    discount_25: 0,
    discount_30: 0,
    discount_50: 0,
    total_50: 0,
    product_unit: "", // Product's base unit from database
  };

  const [header, setHeader] = useState({
    sale_no: "",
    date: new Date().toISOString().split("T")[0],
    party_type: "customer",
    customer_id: "",
    vendor_id: "",
    farmer_id: "",
    address: "",
    mobile_no: "",
    gst_no: "",
    terms_condition: "",
    payment_status: "Unpaid",
    payment_method: "None",
    status: "Active",
    old_remaining: 0,
    cash_received: 0,
    party_balance: 0,
    party_min_balance: 0,
    buyer_type: "Retailer",
    other_amount: 0,
    other_note: "",
  });
  const [rows, setRows] = useState([{ ...emptyRow }]);
  const [errors, setErrors] = useState({ header: {}, rows: {} });
  const [fullPay, setFullPay] = useState(false);

  const headerRefs = {
    date: useRef(null),
    cash_received: useRef(null),
    sale_no: useRef(null),
  };

  const fx = (n, d = 2) => (isNaN(n) ? (0).toFixed(d) : Number(n).toFixed(d));
  const ceil2 = (v) => Math.ceil((Number(v) || 0) * 100) / 100;

  const parseGst = (g) => {
    const v = Number(g);
    return Number.isFinite(v) ? v : 0;
  };

  const getMarginPercentByQty = (qty, buyerType) => {
    const q = Number(qty) || 0;

    // If buyer is retailer, always return 50% margin
    if (buyerType === "Retailer") {
      return 50;
    }

    // For wholesalers, use quantity-based logic
    if (q >= 10) return 25; // 25% for quantity >= 10
    if (q >= 5) return 30; // 30% for quantity between 5-10

    return 50; // Default 50% for quantity < 5
  };

  const useCostMargin = true;
  const comapanyName = localStorage.getItem("company_code") || "";

  // Read so query param
  const location = useLocation();
  const soId = new URLSearchParams(location.search).get("so");

  const recomputeSellingRate = (row, buyerType = header.buyer_type) => {
    // Convert quantity to kg for margin calculation
    const qtyInKg = convertUnitToKG(Number(row.qty || 0), row.unit);
    const base = Number(row.cost_rate) || 0; // this is product.value (base cost per kg)

    if (useCostMargin && !row.manualRate) {
      const bt = String(buyerType).toLowerCase();
      const isWholesale =
        bt === "whole saler" || bt === "wholesaler" || bt === "wholesale";

      if (isWholesale) {
        // Wholesaler logic based on quantity
        if (qtyInKg >= 10) {
          // 25% margin for quantity >= 10
          return base * 1.25;
        } else if (qtyInKg >= 5) {
          // 30% margin for quantity between 5-10
          return base * 1.3;
        } else {
          // For quantity < 5, use default 50% margin
          return base * 1.5;
        }
      } else {
        // Retailer - always 50% margin
        return base * 1.5;
      }
    }
    return row.rate || 0; // rate is always per kg now
  };

  const calc = (r) => {
    // Convert quantity from selected unit to KG
    const qtyInKg = convertUnitToKG(Number(r.qty || 0), r.unit);
    const ratePerKg = Number(r.rate || 0); // Rate is always per kg now

    // Calculate base amount: qty in kg * rate per kg
    const base = qtyInKg * ratePerKg;
    const perUnitDisc = (ratePerKg * (Number(r.d1_percent) || 0)) / 100;
    const totalDisc = qtyInKg * perUnitDisc;
    const taxable = Math.max(base - totalDisc, 0);
    const gstAmt = (taxable * (Number(r.gst_percent) || 0)) / 100;
    const final = taxable + gstAmt;

    return { base, perUnitDisc, totalDisc, taxable, gstAmt, final, qtyInKg };
  };

  // useEffect(() => {
  //   let mounted = true;

  //   const init = async () => {
  //     try {
  //       setLoading(true);

  //       const companyCode = localStorage.getItem("company_code");
  //       if (!companyCode) {
  //         Swal.fire({
  //           icon: "error",
  //           title: "Company not selected",
  //           text: "Please select a company first",
  //         });
  //         return;
  //       }

  //       // load lookups in parallel
  //       const [custRes, vendRes, farmRes, prodRes] = await Promise.all([
  //         customersAPI.getAll(),
  //         vendorAPI.getAll(),
  //         farmerAPI.getAll(),
  //         productsAPI.getAll(),
  //       ]);

  //       const allCustomers = custRes?.data || [];
  //       const allVendors = vendRes?.data || [];
  //       const allFarmers = farmRes?.data || [];

  //       if (!mounted) return;

  //       setCustomers(allCustomers);
  //       setVendors(allVendors);
  //       setFarmers(allFarmers);

  //       const normalized = (prodRes?.data || []).map((p) => ({
  //         id: p.id,
  //         product_name: p.product_name,
  //         hsn_code: p.hsn_code || "",
  //         available_grams: Number(p.size || 0), // Store in grams
  //         // use base value as cost, discounts as absolute margin amounts, and keep total (50% margin) if provided
  //         cost_rate: Number(p.value ?? p.total ?? 0), // Cost per kg
  //         gst_percent: parseGst(p.gst),
  //         discount_25: Number(p.discount_25 || 0),
  //         discount_30: Number(p.discount_30 || 0),
  //         discount_50: Number(p.discount_50 || 0),
  //         total_50: Number(p.total || 0),
  //         unit: p.unit || "kg", // Product's base unit
  //         raw: p,
  //       }));

  //       setProducts(normalized);

  //       // Edit mode: populate from existing sale
  //       if (isEditMode && sale) {
  //         const normalizedDate = sale.bill_date
  //           ? new Date(sale.bill_date).toISOString().split("T")[0]
  //           : new Date().toISOString().split("T")[0];
  //         const party_type = sale.party_type || "customer";

  //         const selectedCustomer = allCustomers.find(
  //           (c) => Number(c.id) === Number(sale.customer_id)
  //         );
  //         const selectedVendor = allVendors.find(
  //           (v) => Number(v.id) === Number(sale.vendor_id)
  //         );
  //         const selectedFarmer = allFarmers.find(
  //           (f) => Number(f.id) === Number(sale.farmer_id)
  //         );

  //         const phone =
  //           party_type === "customer"
  //             ? selectedCustomer?.phone
  //             : party_type === "vendor"
  //             ? selectedVendor?.contact_number
  //             : selectedFarmer?.contact_number;
  //         const address =
  //           party_type === "customer"
  //             ? selectedCustomer?.address || sale.address || ""
  //             : party_type === "vendor"
  //             ? selectedVendor?.address || sale.address || ""
  //             : sale.address || "";
  //         const gst =
  //           party_type === "customer"
  //             ? selectedCustomer?.gst_no || selectedCustomer?.GST_No || ""
  //             : party_type === "vendor"
  //             ? selectedVendor?.gst_no || ""
  //             : "";

  //         setHeader((prev) => ({
  //           ...prev,
  //           sale_no: sale.bill_no || "",
  //           date: normalizedDate,
  //           party_type,
  //           customer_id: sale.customer_id || "",
  //           vendor_id: sale.vendor_id || "",
  //           farmer_id: sale.farmer_id || "",
  //           address: address || "",
  //           mobile_no: phone || "",
  //           gst_no: gst,
  //           terms_condition: sale.remarks || "",
  //           payment_status: sale.payment_status || "Unpaid",
  //           payment_method: sale.payment_method || "None",
  //           status: sale.status || "Active",
  //           old_remaining: 0,
  //           cash_received: Number(sale.paid_amount || 0),
  //           other_amount: Number(sale.other_amount || 0),
  //           other_note: sale.other_note || "",
  //           party_balance: Number(sale.party_balance ?? 0),
  //           party_min_balance: Number(sale.party_min_balance ?? 0),
  //         }));

  //         const mapped = (sale.items || []).map((r) => {
  //           const product = normalized.find(
  //             (p) => Number(p.id) === Number(r.product_id)
  //           );
  //           const unit = r.unit || product?.unit || "kg";
  //           const availableGrams = product?.available_grams || 0;

  //           return {
  //             product_id: r.product_id,
  //             item_name: product?.product_name || r.item_name || "",
  //             hsn_code: product?.hsn_code || r.hsn_code || "",
  //             available_grams: availableGrams,
  //             available_display: convertGramsToKG(availableGrams), // Show in KG
  //             qty: Number(r.qty) || 1,
  //             qty_in_kg: convertUnitToKG(Number(r.qty) || 0, unit),
  //             cost_rate: Number(product?.cost_rate ?? 0),
  //             rate: Number(r.rate ?? 0), // Rate is always per kg now
  //             manualRate: true,
  //             d1_percent: Number(r.discount_rate) || 0,
  //             gst_percent: Number(r.gst_percent ?? product?.gst_percent ?? 0),
  //             unit: unit,
  //             product_unit: product?.unit || "kg",
  //             discount_25: Number(product?.discount_25 || 0),
  //             discount_30: Number(product?.discount_30 || 0),
  //             discount_50: Number(product?.discount_50 || 0),
  //             total_50: Number(product?.total_50 || 0),
  //           };
  //         });

  //         setRows(mapped.length ? mapped : [{ ...emptyRow }]);

  //         // fetch previous due for selected party (if customer/vendor/farmer)
  //         try {
  //           if (sale.customer_id && !isEditMode) {
  //             const { data } = await salesAPI.getPartyPreviousDue(
  //               "customer",
  //               sale.customer_id
  //             );
  //             setHeader((p) => ({
  //               ...p,
  //               old_remaining: Number(data?.previous_due || 0),
  //             }));
  //           }
  //         } catch (error) {
  //           console.error("Failed to fetch previous due:", error);
  //           setHeader((p) => ({ ...p, old_remaining: 0 }));
  //         }

  //         // Create from Sales Order: populate header & rows from SO
  //       } else if (soId) {
  //         try {
  //           const [soRes, newBillRes] = await Promise.all([
  //             soApi.get(soId),
  //             salesAPI.getNewBillNo(),
  //           ]);

  //           const so = soRes?.data;
  //           const newBillNo = newBillRes?.data;
  //           const normalizedDate = new Date().toISOString().split("T")[0];

  //           const partyType = so.party_type
  //             ? so.party_type.toLowerCase()
  //             : "customer";
  //           let selectedParty = null;

  //           if (partyType === "customer") {
  //             selectedParty = allCustomers.find(
  //               (c) => Number(c.id) === Number(so.party_id)
  //             );
  //           } else if (partyType === "vendor") {
  //             selectedParty = allVendors.find(
  //               (v) => Number(v.id) === Number(so.party_id)
  //             );
  //           } else if (partyType === "farmer") {
  //             selectedParty = allFarmers.find(
  //               (f) => Number(f.id) === Number(so.party_id)
  //             );
  //           }

  //           // Fallback to sales order party details if selectedParty is not found
  //           const address =
  //             selectedParty?.address || so.party_address || so.address || "";
  //           const mobile_no =
  //             selectedParty?.phone ||
  //             selectedParty?.contact_number ||
  //             so.party_contact ||
  //             so.mobile_no ||
  //             "";
  //           const gst_no =
  //             selectedParty?.gst_no ||
  //             selectedParty?.GST_No ||
  //             so.party_gst_no ||
  //             so.gst_no ||
  //             "";

  //           setHeader((prev) => ({
  //             ...prev,
  //             sale_no: newBillNo?.bill_no || "",
  //             date: normalizedDate,
  //             party_type: partyType,
  //             customer_id: partyType === "customer" ? so.party_id : "",
  //             vendor_id: partyType === "vendor" ? so.party_id : "",
  //             farmer_id: partyType === "farmer" ? so.party_id : "",
  //             address: address,
  //             mobile_no: mobile_no,
  //             gst_no: gst_no,
  //             terms_condition: so.terms_condition || "",
  //             payment_status: "Unpaid",
  //             payment_method: "None",
  //             status: "Active",
  //             old_remaining: 0,
  //             cash_received: 0,
  //             buyer_type: so.buyer_type || "Retailer",
  //             party_balance: Number(selectedParty?.balance ?? 0),
  //             party_min_balance: Number(selectedParty?.min_balance ?? 0),
  //             other_amount: Number(so.other_amount || 0),
  //             other_note: so.other_note || "",
  //           }));

  //           const mapped = (so.items || []).map((r) => {
  //             const product = normalized.find(
  //               (p) => Number(p.id) === Number(r.product_id)
  //             );
  //             const unit = r.unit || product?.unit || "kg";
  //             const availableGrams = product?.available_grams || 0;

  //             return {
  //               product_id: r.product_id,
  //               item_name: product?.product_name || r.item_name || "",
  //               hsn_code: product?.hsn_code || r.hsn_code || "",
  //               available_grams: availableGrams,
  //               available_display: convertGramsToKG(availableGrams), // Show in KG
  //               qty: Number(r.qty) || 1,
  //               qty_in_kg: convertUnitToKG(Number(r.qty) || 0, unit),
  //               cost_rate: Number(product?.cost_rate ?? 0),
  //               rate: Number(r.rate ?? 0), // Rate is always per kg now
  //               manualRate: true,
  //               d1_percent: Number(r.discount_per_qty) || 0,
  //               gst_percent: Number(r.gst_percent ?? product?.gst_percent ?? 0),
  //               unit: unit,
  //               product_unit: product?.unit || "kg",
  //               discount_25: Number(product?.discount_25 || 0),
  //               discount_30: Number(product?.discount_30 || 0),
  //               discount_50: Number(product?.discount_50 || 0),
  //               total_50: Number(product?.total_50 || 0),
  //             };
  //           });

  //           setRows(mapped.length ? mapped : [{ ...emptyRow }]);
  //         } catch (e) {
  //           console.error("Failed to load sales order:", e);
  //           Swal.fire({
  //             icon: "error",
  //             title: "Error",
  //             text: "Failed to load sales order data",
  //           });
  //           setRows([{ ...emptyRow }]);
  //         }

  //         // New blank sale
  //       } else {
  //         const { data } = await salesAPI.getNewBillNo();
  //         setHeader((prev) => ({
  //           ...prev,
  //           sale_no: data?.bill_no || "",
  //           date: new Date().toISOString().split("T")[0],
  //           payment_status: "Unpaid",
  //           payment_method: "None",
  //           status: "Active",
  //           old_remaining: 0,
  //           cash_received: 0,
  //           party_type: "customer",
  //           customer_id: "",
  //           vendor_id: "",
  //           farmer_id: "",
  //           party_balance: 0,
  //           party_min_balance: 0,
  //           address: "",
  //           mobile_no: "",
  //           gst_no: "",
  //         }));
  //         setRows([{ ...emptyRow }]);
  //       }
  //     } catch (e) {
  //       console.error("Error initializing sale form:", e);
  //       Swal.fire({
  //         icon: "error",
  //         title: "Failed to load",
  //         text: "Failed to load form data",
  //       });
  //     } finally {
  //       if (mounted) setLoading(false);
  //     }
  //   };

  //   init();
  //   return () => {
  //     mounted = false;
  //   };
  // }, [isEditMode, sale, location.search]);

  // In your SalesForm component, update the initialization logic
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);

        const companyCode = localStorage.getItem("company_code");
        if (!companyCode) {
          Swal.fire({
            icon: "error",
            title: "Company not selected",
            text: "Please select a company first",
          });
          return;
        }

        // load lookups in parallel
        const [custRes, vendRes, farmRes, prodRes] = await Promise.all([
          customersAPI.getAll(),
          vendorAPI.getAll(),
          farmerAPI.getAll(),
          productsAPI.getAll(),
        ]);

        const allCustomers = custRes?.data || [];
        const allVendors = vendRes?.data || [];
        const allFarmers = farmRes?.data || [];

        if (!mounted) return;

        setCustomers(allCustomers);
        setVendors(allVendors);
        setFarmers(allFarmers);

        const normalized = (prodRes?.data || []).map((p) => ({
          id: p.id,
          product_name: p.product_name,
          hsn_code: p.hsn_code || "",
          available_grams: Number(p.size || 0),
          cost_rate: Number(p.value ?? p.total ?? 0),
          gst_percent: parseGst(p.gst),
          discount_25: Number(p.discount_25 || 0),
          discount_30: Number(p.discount_30 || 0),
          discount_50: Number(p.discount_50 || 0),
          total_50: Number(p.total || 0),
          unit: p.unit || "kg",
          raw: p,
        }));

        setProducts(normalized);

        // Edit mode: populate from existing sale
        if (isEditMode && sale) {
          const normalizedDate = sale.bill_date
            ? new Date(sale.bill_date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
          const party_type = sale.party_type || "customer";

          const selectedCustomer = allCustomers.find(
            (c) => Number(c.id) === Number(sale.customer_id)
          );
          const selectedVendor = allVendors.find(
            (v) => Number(v.id) === Number(sale.vendor_id)
          );
          const selectedFarmer = allFarmers.find(
            (f) => Number(f.id) === Number(sale.farmer_id)
          );

          const phone =
            party_type === "customer"
              ? selectedCustomer?.phone
              : party_type === "vendor"
              ? selectedVendor?.contact_number
              : selectedFarmer?.contact_number;
          const address =
            party_type === "customer"
              ? selectedCustomer?.address || sale.address || ""
              : party_type === "vendor"
              ? selectedVendor?.address || sale.address || ""
              : sale.address || "";
          const gst =
            party_type === "customer"
              ? selectedCustomer?.gst_no || selectedCustomer?.GST_No || ""
              : party_type === "vendor"
              ? selectedVendor?.gst_no || ""
              : "";

          setHeader((prev) => ({
            ...prev,
            sale_no: sale.bill_no || "",
            date: normalizedDate,
            party_type,
            customer_id: sale.customer_id || "",
            vendor_id: sale.vendor_id || "",
            farmer_id: sale.farmer_id || "",
            address: address || "",
            mobile_no: phone || "",
            gst_no: gst,
            terms_condition: sale.remarks || "",
            payment_status: sale.payment_status || "Unpaid",
            payment_method: sale.payment_method || "None",
            status: sale.status || "Active",
            old_remaining: 0,
            cash_received: Number(sale.paid_amount || 0),
            other_amount: Number(sale.other_amount || 0),
            other_note: sale.other_note || "",
            party_balance: Number(sale.party_balance ?? 0),
            party_min_balance: Number(sale.party_min_balance ?? 0),
          }));

          const mapped = (sale.items || []).map((r) => {
            const product = normalized.find(
              (p) => Number(p.id) === Number(r.product_id)
            );
            const unit = r.unit || product?.unit || "kg";
            const availableGrams = product?.available_grams || 0;

            return {
              product_id: r.product_id,
              item_name: product?.product_name || r.item_name || "",
              hsn_code: product?.hsn_code || r.hsn_code || "",
              available_grams: availableGrams,
              available_display: convertGramsToKG(availableGrams),
              qty: Number(r.qty) || 1,
              qty_in_kg: convertUnitToKG(Number(r.qty) || 0, unit),
              cost_rate: Number(product?.cost_rate ?? 0),
              rate: Number(r.rate ?? 0),
              manualRate: true,
              d1_percent: Number(r.discount_rate) || 0,
              gst_percent: Number(r.gst_percent ?? product?.gst_percent ?? 0),
              unit: unit,
              product_unit: product?.unit || "kg",
              discount_25: Number(product?.discount_25 || 0),
              discount_30: Number(product?.discount_30 || 0),
              discount_50: Number(product?.discount_50 || 0),
              total_50: Number(product?.total_50 || 0),
            };
          });

          setRows(mapped.length ? mapped : [{ ...emptyRow }]);

          // fetch previous due for selected party (if customer/vendor/farmer)
          try {
            if (sale.customer_id && !isEditMode) {
              const { data } = await salesAPI.getPartyPreviousDue(
                "customer",
                sale.customer_id
              );
              setHeader((p) => ({
                ...p,
                old_remaining: Number(data?.previous_due || 0),
              }));
            }
          } catch (error) {
            console.error("Failed to fetch previous due:", error);
            setHeader((p) => ({ ...p, old_remaining: 0 }));
          }

          // Create from Sales Order
        } else if (soId) {
          try {
            const soRes = await soApi.get(soId);
            const so = soRes?.data;
            const normalizedDate = new Date().toISOString().split("T")[0];

            const partyType = so.party_type
              ? so.party_type.toLowerCase()
              : "customer";
            let selectedParty = null;

            if (partyType === "customer") {
              selectedParty = allCustomers.find(
                (c) => Number(c.id) === Number(so.party_id)
              );
            } else if (partyType === "vendor") {
              selectedParty = allVendors.find(
                (v) => Number(v.id) === Number(so.party_id)
              );
            } else if (partyType === "farmer") {
              selectedParty = allFarmers.find(
                (f) => Number(f.id) === Number(so.party_id)
              );
            }

            const address =
              selectedParty?.address || so.party_address || so.address || "";
            const mobile_no =
              selectedParty?.phone ||
              selectedParty?.contact_number ||
              so.party_contact ||
              so.mobile_no ||
              "";
            const gst_no =
              selectedParty?.gst_no ||
              selectedParty?.GST_No ||
              so.party_gst_no ||
              so.gst_no ||
              "";

            setHeader((prev) => ({
              ...prev,
              sale_no: "", // Empty initially - will be generated on save
              date: normalizedDate,
              party_type: partyType,
              customer_id: partyType === "customer" ? so.party_id : "",
              vendor_id: partyType === "vendor" ? so.party_id : "",
              farmer_id: partyType === "farmer" ? so.party_id : "",
              address: address,
              mobile_no: mobile_no,
              gst_no: gst_no,
              terms_condition: so.terms_condition || "",
              payment_status: "Unpaid",
              payment_method: "None",
              status: "Active",
              old_remaining: 0,
              cash_received: 0,
              buyer_type: so.buyer_type || "Retailer",
              party_balance: Number(selectedParty?.balance ?? 0),
              party_min_balance: Number(selectedParty?.min_balance ?? 0),
              other_amount: Number(so.other_amount || 0),
              other_note: so.other_note || "",
            }));

            const mapped = (so.items || []).map((r) => {
              const product = normalized.find(
                (p) => Number(p.id) === Number(r.product_id)
              );
              const unit = r.unit || product?.unit || "kg";
              const availableGrams = product?.available_grams || 0;

              return {
                product_id: r.product_id,
                item_name: product?.product_name || r.item_name || "",
                hsn_code: product?.hsn_code || r.hsn_code || "",
                available_grams: availableGrams,
                available_display: convertGramsToKG(availableGrams),
                qty: Number(r.qty) || 1,
                qty_in_kg: convertUnitToKG(Number(r.qty) || 0, unit),
                cost_rate: Number(product?.cost_rate ?? 0),
                rate: Number(r.rate ?? 0),
                manualRate: true,
                d1_percent: Number(r.discount_per_qty) || 0,
                gst_percent: Number(r.gst_percent ?? product?.gst_percent ?? 0),
                unit: unit,
                product_unit: product?.unit || "kg",
                discount_25: Number(product?.discount_25 || 0),
                discount_30: Number(product?.discount_30 || 0),
                discount_50: Number(product?.discount_50 || 0),
                total_50: Number(product?.total_50 || 0),
              };
            });

            setRows(mapped.length ? mapped : [{ ...emptyRow }]);
          } catch (e) {
            console.error("Failed to load sales order:", e);
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to load sales order data",
            });
            setRows([{ ...emptyRow }]);
          }

          // New blank sale
        } else {
          setHeader((prev) => ({
            ...prev,
            sale_no: "", // Empty initially - will be generated on save
            date: new Date().toISOString().split("T")[0],
            payment_status: "Unpaid",
            payment_method: "None",
            status: "Active",
            old_remaining: 0,
            cash_received: 0,
            party_type: "customer",
            customer_id: "",
            vendor_id: "",
            farmer_id: "",
            party_balance: 0,
            party_min_balance: 0,
            address: "",
            mobile_no: "",
            gst_no: "",
          }));
          setRows([{ ...emptyRow }]);
        }
      } catch (e) {
        console.error("Error initializing sale form:", e);
        Swal.fire({
          icon: "error",
          title: "Failed to load",
          text: "Failed to load form data",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, [isEditMode, sale, location.search]);

  useEffect(() => {
    setRows((prev) =>
      prev.map((r) => {
        if (useCostMargin && !r.manualRate) {
          const newRate = recomputeSellingRate(r, header.buyer_type);
          return { ...r, rate: newRate };
        }
        return r;
      })
    );
  }, [header.buyer_type]);

  // const onPartyTypeChange = async (e) => {
  //   const val = e.target.value;
  //   // Reset party-specific fields
  //   setHeader((p) => ({
  //     ...p,
  //     party_type: val,
  //     customer_id: "",
  //     vendor_id: "",
  //     farmer_id: "",
  //     address: "",
  //     mobile_no: "",
  //     gst_no: "",
  //     party_balance: 0,
  //     party_min_balance: 0,
  //     old_remaining: 0,
  //     cash_received: 0,
  //     date: p.date || new Date().toISOString().split("T")[0],
  //   }));

  //   // Ensure a fresh sale number exists after type change
  //   try {
  //     const { data } = await salesAPI.getNewBillNo();
  //     if (!data?.bill_no) {
  //       throw new Error("Failed to get new bill number");
  //     }
  //     setHeader((p) => ({ ...p, sale_no: data.bill_no }));
  //   } catch (error) {
  //     console.error("Failed to get new bill number:", error);
  //     Swal.fire({
  //       icon: "error",
  //       title: "Error",
  //       text: "Failed to get new bill number. Please try again.",
  //     });
  //   }
  // };

  const onPartyTypeChange = async (e) => {
    const val = e.target.value;
    // Reset party-specific fields
    setHeader((p) => ({
      ...p,
      party_type: val,
      customer_id: "",
      vendor_id: "",
      farmer_id: "",
      address: "",
      mobile_no: "",
      gst_no: "",
      party_balance: 0,
      party_min_balance: 0,
      old_remaining: 0,
      cash_received: 0,
      date: p.date || new Date().toISOString().split("T")[0],
      sale_no: "", // Clear bill number on party type change
    }));
  };

  const onPartyChange = async (e) => {
    const id = e.target.value;
    const type = header.party_type;
    if (type === "customer") {
      const c = customers.find((x) => String(x.id) === String(id));
      setHeader((p) => ({
        ...p,
        customer_id: id,
        vendor_id: "",
        farmer_id: "",
        address: c?.address || "",
        mobile_no: c?.phone || "",
        gst_no: c?.gst_no || c?.GST_No || "",
        party_balance: Number(c?.balance ?? 0),
        party_min_balance: Number(c?.min_balance ?? 0),
      }));
      if (id) {
        try {
          const { data } = await salesAPI.getPartyPreviousDue("customer", id);
          setHeader((p) => ({
            ...p,
            old_remaining: Number(data?.previous_due || 0),
            cash_received: 0,
          }));
        } catch {
          setHeader((p) => ({ ...p, old_remaining: 0, cash_received: 0 }));
        }
      }
    } else if (type === "vendor") {
      const v = vendors.find((x) => String(x.id) === String(id));
      setHeader((p) => ({
        ...p,
        vendor_id: id,
        customer_id: "",
        farmer_id: "",
        address: v?.address || "",
        mobile_no: v?.contact_number || "",
        gst_no: v?.gst_no || "",
        party_balance: Number(v?.balance ?? 0),
        party_min_balance: Number(v?.min_balance ?? 0),
        old_remaining: 0,
        cash_received: 0,
      }));
      if (id) {
        try {
          const { data } = await salesAPI.getPartyPreviousDue("vendor", id);
          setHeader((p) => ({
            ...p,
            old_remaining: Number(data?.previous_due || 0),
            cash_received: 0,
          }));
        } catch {
          setHeader((p) => ({ ...p, old_remaining: 0, cash_received: 0 }));
        }
      }
    } else {
      const f = farmers.find((x) => String(x.id) === String(id));
      setHeader((p) => ({
        ...p,
        farmer_id: id,
        customer_id: "",
        vendor_id: "",
        address: "",
        mobile_no: f?.contact_number || "",
        gst_no: "",
        party_balance: Number(f?.balance ?? 0),
        party_min_balance: Number(f?.min_balance ?? 0),
        old_remaining: 0,
        cash_received: 0,
      }));
      if (id) {
        try {
          const { data } = await salesAPI.getPartyPreviousDue("farmer", id);
          setHeader((p) => ({
            ...p,
            old_remaining: Number(data?.previous_due || 0),
            cash_received: 0,
          }));
        } catch {
          setHeader((p) => ({ ...p, old_remaining: 0, cash_received: 0 }));
        }
      }
    }
  };

  const onHeader = async (e) => {
    let { name, value } = e.target;
    if (name === "cash_received") value = value === "" ? "" : Number(value);
    if (name === "cash_received") setFullPay(false);
    setHeader((p) => ({ ...p, [name]: value }));
    setErrors((er) => ({ ...er, header: { ...er.header, [name]: false } }));
  };

  const onRow = (i, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      const numeric = ["qty", "rate", "d1_percent", "gst_percent", "cost_rate"];
      let v = value;
      if (numeric.includes(field)) v = value === "" ? 0 : Number(value);
      next[i] = { ...next[i], [field]: v };

      setErrors((er) => ({
        ...er,
        rows: { ...er.rows, [i]: { ...(er.rows[i] || {}), [field]: false } },
      }));

      if (field === "product_id") {
        const product = products.find((p) => String(p.id) === String(value));

        setProductDataWithoutChange((prev) => ({
          ...prev,
          [product.id]: {
            ...product,
            timestamp: Date.now(),
          },
        }));

        if (product) {
          next[i].item_name = product.product_name || "";
          next[i].hsn_code = product.hsn_code || "";
          next[i].cost_rate = Number(product.cost_rate || 0);
          next[i].gst_percent = Number(product.gst_percent || 0);
          next[i].available_grams = Number(product.available_grams || 0);
          next[i].product_unit = product.unit || "kg";
          next[i].unit = product.unit || "kg";
          next[i].discount_25 = Number(product.discount_25 || 0);
          next[i].discount_30 = Number(product.discount_30 || 0);
          next[i].discount_50 = Number(product.discount_50 || 0);
          next[i].total_50 = Number(product.total_50 || 0);
          next[i].qty = 1;
          next[i].d1_percent = 0;
          next[i].manualRate = false;

          // Convert available grams to KG for display
          next[i].available_display = convertGramsToKG(next[i].available_grams);

          // Calculate qty_in_kg for the initial qty
          next[i].qty_in_kg = convertUnitToKG(next[i].qty, next[i].unit);

          // Set initial rate (always per kg) - use current buyer_type
          const initialRate = recomputeSellingRate(
            {
              ...next[i],
              cost_rate: product.cost_rate,
              qty: 1,
              manualRate: false,
            },
            header.buyer_type
          );
          next[i].rate = initialRate;
        }
      }

      if (field === "qty") {
        const availInSelectedUnit = convertFromGrams(
          next[i].available_grams || 0,
          next[i].unit
        );
        let q = Number(value || 0);

        // Validate quantity doesn't exceed available
        if (q > availInSelectedUnit) {
          q = availInSelectedUnit;
          Swal.fire({
            icon: "info",
            title: "Stock limit",
            text: `Qty limited to available stock (${fx(
              availInSelectedUnit,
              3
            )} ${next[i].unit})`,
          });
        }

        next[i].qty = q;
        next[i].qty_in_kg = convertUnitToKG(q, next[i].unit);

        // Recalculate rate if using cost margin and not manual
        if (useCostMargin && !next[i].manualRate) {
          const newRate = recomputeSellingRate(next[i], header.buyer_type);
          next[i].rate = newRate;
        }
      }

      if (field === "rate") {
        next[i].manualRate = true;
      }

      if (field === "cost_rate") {
        // Recalculate rate if using cost margin and not manual
        if (useCostMargin && !next[i].manualRate) {
          const newRate = recomputeSellingRate(next[i], header.buyer_type);
          next[i].rate = newRate;
        }
      }

      // When unit changes, update qty_in_kg and recalculate if needed
      if (field === "unit") {
        const oldUnit = next[i].unit;
        next[i].unit = value;

        // Convert quantity if it was entered in old unit
        if (
          next[i].qty > 0 &&
          oldUnit &&
          oldUnit !== "" &&
          value &&
          value !== ""
        ) {
          const qtyInKg = convertUnitToKG(next[i].qty, oldUnit);
          next[i].qty_in_kg = qtyInKg;
        }

        // Validate quantity doesn't exceed available in new unit
        const availInSelectedUnit = convertFromGrams(
          next[i].available_grams || 0,
          value
        );
        if (next[i].qty > availInSelectedUnit) {
          next[i].qty = availInSelectedUnit;
          next[i].qty_in_kg = convertUnitToKG(availInSelectedUnit, value);
          Swal.fire({
            icon: "info",
            title: "Stock limit",
            text: `Qty limited to available stock (${fx(
              availInSelectedUnit,
              3
            )} ${value})`,
          });
        }

        // Recalculate rate after unit change if needed
        if (useCostMargin && !next[i].manualRate) {
          const newRate = recomputeSellingRate(next[i], header.buyer_type);
          next[i].rate = newRate;
        }
      }

      // Handle buyer_type change for this specific row (if needed)
      if (field === "manualRate" && value === false) {
        // If user unchecks manual rate, recalculate based on current settings
        const newRate = recomputeSellingRate(next[i], header.buyer_type);
        next[i].rate = newRate;
      }

      return next;
    });
  };

  const totals = useMemo(
    () =>
      rows.reduce(
        (a, r) => {
          const c = calc(r);
          a.base += c.base;
          a.disc += c.totalDisc;
          a.taxable += c.taxable;
          a.gst += c.gstAmt;
          a.final += c.final;
          a.totalQtyKg += c.qtyInKg;
          return a;
        },
        { base: 0, disc: 0, taxable: 0, gst: 0, final: 0, totalQtyKg: 0 }
      ),
    [rows]
  );

  const saleTotal =
    Number(totals.final || 0) + Math.max(0, Number(header.other_amount || 0));
  const netDue = Math.max(
    Number(
      (
        Number(header.old_remaining || 0) +
        saleTotal -
        Number(header.cash_received || 0)
      ).toFixed(2)
    ),
    0
  );

  // Keep cash_received synced to full due when Full Pay is active
  useEffect(() => {
    if (!fullPay) return;
    const full = Number(header.old_remaining || 0) + Number(saleTotal || 0);
    setHeader((p) => ({ ...p, cash_received: Number(full.toFixed(2)) }));
  }, [fullPay, saleTotal, header.old_remaining]);

  // const validateHeader = () => {
  //   const req = ["date", "sale_no"];
  //   if (header.party_type === "customer") req.push("customer_id");
  //   if (header.party_type === "vendor") req.push("vendor_id");
  //   if (header.party_type === "farmer") req.push("farmer_id");
  //   const newErr = {};
  //   let firstKey = null;
  //   req.forEach((k) => {
  //     const miss = !header[k];
  //     newErr[k] = miss;
  //     if (miss && !firstKey) firstKey = k;
  //   });
  //   setErrors((er) => ({ ...er, header: { ...er.header, ...newErr } }));
  //   return firstKey;
  // };

  const validateHeader = () => {
    const req = ["date"]; // Removed "sale_no"
    if (header.party_type === "customer") req.push("customer_id");
    if (header.party_type === "vendor") req.push("vendor_id");
    if (header.party_type === "farmer") req.push("farmer_id");
    const newErr = {};
    let firstKey = null;
    req.forEach((k) => {
      const miss = !header[k];
      newErr[k] = miss;
      if (miss && !firstKey) firstKey = k;
    });
    setErrors((er) => ({ ...er, header: { ...er.header, ...newErr } }));
    return firstKey;
  };

  const validateRows = () => {
    let first = { rowIdx: null, field: null };
    const newRowsErr = {};
    rows.forEach((r, i) => {
      const rowErr = {};
      if (!r.product_id) {
        rowErr.product_id = true;
        if (first.rowIdx === null) first = { rowIdx: i, field: "product_id" };
      }
      if (!(Number(r.qty) > 0)) {
        rowErr.qty = true;
        if (first.rowIdx === null) first = { rowIdx: i, field: "qty" };
      }
      if (!(Number(r.rate) > 0)) {
        rowErr.rate = true;
        if (first.rowIdx === null) first = { rowIdx: i, field: "rate" };
      }
      newRowsErr[i] = rowErr;
    });
    setErrors((er) => ({ ...er, rows: { ...er.rows, ...newRowsErr } }));
    return first.rowIdx !== null ? first : null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const missingHeaderKey = validateHeader();
    if (missingHeaderKey) {
      Swal.fire({
        icon: "error",
        title: "Header missing",
        text: `Please fill ${missingHeaderKey.replace("_", " ")}`,
      });
      headerRefs[missingHeaderKey]?.current?.focus?.();
      return;
    }
    const firstBad = validateRows();
    if (firstBad) {
      Swal.fire({
        icon: "error",
        title: "Item row missing",
        text: `Please fill row ${firstBad.rowIdx + 1} - ${firstBad.field}`,
      });
      return;
    }

    try {
      setLoading(true);

      // Validate stock for all rows
      const stockErrors = [];
      rows.forEach((r, i) => {
        const qtyInGrams = convertToGrams(Number(r.qty || 0), r.unit);
        if (qtyInGrams > Number(r.available_grams || 0)) {
          stockErrors.push(`Row ${i + 1}: Quantity exceeds available stock`);
        }
      });

      if (stockErrors.length > 0) {
        Swal.fire({
          icon: "error",
          title: "Stock exceeded",
          html: stockErrors.join("<br>"),
        });
        setLoading(false);
        return;
      }

      const derivedPaymentStatus =
        netDue <= 0
          ? "Paid"
          : Number(header.cash_received || 0) > 0
          ? "Partial"
          : "Unpaid";

      const payload = {
        party_type: header.party_type,
        customer_id:
          header.party_type === "customer" ? header.customer_id : null,
        vendor_id: header.party_type === "vendor" ? header.vendor_id : null,
        farmer_id: header.party_type === "farmer" ? header.farmer_id : null,
        bill_no: header.sale_no,
        bill_date: header.date,
        buyer_type: header.buyer_type || "Retailer",
        status: header.status || "Active",
        payment_status: derivedPaymentStatus,
        payment_method: header.payment_method || "None",
        remarks: header.terms_condition || "",
        other_amount: Number(header.other_amount || 0),
        other_note: header.other_note || "",
        company_id: comapanyName,
        cash_received: Number(header.cash_received || 0),
        linked_so_id: soId ? Number(soId) : null,
        items: rows.map((r) => ({
          productsDetails: r,
          product_id: r.product_id,
          qty: Number(r.qty),
          qty_in_grams: convertToGrams(Number(r.qty || 0), r.unit), // Send quantity in grams for stock deduction
          discount_rate: Number(r.d1_percent || 0),
          gst_percent: Number(r.gst_percent || 0),
          unit: r.unit || "kg",
          rate: Number(r.rate || 0), // Rate is always per kg now
          display_rate: Number(r.rate || 0), // Same as rate since it's always per kg
          salesProductItemDetails: productDataWithoutChange,
        })),
      };

      // If user clicked Full Pay, force exact full payment and Paid status
      if (fullPay) {
        const fullAmt = ceil2(
          Number(header.old_remaining || 0) + Number(saleTotal || 0)
        );
        payload.cash_received = fullAmt;
        payload.payment_status = "Paid";
      }

      if (isEditMode) {
        await salesAPI.update(sale.id, payload);
        await Swal.fire({
          icon: "success",
          title: "Sale updated",
          text: "Sale updated successfully",
          confirmButtonColor: "#2563eb",
        });
      } else {
        const { data: result } = await salesAPI.create(payload);
        await Swal.fire({
          icon: "success",
          title: "Sale created",
          html: `
            <div style="text-align:left">
              <div>Old Due: <b>${Number(result?.previous_due || 0).toFixed(
                2
              )}</b></div>
              <div>Sale Total: <b>${Number(result?.total_amount || 0).toFixed(
                2
              )}</b></div>
              <div>Cash Received: <b>${Number(
                result?.cash_received || 0
              ).toFixed(2)}</b></div>
              <div>New Due: <b>${Number(result?.new_due || 0).toFixed(
                2
              )}</b></div>
              <div>Status: <b>${result?.payment_status || "-"}</b></div>
            </div>
          `,
          confirmButtonColor: "#2563eb",
        });
      }

      // Reset but prefill new sale number and today's date for next entry
      // const today = new Date().toISOString().split("T")[0];
      // let nextBill = "";
      // try {
      //   const { data } = await salesAPI.getNewBillNo();
      //   nextBill = data?.bill_no || "";
      // } catch (err) {
      //   console.error(err);
      // }

      // setHeader({
      //   sale_no: "",
      //   date: today,
      //   party_type: "customer",
      //   customer_id: "",
      //   vendor_id: "",
      //   farmer_id: "",
      //   address: "",
      //   mobile_no: "",
      //   gst_no: "",
      //   terms_condition: "",
      //   payment_status: "Unpaid",
      //   payment_method: "None",
      //   status: "Active",
      //   old_remaining: 0,
      //   cash_received: 0,
      //   party_balance: 0,
      //   party_min_balance: 0,
      //   buyer_type: "Retailer",
      //   other_amount: 0,
      //   other_note: "",
      // });

      // Reset but prefill new sale number and today's date for next entry
      const today = new Date().toISOString().split("T")[0];
      setHeader({
        sale_no: "", // Empty - will be generated on next save
        date: today,
        party_type: "customer",
        customer_id: "",
        vendor_id: "",
        farmer_id: "",
        address: "",
        mobile_no: "",
        gst_no: "",
        terms_condition: "",
        payment_status: "Unpaid",
        payment_method: "None",
        status: "Active",
        old_remaining: 0,
        cash_received: 0,
        party_balance: 0,
        party_min_balance: 0,
        buyer_type: "Retailer",
        other_amount: 0,
        other_note: "",
      });
      setRows([{ ...emptyRow }]);
      setErrors({ header: {}, rows: {} });
      onSubmitted && onSubmitted();
      setFullPay(false);

      // set sale_no separately to avoid clobbering by sync batching
      // if (nextBill) setHeader((p) => ({ ...p, sale_no: nextBill }));
      // setRows([{ ...emptyRow }]);
      // setErrors({ header: {}, rows: {} });
      // onSubmitted && onSubmitted();
      // setFullPay(false);

      if (soId) {
        navigate("sales-orders");
      }
    } catch (e2) {
      Swal.fire({
        icon: "error",
        title: "Failed to save",
        text: e2?.response?.data?.error || "Failed to save sale",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  const errClass = "border-red-500 ring-1 ring-red-400";

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white shadow-lg rounded-xl p-6 mb-6"
    >
      <h2 className="text-xl font-bold mb-4">
        {isEditMode ? "Update Sale" : "Create Sale"}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Payment Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Old Remaining</span>
                <span className="font-semibold">
                  {fx(header.old_remaining)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Sale Total</span>
                <span className="font-semibold">{fx(saleTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Due After Pay</span>
                <span className="text-base font-semibold">{fx(netDue)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">
                    Transport Charges
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="border rounded-lg p-2"
                    value={
                      header.other_amount === 0 ? "" : header?.other_amount
                    }
                    onChange={(e) => {
                      const v = Math.max(0, Number(e.target.value || 0));
                      setHeader((h) => ({ ...h, other_amount: v }));
                    }}
                    onBlur={(e) => {
                      const v = Math.max(0, Number(e.target.value || 0));
                      setHeader((h) => ({
                        ...h,
                        other_amount: Number(v.toFixed(2)),
                      }));
                    }}
                    placeholder="e.g. 100"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600">Remark</label>
                  <input
                    className="border rounded-lg p-2"
                    value={header.other_note}
                    onChange={(e) =>
                      setHeader((h) => ({ ...h, other_note: e.target.value }))
                    }
                    placeholder="e.g. Transportation"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Status</span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                    netDue <= 0
                      ? "bg-green-100 text-green-700"
                      : Number(header.cash_received || 0) > 0
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {netDue <= 0
                    ? "Paid"
                    : Number(header.cash_received || 0) > 0
                    ? "Partial"
                    : "Unpaid"}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Party</span>
                  <span className="text-xs text-gray-800">
                    {(() => {
                      if (header.party_type === "customer") {
                        const c = customers.find(
                          (x) => Number(x.id) === Number(header.customer_id)
                        );
                        return c?.name || "-";
                      } else if (header.party_type === "vendor") {
                        const v = vendors.find(
                          (x) => Number(x.id) === Number(header.vendor_id)
                        );
                        return v?.vendor_name || v?.name || "-";
                      } else {
                        const f = farmers.find(
                          (x) => Number(x.id) === Number(header.farmer_id)
                        );
                        return f?.name || "-";
                      }
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Paid Amount</span>
                  <span className="text-xs text-gray-800">
                    {fx(header.cash_received)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-xl shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label htmlFor="date" className="text-sm text-gray-600 mb-1">
                  Date
                </label>
                <input
                  id="date"
                  ref={headerRefs.date}
                  type="date"
                  className={`border p-2 rounded-lg ${
                    errors.header.date ? errClass : ""
                  }`}
                  value={header.date}
                  onChange={(e) =>
                    onHeader({
                      target: { name: "date", value: e.target.value },
                    })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Party Type</label>
                <select
                  className="border p-2 rounded-lg"
                  value={header.party_type}
                  onChange={onPartyTypeChange}
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                  <option value="farmer">Farmer</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  {header.party_type === "customer"
                    ? "Customer"
                    : header.party_type === "vendor"
                    ? "Firm/Vendor"
                    : "Farmer"}
                </label>
                <select
                  className={`border p-2 rounded-lg ${
                    errors.header[
                      header.party_type === "customer"
                        ? "customer_id"
                        : header.party_type === "vendor"
                        ? "vendor_id"
                        : "farmer_id"
                    ]
                      ? errClass
                      : ""
                  }`}
                  value={
                    header.party_type === "customer"
                      ? header.customer_id
                      : header.party_type === "vendor"
                      ? header.vendor_id
                      : header.farmer_id
                  }
                  onChange={onPartyChange}
                >
                  <option value="">Select</option>
                  {(header.party_type === "customer"
                    ? customers
                    : header.party_type === "vendor"
                    ? vendors
                    : farmers
                  ).map((p) => (
                    <option key={p.id} value={p.id}>
                      {header.party_type === "vendor"
                        ? p.firm_name || p.name
                        : p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Mobile No.</label>
                <input
                  className="border p-2 rounded-lg"
                  placeholder="Mobile"
                  value={header.mobile_no}
                  onChange={(e) =>
                    setHeader((p) => ({ ...p, mobile_no: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">GST No.</label>
                <input
                  className="border p-2 rounded-lg"
                  placeholder="GST No."
                  value={header.gst_no}
                  onChange={(e) =>
                    setHeader((p) => ({ ...p, gst_no: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Address</label>
                <input
                  className="border p-2 rounded-lg"
                  placeholder="Address"
                  value={header.address}
                  onChange={(e) =>
                    setHeader((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Paid Amount
                </label>
                <input
                  id="cash_received"
                  ref={headerRefs.cash_received}
                  type="number"
                  min={0}
                  step="0.01"
                  className="border border-gray-300 rounded-lg p-2"
                  value={header.cash_received}
                  onChange={(e) => {
                    const maxVal =
                      Number(header.old_remaining || 0) +
                      Number(saleTotal || 0);
                    const val =
                      e.target.value === ""
                        ? ""
                        : Math.max(0, Math.min(Number(e.target.value), maxVal));
                    onHeader({ target: { name: "cash_received", value: val } });
                  }}
                  onBlur={(e) => {
                    const maxVal =
                      Number(header.old_remaining || 0) +
                      Number(saleTotal || 0);
                    if (e.target.value === "") return;
                    const v = Math.max(
                      0,
                      Math.min(Number(e.target.value), maxVal)
                    );
                    onHeader({
                      target: {
                        name: "cash_received",
                        value: Number(v.toFixed(2)),
                      },
                    });
                  }}
                  placeholder="Enter paid amount"
                />
                <span className="text-xs text-gray-500 mt-1">
                  Max allowed:{" "}
                  {fx(
                    Number(header.old_remaining || 0) + Number(saleTotal || 0)
                  )}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  Party Balance
                </label>
                <input
                  className="border p-2 rounded-lg bg-gray-100"
                  value={fx(header.party_balance)}
                  readOnly
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  Payment Method
                </label>
                <select
                  className="border p-2 rounded-lg"
                  value={header.payment_method}
                  onChange={(e) =>
                    setHeader((p) => ({ ...p, payment_method: e.target.value }))
                  }
                >
                  <option>None</option>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>Online</option>
                  <option>Credit Card</option>
                  <option>UPI</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  select type
                </label>
                <select
                  className="border p-2 rounded-lg"
                  value={header.buyer_type}
                  onChange={(e) =>
                    setHeader((p) => ({ ...p, buyer_type: e.target.value }))
                  }
                >
                  <option value="Retailer">Retailer</option>
                  <option value="Whole Saler">Whole Saler</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                  Payment Status
                  <button
                    type="button"
                    className="px-2 py-0.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                    onClick={() => {
                      const full =
                        Number(header.old_remaining || 0) +
                        Number(saleTotal || 0);
                      setHeader((p) => ({
                        ...p,
                        cash_received: Number(full.toFixed(2)),
                      }));
                      setFullPay(true);
                    }}
                    title="Set paid amount to full"
                  >
                    Full Pay
                  </button>
                </label>
                <div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      netDue <= 0
                        ? "bg-green-100 text-green-700"
                        : Number(header.cash_received || 0) > 0
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {netDue <= 0
                      ? "Paid"
                      : Number(header.cash_received || 0) > 0
                      ? "Partial"
                      : "Unpaid"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border text-xs">
          <thead>
            <tr className="bg-green-700 text-white">
              <th className="px-2 py-2 border text-center w-10">S.No</th>
              <th className="px-2 py-2 border text-left">Item Name</th>
              <th className="px-2 py-2 border text-left">HSNCode</th>
              <th className="px-2 py-2 border text-center w-20">
                Aval QTY (KG)
              </th>
              <th className="px-2 py-2 border text-center w-16">QTY</th>
              <th className="px-2 py-2 border text-center w-16">Unit</th>
              <th className="px-2 py-2 border text-right">Rate (per kg)</th>
              <th className="px-2 py-2 border text-right">Amount</th>
              <th className="px-2 py-2 border text-right">Disc %</th>
              <th className="px-2 py-2 border text-right">Per Qty Disc</th>
              <th className="px-2 py-2 border text-right">Total Disc</th>
              <th className="px-2 py-2 border text-right">GST%</th>
              <th className="px-2 py-2 border text-right">GST Amt</th>
              <th className="px-2 py-2 border text-right">FinalAmt</th>
              <th className="px-2 py-2 border text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const c = calc(r);
              const base = c.base;
              const perUnitDisc = c.perUnitDisc;
              const totalDisc = c.totalDisc;
              const taxable = c.taxable;
              const gstAmt = c.gstAmt;
              const final = c.final;

              // Convert available grams to KG for display
              const availableInKG = convertGramsToKG(r.available_grams || 0);
              // Calculate available in selected unit for validation
              const availableInSelectedUnit = convertFromGrams(
                r.available_grams || 0,
                r.unit
              );

              return (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  <td className="px-2 py-1 border text-center">{i + 1}</td>
                  <td className="px-2 py-1 border">
                    <div className="flex gap-1">
                      <select
                        className="border rounded p-1 w-44"
                        value={r.product_id}
                        onChange={(e) => {
                          const pid = e.target.value;
                          onRow(i, "product_id", pid);
                        }}
                      >
                        <option value="">Select</option>
                        {products.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.product_name}
                          </option>
                        ))}
                      </select>
                      <input
                        readOnly
                        className="border rounded p-1 w-36 bg-gray-100"
                        value={r.item_name}
                        placeholder="Item"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1 border bg-gray-100">
                    <input
                      readOnly
                      className="border rounded w-full h-8 px-2 text-xs"
                      value={r.hsn_code}
                    />
                  </td>
                  <td className="px-2 py-1 border text-center">
                    <input
                      readOnly
                      className="border rounded p-1 w-20 bg-gray-100"
                      value={fx(availableInKG, 3)}
                      title={`Current stock: ${
                        r.available_grams || 0
                      } grams (${fx(availableInKG, 3)} KG)`}
                    />
                    <div className="text-[8px] text-gray-500">in KG</div>
                  </td>
                  <td className="px-2 py-1 border text-center">
                    <input
                      type="number"
                      min={0}
                      step="0.001"
                      className={`border rounded w-16 h-8 px-2 text-center text-xs ${
                        errors.rows[i]?.qty ? errClass : ""
                      }`}
                      value={r.qty === 0 ? "" : r.qty}
                      onChange={(e) => onRow(i, "qty", e.target.value)}
                      max={availableInSelectedUnit}
                    />
                    <div className="text-[8px] text-gray-500">
                      Max: {fx(availableInSelectedUnit, 3)} {r.unit}
                    </div>
                  </td>
                  <td className="px-2 py-1 border">
                    <div className="flex gap-1">
                      <select
                        className="border rounded p-1 w-44"
                        value={r.unit || ""}
                        onChange={(e) => onRow(i, "unit", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="ton">Ton</option>
                        <option value="litter">Liter</option>
                        <option value="quantal">Quantal</option>
                        <option value="kg">KG</option>
                        <option value="gram">Gram</option>
                      </select>
                    </div>
                  </td>

                  <td className="px-2 py-1 border text-right">
                    <input
                      type="number"
                      step="0.01"
                      className={
                        "border rounded w-20 h-8 px-2 text-right text-xs"
                      }
                      value={r.rate === 0 ? "" : r.rate}
                      onChange={(e) => onRow(i, "rate", e.target.value)}
                    />
                    {/* <div className="text-[10px] text-gray-500 text-right">
                      {useCostMargin && !r.manualRate
                        ? `Margin: ${getMarginPercentByQty(
                            r.qty_in_kg ||
                              convertUnitToKG(Number(r.qty || 0), r.unit),
                            header.buyer_type
                          )}% ${
                            header.buyer_type === "Retailer"
                              ? "(fixed)"
                              : "(auto)"
                          }`
                        : "Manual rate"}
                      <br />
                      Always per kg | {fx(r.rate, 2)}/kg
                    </div> */}

                    <div className="text-[10px] text-gray-500 text-right">
                      {useCostMargin && !r.manualRate
                        ? `Margin: ${getMarginPercentByQty(
                            r.qty_in_kg ||
                              convertUnitToKG(Number(r.qty || 0), r.unit),
                            header.buyer_type
                          )}% ${
                            header.buyer_type === "Retailer"
                              ? "(fixed)"
                              : `(qty: ${
                                  r.qty_in_kg ||
                                  convertUnitToKG(Number(r.qty || 0), r.unit)
                                }kg)`
                          }`
                        : "Manual rate"}
                      <br />
                      Always per kg | {fx(r.rate, 2)}/kg
                    </div>
                  </td>

                  <td className="px-2 py-1 border text-right">{fx(base)}</td>
                  <td className="px-2 py-1 border text-right">
                    <input
                      type="number"
                      className="border rounded w-16 h-8 px-2 text-right text-xs"
                      value={r.d1_percent === 0 ? "" : r.d1_percent}
                      onChange={(e) => onRow(i, "d1_percent", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1 border text-right">
                    <div className="flex flex-col items-end">
                      <input
                        type="text"
                        className="border rounded w-20 h-8 px-2 text-right text-xs bg-gray-100 cursor-not-allowed"
                        value={fx(perUnitDisc)}
                        readOnly
                      />
                      <div className="text-[10px] text-gray-500">
                        x {r.qty || 0} = {fx(totalDisc)}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1 border text-right">
                    <span className="font-semibold">{fx(totalDisc)}</span>
                  </td>
                  <td className="px-2 py-1 border text-right">
                    <input
                      type="number"
                      className="border rounded w-16 h-8 px-2 text-right text-xs"
                      value={r.gst_percent === 0 ? "" : r.gst_percent}
                      onChange={(e) => onRow(i, "gst_percent", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1 border text-right">{fx(gstAmt)}</td>
                  <td className="px-2 py-1 border text-right">{fx(final)}</td>
                  <td className="px-2 py-1 border text-center">
                    <button
                      type="button"
                      className="h-8 w-8 grid place-items-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                      onClick={async () => {
                        const res = await Swal.fire({
                          title: "Remove this row?",
                          text: "This item will be removed.",
                          icon: "warning",
                          showCancelButton: true,
                          confirmButtonText: "Remove",
                          cancelButtonText: "Cancel",
                          confirmButtonColor: "#dc2626",
                        });
                        if (res.isConfirmed) {
                          setRows((p) => p.filter((_, idx) => idx !== i));
                          setErrors((er) => {
                            const copy = { ...er };
                            delete copy.rows[i];
                            return copy;
                          });
                        }
                      }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-gray-100 font-semibold text-right text-xs">
              <td className="px-2 py-2 border text-center"></td>
              <td className="px-2 py-2 border text-left">Totals</td>
              <td className="px-2 py-2 border text-left"></td>
              <td className="px-2 py-2 border text-center"></td>
              <td className="px-2 py-2 border text-center">
                Total Qty (kg): {fx(totals.totalQtyKg, 3)}
              </td>
              <td className="px-2 py-2 border text-center"></td>
              <td className="px-2 py-2 border text-right">
                {fx(
                  rows.reduce((a, r) => a + (r.rate || 0), 0),
                  3
                )}
              </td>
              <td className="px-2 py-2 border text-right">{fx(totals.base)}</td>
              <td className="px-2 py-2 border text-right"></td>
              <td className="px-2 py-2 border text-right">—</td>
              <td className="px-2 py-2 border text-right">{fx(totals.disc)}</td>
              <td className="px-2 py-2 border text-right"></td>
              <td className="px-2 py-2 border text-right">{fx(totals.gst)}</td>
              <td className="px-2 py-2 border text-right">
                {fx(totals.final)}
              </td>
              <td className="px-2 py-2 border text-center"></td>
            </tr>
            <tr>
              <td className="px-2 py-1 border" colSpan={15}>
                <button
                  className="px-2 py-1 bg-gray-200 rounded text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    setRows((p) => [...p, { ...emptyRow }]);
                  }}
                  type="button"
                >
                  Add Row
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="mt-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 rounded-lg"
            onClick={() => {
              setHeader({
                sale_no: "",
                date: "",
                party_type: "customer",
                customer_id: "",
                vendor_id: "",
                farmer_id: "",
                address: "",
                mobile_no: "",
                gst_no: "",
                terms_condition: "",
                payment_status: "Unpaid",
                payment_method: "None",
                status: "Active",
                old_remaining: 0,
                cash_received: 0,
                party_balance: 0,
                party_min_balance: 0,
                buyer_type: "Retailer", // Reset to Retailer
                other_amount: 0,
                other_note: "",
              });

              setRows([{ ...emptyRow }]);
              setErrors({ header: {}, rows: {} });
            }}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
          >
            {isEditMode ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
