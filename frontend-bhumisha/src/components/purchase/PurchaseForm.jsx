import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PurchaseAPI from "../../axios/purchaseApi";
import VendorAPI from "../../axios/vendorsAPI";
import FarmerAPI from "../../axios/farmerAPI";
import ProductAPI from "../../axios/productAPI";
import { useDispatch } from "react-redux";
import { fetchProducts } from "../../features/products/productsSlice";
import { fetchPurchases } from "../../features/purchase/purchaseSlice";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import PurchaseOrder from "../../axios/poOrder";

const fx = (n) => (isNaN(n) ? "0.000" : Number(n).toFixed(3));

const to24h = (hhmm = "00:00", ampm = "PM") => {
  let [hh, mm] = (hhmm || "00:00").split(":").map((x) => Number(x || 0));
  if (ampm === "AM") {
    if (hh === 12) hh = 0;
  } else {
    if (hh !== 12) hh = hh + 12;
  }
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
};

const fromISOToTime = (iso = "") => {
  const hh = Number(iso?.slice(11, 13) || 0);
  const mm = iso?.slice(14, 16) || "00";
  const ampm = hh >= 12 ? "PM" : "AM";
  let displayH = hh % 12;
  if (displayH === 0) displayH = 12;
  return { time: `${String(displayH).padStart(2, "0")}:${mm}`, ampm };
};

// Helper function to convert quantity to grams
const convertToGrams = (quantity, unit) => {
  const qty = Number(quantity) || 0;
  switch (unit) {
    case "ton":
      return qty * 1000 * 1000; // 1 ton = 1,000,000 grams
    case "quantal":
      return qty * 100 * 1000; // 1 quantal = 100,000 grams
    case "kg":
      return qty * 1000; // 1 kg = 1,000 grams
    case "litter":
      return qty * 1000; // 1 kg = 1,000 grams
    case "gram":
      return qty;
    default:
      return qty; // Assume already in grams
  }
};

// Helper function to convert grams to KG (for display only)
const convertGramsToKG = (grams) => {
  const g = Number(grams) || 0;
  return g / 1000; // Convert grams to KG
};

// Helper function to convert display unit to KG for calculations
const convertToKGForCalculations = (quantity, unit) => {
  const qty = Number(quantity) || 0;
  switch (unit) {
    case "ton":
      return qty * 1000; // 1 ton = 1,000 KG
    case "quantal":
      return qty * 100; // 1 quantal = 100 KG
    case "kg":
      return qty; // Already in KG
    case "gram":
      return qty / 1000; // Convert grams to KG
    default:
      return qty; // Assume already in KG
  }
};

const PurchaseForm = ({ onSaved }) => {
  const { poId } = useParams();
  const isEditMode = Boolean(poId);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const sp = new URLSearchParams(location.search);
  const poIdFromQuery = sp.get("poId");
  const isCreateModeFromPO = Boolean(poIdFromQuery && !isEditMode);

  const [loading, setLoading] = useState(false);
  const [copnayId, setCopnayId] = useState(null);

  useEffect(() => {
    const companyData = localStorage.getItem("currentCompany");
    const ParseCompany = JSON.parse(companyData);

    setCopnayId(ParseCompany?.id);
  }, [copnayId]);

  // Masters
  const [vendors, setVendors] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);

  const [billImagePreview, setBillImagePreview] = useState("");
  const [billFile, setBillFile] = useState(null);

  // Header
  const [header, setHeader] = useState({
    bill_date: "",
    bill_time: "00:00",
    bill_time_am_pm: "PM",
    party_type: "vendor",
    vendor_id: "",
    farmer_id: "",
    address: "",
    mobile_no: "",
    gst_no: "",
    bill_no: "",
    terms_condition: "",
    party_balance: 0,
    party_min_balance: 0,
    old_amount: 0,
    paid_amount: 0,
    payment_method: "None",
    payment_note: "",
    transport: "",
  });

  // Rows - Updated structure
  const [rows, setRows] = useState([
    {
      product_id: "",
      item_name: "",
      hsn_code: "",
      originalAvailable: 0, // Original stock from product (in grams)
      size: 0, // Purchase quantity (user input)
      rate: 0,
      d1_percent: 0,
      gst_percent: 0,
      image_preview: "",
      unit: "",
    },
  ]);

  // Update originalAvailable when products change
  useEffect(() => {
    if (!products?.length) return;
    setRows((prev) =>
      prev.map((r) => {
        if (!r?.product_id) return r;
        const p = products.find((x) => String(x.id) === String(r.product_id));
        const avail = Number(p?.available || 0); // This is in grams from product
        return Number(r.originalAvailable || 0) === avail
          ? r
          : { ...r, originalAvailable: avail };
      })
    );
  }, [products]);

  // Load masters
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        setLoading(true);
        const [vRes, fRes, pRes] = await Promise.all([
          VendorAPI.getAll(),
          FarmerAPI.getAll(),
          ProductAPI.getAll(),
        ]);
        setVendors(vRes?.data || []);
        setFarmers(fRes?.data || []);
        const all = (pRes?.data || []).map((p) => ({
          id: p.id,
          product_name: p.product_name,
          hsn_code: p.hsn_code || "",
          available: Number(p.size || 0), // Size in grams from product
          purchaseRate: Number(p.purchase_rate || 0),
          gst_percent: Number(p.gst_percent ?? p.gst_rate ?? p.gst ?? 0),
          unit: p.unit || "",
          raw: p,
          type: p?.type,
        }));
        setProducts(all);

        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const hours = now.getHours();
        let displayH = hours % 12;
        if (displayH === 0) displayH = 12;

        setHeader((prev) => ({
          ...prev,
          bill_date: `${y}-${m}-${d}`,
          bill_time: `${String(displayH).padStart(2, "0")}:${minutes}`,
        }));
      } catch (e) {
        console.error("Master fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMaster();
  }, []);

  const { poOrder } = useAuth();

  // Prefill from PO in create mode
  useEffect(() => {
    const prefillFromPO = async () => {
      if (!isCreateModeFromPO) return;
      try {
        setLoading(true);
        const res = await PurchaseAPI.getPOForPurchase(poIdFromQuery);

        const data = res?.data || {};
        const h = data.header || {};
        const its = Array.isArray(data.items) ? data.items : [];

        setHeader((prev) => ({
          ...prev,
          party_type: h.party_type || "vendor",
          vendor_id: h.vendor_id || "",
          farmer_id: h.farmer_id || "",
          address: h.address || "",
          mobile_no: h.mobile_no || "",
          gst_no: h.gst_no || "",
          terms_condition: h.terms_condition || "",
          party_balance: Number(h.party_balance || 0),
          party_min_balance: Number(h.party_min_balance || 0),
          old_amount: Number(h.party_balance || 0),
        }));

        const mappedRows = its.map((it) => {
          const p = products.find(
            (x) => String(x.id) === String(it.product_id)
          );
          return {
            po_item_id: it.po_item_id || null,
            product_id: String(it.product_id || ""),
            item_name: it.item_name || "",
            hsn_code: it.hsn_code || "",
            originalAvailable: Number(p?.available || 0), // Store original stock in grams
            size: Number(it.pending_qty ?? it.qty ?? 1), // Purchase quantity
            rate: Number(it.rate || 0),
            // rate: normalizeRatePerKG(it.rate || 0, it.unit || p?.unit || "kg"),
            d1_percent: Number(it.discount_rate || 0),
            gst_percent: Number(it.gst_percent || 0),
            unit: it.unit || p?.unit || "",
          };
        });

        setRows(
          mappedRows.length > 0
            ? mappedRows
            : [
                {
                  product_id: "",
                  item_name: "",
                  hsn_code: "",
                  originalAvailable: 0,
                  size: 1,
                  rate: 0,
                  d1_percent: 0,
                  gst_percent: 0,
                  unit: "",
                },
              ]
        );
      } catch (e) {
        console.error("PO prefill error", e);
      } finally {
        setLoading(false);
      }
    };
    prefillFromPO();
  }, [isCreateModeFromPO, poIdFromQuery, products]);

  // Party type change
  const onPartyTypeChange = (e) => {
    const val = e.target.value;
    setHeader((prev) => ({
      ...prev,
      party_type: val,
      vendor_id: val === "vendor" ? prev.vendor_id : "",
      farmer_id: val === "farmer" ? prev.farmer_id : "",
      address: "",
      mobile_no: "",
      gst_no: "",
      party_balance: 0,
      party_min_balance: 0,
      old_amount: 0,
      paid_amount: 0,
    }));
  };

  // Party change (vendor/farmer)
  const onPartyChange = (e) => {
    const id = e.target.value;
    if (header.party_type === "vendor") {
      const v = vendors.find((x) => String(x.id) === String(id));
      setHeader((prev) => ({
        ...prev,
        vendor_id: id,
        farmer_id: "",
        address: v?.address || "",
        mobile_no: v?.contact_number || "",
        gst_no: v?.gst_no || "",
        party_balance: Number(v?.balance ?? 0),
        party_min_balance: Number(v?.min_balance ?? 0),
        old_amount: Number(v?.balance ?? 0),
      }));
    } else {
      const f = farmers.find((x) => String(x.id) === String(id));

      setHeader((prev) => ({
        ...prev,
        farmer_id: id,
        vendor_id: "",
        address: "",
        mobile_no: f?.contact_number || "",
        gst_no: "",
        party_balance: Number(f?.balance ?? 0),
        party_min_balance: Number(f?.min_balance ?? 0),
        old_amount: Number(f?.balance ?? 0),
      }));
    }
  };

  // Load existing purchase
  useEffect(() => {
    if (!isEditMode) return;

    const load = async () => {
      try {
        const res = await PurchaseAPI.getById(poId);
        const data = res?.data || {};

        const { time } = data.bill_time
          ? fromISOToTime(data.bill_time)
          : { time: "00:00" };

        // Header hydrate
        setHeader((prev) => ({
          ...prev,
          bill_date: data.bill_date || "",
          bill_time: time,
          bill_time_am_pm: data.bill_time
            ? Number(data.bill_time.slice(11, 13)) >= 12
              ? "PM"
              : "AM"
            : "PM",
          party_type: data.party_type || "vendor",
          vendor_id: data.vendor_id || "",
          farmer_id: data.farmer_id || "",
          address: data.address || "",
          mobile_no: data.farmer_contact || data?.vendor_contact,
          gst_no: data.gst_no || "",
          bill_no: data.bill_no || "",
          terms_condition: data.terms_condition || "",
          party_balance: Number(data.party_balance ?? data.balance ?? 0),
          party_min_balance: Number(
            data.party_min_balance ?? data.min_balance ?? 0
          ),
          old_amount: Number(data.old_amount ?? data.previous_due ?? 0),
          paid_amount: Number(data.paid_amount ?? 0),
          payment_method: data.payment_method || "None",
          payment_note: data.payment_note || "",
          transport: data?.transport || "",
        }));

        // Bill image preview
        if (data?.bill_img) setBillImagePreview(data.bill_img);

        // Rows hydrate
        if (products.length > 0) {
          setRows(
            (data.items || []).map((it) => {
              const p = products.find(
                (pp) => Number(pp.id) === Number(it.product_id)
              );
              return {
                product_id: String(it.product_id || ""),
                item_name:
                  it.item_name || it.product_name || p?.product_name || "",
                hsn_code: it.hsn_code || p?.hsn_code || "",
                originalAvailable: Number(p?.available || 0), // Store original stock in grams
                size: Number(it.size || 0), // Purchase quantity
                rate: Number(it.rate || p?.purchaseRate || 0),
                d1_percent: Number(
                  it.discount_percent ?? it.discount_rate ?? 0
                ),
                gst_percent: Number(it.gst_percent ?? p?.gst_percent ?? 0),
                unit: it.unit || p?.unit || "",
              };
            })
          );
        }
      } catch (e) {
        console.error("Purchase fetch error", e);
      }
    };

    load();
  }, [isEditMode, poId, products]);

  const onHeader = (e) =>
    setHeader((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onRow = (i, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      const numeric = ["size", "rate", "d1_percent", "gst_percent"];
      const v = numeric.includes(field) ? Number(value || 0) : value;
      next[i] = { ...next[i], [field]: v };

      if (field === "product_id") {
        const p = products.find((x) => String(x.id) === String(value));
        if (p) {
          next[i].item_name = p.product_name || "";
          next[i].hsn_code = p.hsn_code || "";
          next[i].originalAvailable = Number(p.available || 0); // Store original stock in grams
          next[i].rate = Number(p.purchaseRate || 0);

          next[i].gst_percent = Number(p.gst_percent || 0);
          next[i].unit = p.unit || "";
        }
      }

      return next;
    });
  };

  const calc = (r) => {
    // Convert purchase quantity to KG for calculations
    const quantityInKG = convertToKGForCalculations(
      r.size || 0,
      r.unit || "kg"
    );

    // Calculate base amount (quantity in KG × rate per KG)
    const base = quantityInKG * (r.rate || 0);

    // Calculate discount per KG
    const perUnitDisc = ((r.rate || 0) * (r.d1_percent || 0)) / 100;

    // Total discount (discount per KG × quantity in KG)
    const totalDisc = quantityInKG * perUnitDisc;

    // Taxable amount after discount
    const taxable = Math.max(0, base - totalDisc);

    // GST amount
    const gstAmt = (taxable * (r.gst_percent || 0)) / 100;

    // Final amount
    const final = taxable + gstAmt;

    return {
      base,
      perUnitDisc,
      totalDisc,
      taxable,
      gstAmt,
      final,
      quantityInKG,
    };
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
          a.quantityInKG += c.quantityInKG;
          return a;
        },
        { base: 0, disc: 0, taxable: 0, gst: 0, final: 0, quantityInKG: 0 }
      ),
    [rows]
  );

  // Add transport to final total calculation
  const transportCharges = Number(header.transport || 0);
  const finalTotalWithTransport = totals.final + transportCharges;

  const addRow = () =>
    setRows((p) => [
      ...p,
      {
        product_id: "",
        item_name: "",
        hsn_code: "",
        originalAvailable: 0,
        size: 1,
        rate: 0,
        d1_percent: 0,
        gst_percent: 0,
        unit: "",
      },
    ]);

  const removeRow = (idx) => setRows((p) => p.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      let bill_time_iso = "";
      if (header.bill_date) {
        const t24 = to24h(
          header.bill_time || "00:00",
          header.bill_time_am_pm || "PM"
        );
        bill_time_iso = `${header.bill_date}T${t24}`;
      }

      const payload = {
        ...header,
        bill_time: bill_time_iso,
        vendor_id: header.party_type === "vendor" ? header.vendor_id : null,
        farmer_id: header.party_type === "farmer" ? header.farmer_id : null,
        linked_po_id: isCreateModeFromPO ? Number(poIdFromQuery) : null,
        companyId: copnayId,
        items: rows.map((r) => ({
          product_id: r.product_id,
          po_item_id: r.po_item_id || null,
          rate: Number(r.rate || 0),
          // rate: denormalizeRateFromKG(r.rate, r.unit),
          size: Number(r.size || 0),
          unit: r?.unit,
          discount_rate: Number(r.d1_percent || 0),
          gst_percent: Number(r.gst_percent || 0),
        })),
        summary: {
          ...totals,
          transport: transportCharges,
          final_with_transport: finalTotalWithTransport,
        },
        remaining_amount:
          Number(header.old_amount || 0) +
          finalTotalWithTransport -
          Number(header.paid_amount || 0),
      };

      // Build FormData
      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));

      if (billFile) {
        fd.append("bill_img", billFile);
      }

      if (isEditMode) {
        if (poOrder == "editpo") {
          await PurchaseAPI.update(poId, fd);

          // Update product purchase_rate side-effects
          const updates = payload.items.map((it) => {
            const p = products.find(
              (x) => Number(x.id) === Number(it.product_id)
            );
            return ProductAPI.update(it.product_id, {
              product_name: p?.product_name,
              purchase_rate: it.rate,
            });
          });

          await PurchaseOrder.remove(poId);

          await Promise.allSettled(updates);
          await dispatch(fetchProducts());
          try {
            await dispatch(fetchPurchases());
          } catch {}

          await Swal.fire({
            icon: "success",
            title: "Purchase updated",
            text: "Purchase updated successfully",
            confirmButtonColor: "#2563eb",
          });
          navigate("/purchases");
        } else {
          await PurchaseAPI.update(poId, fd);

          const updates = payload.items.map((it) => {
            const p = products.find(
              (x) => Number(x.id) === Number(it.product_id)
            );
            return ProductAPI.update(it.product_id, {
              product_name: p?.product_name,
              purchase_rate: it.rate,
            });
          });
          await Promise.allSettled(updates);
          await dispatch(fetchProducts());
          try {
            await dispatch(fetchPurchases());
          } catch {}

          await Swal.fire({
            icon: "success",
            title: "Purchase updated",
            text: "Purchase updated successfully",
            confirmButtonColor: "#2563eb",
          });
          navigate("/purchases");
        }
      } else {
        await PurchaseAPI.create(fd);

        // Update products with new purchase quantities
        const updates = payload.items.map((it) => {
          const p = products.find(
            (x) => Number(x.id) === Number(it.product_id)
          );

          const ChangesRate = Number(it?.rate) || 0;
          const lt = Number(p?.raw?.local_transport) || 0;
          const pc = Number(p?.raw?.packaging_cost) || 0;
          const tc = Number(p?.raw?.transport_charge) || 0;

          const totalRate = ChangesRate + lt + pc + tc;
          const margin_25 = totalRate * 0.25;
          const margin_30 = totalRate * 0.3;
          const margin_50 = totalRate * 0.5;
          const totalSellingValue = totalRate + margin_50;

          // Get current product size (in grams)
          let currentProductSize = Number(p?.available) || 0;

          // Convert purchase quantity to grams
          const purchaseSizeInGrams = convertToGrams(it?.size, it?.unit);

          // Calculate new product size (ADD to existing) - ONLY AFTER PURCHASE IS SAVED
          const newProductSize = currentProductSize + purchaseSizeInGrams;

          return ProductAPI.update(it.product_id, {
            product_name: p?.product_name || "",
            purchase_rate: Number(it.rate) || 0,
            value: Number(totalRate) || 0,
            discount_30: Number(margin_30) || 0,
            discount_25: Number(margin_25) || 0,
            discount_50: Number(margin_50) || 0,
            total: Number(totalSellingValue) || 0,
            gst: Number(it?.gst_percent) || 0,
            size: newProductSize, // Updated size IN GRAMS
          });
        });

        await Promise.allSettled(updates);
        await dispatch(fetchProducts());
        try {
          await dispatch(fetchPurchases());
        } catch {}

        await Swal.fire({
          icon: "success",
          title: "Purchase saved",
          text: "Purchase saved successfully",
          confirmButtonColor: "#2563eb",
        });

        navigate("/purchases");
        if (typeof onSaved === "function") onSaved();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Failed to save",
        text: err?.response?.data?.error || "Failed to save purchase",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    String(header.bill_date || "").trim() !== "" &&
    ((header.party_type === "vendor" &&
      String(header.vendor_id || "").trim() !== "") ||
      (header.party_type === "farmer" &&
        String(header.farmer_id || "").trim() !== "")) &&
    rows.length > 0 &&
    rows.every(
      (r) =>
        String(r.product_id).trim() !== "" &&
        String(r.item_name || "").trim() !== "" &&
        Number(r.size) > 0 &&
        Number(r.rate) > 0
    );

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBillFile(file);
  };

  return (
    <form onSubmit={onSubmit} className="p-3">
      {/* Order Summary + Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start mb-3">
        {/* Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="text-sm font-semibold text-gray-800 mb-2">
              Order Summary
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Taxable</span>
                <span className="font-semibold">{fx(totals.taxable)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">GST</span>
                <span className="font-semibold">{fx(totals.gst)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Transport</span>
                <span className="font-semibold">{fx(transportCharges)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Paid Amount</span>
                <span className="text-base font-semibold">
                  {fx(header.paid_amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Grand Total</span>
                <span className="text-base font-semibold">
                  {fx(totals.final + transportCharges - header?.paid_amount)}
                </span>
              </div>
            </div>

            <div className="pt-2 mt-2 border-t space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {header.party_type === "vendor" ? "Vendor" : "Farmer"}
                </span>
                <span className="text-gray-800">
                  {(() => {
                    if (header.party_type === "vendor") {
                      const v = vendors.find(
                        (x) => String(x.id) === String(header.vendor_id)
                      );
                      return v?.vendor_name || v?.name || "-";
                    }
                    const f = farmers.find(
                      (x) => String(x.id) === String(header.farmer_id)
                    );
                    return f?.name || "-";
                  })()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded p-2 text-xs">
                  <div className="text-gray-600">Party Balance</div>
                  <div className="font-semibold">
                    {fx(header.party_balance)}
                  </div>
                </div>

                <div
                  className={`rounded p-2 text-xs ${
                    (header.old_amount ?? 0) +
                      (totals?.final ?? 0) -
                      (header.paid_amount ?? 0) >
                    0
                      ? "bg-amber-50"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="text-gray-600">Remaining</div>
                  <div className="font-semibold">
                    {fx(
                      (header.old_amount ?? 0) +
                        transportCharges +
                        (totals?.final ?? 0) -
                        (header.paid_amount ?? 0)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Card */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="text-xs">Bill Date</label>
                <input
                  type="date"
                  className="border rounded p-1"
                  name="bill_date"
                  value={header.bill_date}
                  onChange={onHeader}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs">Party Type</label>
                <select
                  className="border rounded p-1"
                  value={header.party_type}
                  onChange={onPartyTypeChange}
                >
                  <option value="vendor">Vendor</option>
                  <option value="farmer">Farmer</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs">
                  {header.party_type === "vendor" ? "Firm/Vendor" : "Farmer"}
                </label>
                <select
                  className="border rounded p-1"
                  name={
                    header.party_type === "vendor" ? "vendor_id" : "farmer_id"
                  }
                  value={
                    header.party_type === "vendor"
                      ? header.vendor_id
                      : header.farmer_id
                  }
                  onChange={onPartyChange}
                >
                  <option value="">Select</option>
                  {(header.party_type === "vendor" ? vendors : farmers).map(
                    (p) => (
                      <option key={p.id} value={p.id}>
                        {header.party_type === "vendor"
                          ? p.firm_name || p.name
                          : p.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex flex-col lg:col-span-2">
                <label className="text-xs">ADDRESS</label>
                <input
                  className="border rounded p-1"
                  name="address"
                  value={header.address}
                  onChange={onHeader}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs">MOBILE NO</label>
                <input
                  className="border rounded p-1"
                  name="mobile_no"
                  value={header.mobile_no}
                  onChange={onHeader}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs">GST No</label>
                <input
                  className="border rounded p-1"
                  name="gst_no"
                  value={header.gst_no}
                  onChange={onHeader}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs">Bill No.</label>
                <input
                  className="border rounded p-1"
                  name="bill_no"
                  value={header.bill_no}
                  onChange={onHeader}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs">Party Balance</label>
                <input
                  className="border rounded p-1 bg-gray-100"
                  name="party_balance"
                  value={fx(header.party_balance)}
                  readOnly
                />
              </div>

              <div className="">
                <div className="text-xs">
                  <label className="text-gray-600 block">Paid</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="border rounded p-2 w-full"
                    value={header.paid_amount === 0 ? "" : header?.paid_amount}
                    onChange={(e) =>
                      setHeader((p) => ({
                        ...p,
                        paid_amount: Number(e.target.value || 0),
                      }))
                    }
                  />
                </div>
                {/* <div className="text-xs">
                  <label className="text-gray-600 block">Remaining</label>
                  <input
                    readOnly
                    className="border rounded p-2 w-full bg-gray-100"
                    value={fx(
                      (header.old_amount ?? 0) +
                        (totals?.final ?? 0) -
                        (header.paid_amount ?? 0)
                    )}
                  />
                </div> */}
                {/* // Update remaining amount calculation in header */}
                <div className="text-xs">
                  <label className="text-gray-600 block">Remaining</label>
                  <input
                    readOnly
                    className="border rounded p-2 w-full bg-gray-100"
                    value={fx(
                      (header.old_amount ?? 0) +
                        finalTotalWithTransport -
                        (header.paid_amount ?? 0)
                    )}
                  />
                </div>
              </div>

              <div className="">
                <div className="text-xs">
                  <label className="text-gray-600 block">Payment Method</label>
                  <select
                    className="border rounded p-2 w-full"
                    value={header.payment_method}
                    onChange={(e) =>
                      setHeader((p) => ({
                        ...p,
                        payment_method: e.target.value,
                      }))
                    }
                  >
                    <option>None</option>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Bank</option>
                    <option>Credit</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className="block text-sm font-medium mb-1">
                    Bill Image / Document
                  </label>
                  <input
                    type="file"
                    accept="*/*"
                    onChange={handleFileUpload}
                    className="block w-full text-sm border p-2 rounded"
                  />

                  {billFile && (
                    <p className="text-sm text-green-600 mt-1">
                      Selected: {billFile.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs">Transport charges</label>
                  <input
                    className="border rounded p-1"
                    name="transport"
                    value={header.transport}
                    onChange={onHeader}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Big total bar */}
      {/*  Update the big total bar */}
      <div className="bg-black text-yellow-300 text-center text-2xl font-semibold py-2 mt-1 mb-2 rounded">
        FINAL AMOUNT (with Transport): {fx(finalTotalWithTransport)}
      </div>
      {/* Items Table */}
      <div className="overflow-auto">
        <table className="w-full text-sm border">
          <thead className="bg-green-700 text-white">
            <tr>
              {[
                "S.No",
                "Item Name",
                "HSNCode",
                "Available (KG)", // Always show KG
                "Purchase QTY",
                "Unit",
                "Rate (per KG)",
                "Amount",
                "Disc %",
                "Per Qty Disc",
                "Total Disc",
                "GST%",
                "GST Amt",
                "FinalAmt",
                "Actions",
              ].map((h, idx) => (
                <th key={`${h}-${idx}`} className="border px-2 py-1 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              // Convert original available (in grams) to KG for display
              const availableInKG = convertGramsToKG(r.originalAvailable || 0);

              // Calculate based on purchase quantity and unit
              const c = calc(r);

              return (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  <td className="border px-2 py-1">{i + 1}</td>

                  <td className="border px-2 py-1">
                    <div className="flex gap-1">
                      <select
                        className="border rounded p-1 w-44"
                        value={r.product_id}
                        onChange={(e) => onRow(i, "product_id", e.target.value)}
                      >
                        <option value="">Select</option>
                        {products.map((p) => {
                          if (p?.type == "custom") return;
                          return (
                            <option key={p.id} value={String(p.id)}>
                              {p.product_name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </td>

                  <td className="border px-2 py-1">
                    <input
                      readOnly
                      className="border cursor-not-allowed bg-gray-100 rounded p-1 w-24"
                      value={r.hsn_code}
                      onChange={(e) => onRow(i, "hsn_code", e.target.value)}
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <input
                      readOnly
                      className="border rounded p-1 w-20 bg-gray-100"
                      value={fx(availableInKG)}
                      title={`Current stock: ${
                        r.originalAvailable || 0
                      } grams (${fx(availableInKG)} KG)`}
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      className="border rounded p-1 w-20"
                      value={r.size === 0 ? "" : r.size}
                      min={0}
                      step={0.1}
                      onChange={(e) => onRow(i, "size", e.target.value)}
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <div className="flex gap-1">
                      <select
                        className="border rounded p-1 w-44"
                        value={r.unit}
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

                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      className="border rounded p-1 w-20"
                      value={r.rate === 0 ? "" : r.rate}
                      min={0}
                      onChange={(e) => onRow(i, "rate", e.target.value)}
                    />
                  </td>

                  <td className="border px-2 py-1">{fx(c.base)}</td>

                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      className="border rounded p-1 w-16"
                      value={r.d1_percent === 0 ? "" : r.d1_percent}
                      onChange={(e) => onRow(i, "d1_percent", e.target.value)}
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <input
                      type="text"
                      className="border rounded p-1 w-20 bg-gray-100"
                      value={fx(c.perUnitDisc)}
                      readOnly
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <input
                      type="text"
                      className="border rounded p-1 w-24 bg-gray-100"
                      value={fx(c.totalDisc)}
                      readOnly
                    />
                  </td>

                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      className="border rounded p-1 w-16"
                      value={r.gst_percent === 0 ? "" : r.gst_percent}
                      min={0}
                      onChange={(e) => onRow(i, "gst_percent", e.target.value)}
                    />
                  </td>

                  <td className="border px-2 py-1">{fx(c.gstAmt)}</td>
                  <td className="border px-2 py-1">{fx(c.final)}</td>

                  <td className="border px-2 py-1 text-center">
                    <button
                      type="button"
                      className="text-red-600 active:scale-95"
                      onClick={() => removeRow(i)}
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td className="border px-2 py-1" colSpan={6}>
                Totals
              </td>
              <td className="border px-2 py-1">{fx(totals.base)}</td>
              <td className="border px-2 py-1">—</td>
              <td className="border px-2 py-1">—</td>
              <td className="border px-2 py-1">{fx(totals.disc)}</td>
              <td className="border px-2 py-1">—</td>
              <td className="border px-2 py-1">{fx(totals.gst)}</td>
              <td className="border px-2 py-1">{fx(totals.final)}</td>
              <td className="border px-2 py-1"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={addRow}
          className="px-4 py-2 bg-blue-600 active:scale-95 text-white rounded"
        >
          Add Item
        </button>
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className={`px-6 py-2 active:scale-95 rounded text-white bg-green-700 transition-opacity duration-200 ${
            loading || !isFormValid
              ? "opacity-50 cursor-not-allowed"
              : "opacity-100 cursor-pointer"
          }`}
        >
          {loading
            ? isEditMode
              ? "Updating..."
              : "Saving..."
            : isEditMode
            ? "Update"
            : "Save Purchase"}
        </button>
      </div>
    </form>
  );
};

export default PurchaseForm;
