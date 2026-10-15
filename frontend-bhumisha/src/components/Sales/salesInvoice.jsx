// src/components/Sales/salesInvoice.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import salesAPI from "../../axios/salesAPI";
import { api } from "../../axios/axios";
import { encryptInvoicePayload, decryptInvoicePayload } from "../../utils/invoiceCrypto";
import {
  Printer,
  Download,
  Share2,
  ArrowLeft,
  Copy,
  Check,
  FileText,
  Smartphone,
  Building2,
  MapPin,
  Phone,
  Mail,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const formatDateTime = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch (error) {
    if (typeof dateString === "string") {
      return dateString;
    }
    return "";
  }
};

const fmt = (v, d = 2) => Number(v || 0).toFixed(d);
const safe = (v, f = "—") =>
  v === null || v === undefined || v === "" ? f : v;

function toWords(n) {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const num = Math.round(Number(n || 0));
  if (num === 0) return "Zero";
  const s = (x) => {
    if (x < 20) return a[x];
    if (x < 100)
      return `${b[Math.floor(x / 10)]}${x % 10 ? " " + a[x % 10] : ""}`;
    if (x < 1000)
      return `${a[Math.floor(x / 100)]} Hundred${x % 100 ? " " + s(x % 100) : ""
        }`;
    return "";
  };

  const units = [
    { v: 10000000, n: " Crore" },
    { v: 100000, n: " Lakh" },
    { v: 1000, n: " Thousand" },
    { v: 100, n: " Hundred" },
  ];
  let x = num,
    out = "";
  for (const u of units) {
    if (x >= u.v) {
      const q = Math.floor(x / u.v);
      out += `${out ? " " : ""}${s(q)}${u.n}`;
      x = x % u.v;
    }
  }
  if (x > 0) out += `${out ? " " : ""}${s(x)}`;
  return out.trim();
}

export default function SalesInvoice() {
  const nav = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [auto, setAuto] = useState(false);
  const [patyBank, setPatyBank] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Responsive view mode state
  const [viewMode, setViewMode] = useState("auto"); // "auto" | "mobile" | "a4"
  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [copiedField, setCopiedField] = useState(null);

  const location = useLocation();
  const ref = useRef(null);
  const { token } = useParams();

  // Screen size detection for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine active view mode
  const activeView =
    viewMode === "auto" ? (isMobileScreen ? "mobile" : "a4") : viewMode;

  // Copy to clipboard helper
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Auto-download effect
  useEffect(() => {
    if (!sale) return;

    const queryParams = new URLSearchParams(location.search);
    const shouldAutoDownload = queryParams.get("autoDownload") === "true";

    if (shouldAutoDownload && sale && !isGeneratingPDF) {
      setTimeout(() => {
        handlePDF();
      }, 500);
    }
  }, [sale, location.search, isGeneratingPDF]);

  useEffect(() => {
    setLoading(true);

    if (!token) {
      setErr("Invalid invoice link");
      setLoading(false);
      return;
    }

    const decoded = decryptInvoicePayload(token);

    if (!decoded?.id || !decoded?.companyCode) {
      setErr("Invalid or expired invoice link");
      setLoading(false);
      return;
    }

    setAuto(Boolean(decoded.auto));

    salesAPI
      .getById(decoded?.id, {
        headers: { "x-company-code": decoded?.companyCode },
      })
      .then(({ data }) => {
        setSale(data);
        setErr("");
      })
      .catch((e) => {
        setErr(
          e?.response?.data?.error || e?.message || "Failed to load invoice"
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  const items = useMemo(
    () => (Array.isArray(sale?.items) ? sale.items : []),
    [sale]
  );

  const taxBreakup = useMemo(() => {
    const gstGroups = {};
    let totalTaxable = 0,
      totalDiscount = 0,
      totalGross = 0;
    for (const r of items) {
      const qty = Number(r.qty || 0);
      const rate = Number(r.rate || 0);
      const lineDiscount = Number(r.discount_amount || 0);
      const lineTaxable = Number(r.taxable_amount || qty * rate - lineDiscount);
      const gstPercent = Number(r.gst_percent || r.tax_percent || 0);
      const lineGstAmt = Number(r.gst_amount || 0);
      const lineC = Number(r.cgst_amount || 0);
      const lineS = Number(r.sgst_amount || 0);
      const lineI = Number(r.igst_amount || 0);
      const totalGst = lineGstAmt || lineC + lineS + lineI;
      const net = Number(r.net_total || lineTaxable + totalGst);

      totalTaxable += lineTaxable;
      totalDiscount += lineDiscount;
      totalGross += net;

      if (!gstGroups[gstPercent]) {
        gstGroups[gstPercent] = {
          taxable: 0,
          gst: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
        };
      }
      gstGroups[gstPercent].taxable += lineTaxable;
      gstGroups[gstPercent].gst += totalGst;
      gstGroups[gstPercent].cgst += lineC;
      gstGroups[gstPercent].sgst += lineS;
      gstGroups[gstPercent].igst += lineI;
    }

    Object.keys(gstGroups).forEach((percent) => {
      const group = gstGroups[percent];
      if (group.cgst + group.sgst + group.igst === 0 && group.gst > 0) {
        group.cgst = group.gst / 2;
        group.sgst = group.gst / 2;
      }
    });

    return {
      groups: gstGroups,
      totalTaxable,
      totalDiscount,
      totalGst: Object.values(gstGroups).reduce((s, g) => s + g.gst, 0),
      totalCgst: Object.values(gstGroups).reduce((s, g) => s + g.cgst, 0),
      totalSgst: Object.values(gstGroups).reduce((s, g) => s + g.sgst, 0),
      totalIgst: Object.values(gstGroups).reduce((s, g) => s + g.igst, 0),
      total: totalGross,
    };
  }, [items]);

  // Robust PDF Generation Function (renders crisp A4 pages)
  const handlePDF = async () => {
    if (!ref.current || isGeneratingPDF) {
      alert("Invoice not ready yet. Please try again.");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const originalElement = ref.current;
      const clone = originalElement.cloneNode(true);

      // Force clone to standard A4 printable dimensions
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.zIndex = "99999";
      clone.style.width = "794px";
      clone.style.display = "flex";
      clone.style.flexDirection = "column";
      clone.style.visibility = "visible";
      clone.style.background = "#ffffff";

      // Ensure all child invoice pages are visible
      const pages = clone.querySelectorAll(".invoice-page");
      pages.forEach((page) => {
        page.style.display = "flex";
        page.style.flexDirection = "column";
        page.style.width = "794px";
        page.style.height = "1122px";
        page.style.minHeight = "1122px";
        page.style.maxHeight = "1122px";
        page.style.padding = "30px 38px";
        page.style.boxSizing = "border-box";
        page.style.visibility = "visible";
        page.style.boxShadow = "none";
      });

      clone
        .querySelectorAll(".no-print")
        .forEach((el) => (el.style.display = "none"));

      document.body.appendChild(clone);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage("a4", "portrait");

        const canvas = await html2canvas(pages[i], {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
          allowTaint: true,
          onclone: (clonedDoc) => {
            const allElements = clonedDoc.querySelectorAll("*");
            allElements.forEach((el) => {
              const style = window.getComputedStyle(el);
              const bg = style.backgroundColor;
              const color = style.color;
              if (bg && bg.includes("oklch")) {
                el.style.backgroundColor = "#ffffff";
              }
              if (color && color.includes("oklch")) {
                el.style.color = "#000000";
              }
            });
          },
        });

        const imgData = canvas.toDataURL("image/png", 1.0);
        pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
      }

      document.body.removeChild(clone);

      const invoiceNo = sale?.bill_no ? `SALE-${sale.bill_no}` : "invoice";
      pdf.save(`${invoiceNo}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleWhatsAppShare = () => {
    const phone = String(party?.mobile_no || "").replace(/\D/g, "");
    if (!phone) return alert("No customer mobile number");

    const token = encryptInvoicePayload({
      id: sale?.id,
      companyCode: sale?.company?.code,
      auto: sale?.id,
    });

    const url = `${window.location.origin}/sales-invoice/${token}`;

    const message = `Hello,
Invoice No: ${sale.bill_no}
Amount: ₹ ${fmt(
      Number(taxBreakup.total || 0) + Number(sale.other_amount || 0)
    )}

${url}`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  useEffect(() => {
    if (!sale) return;

    const fetchData = async () => {
      try {
        const res = await api.get("/vendor-bank-details/fetchByName", {
          params: { mobile_no: sale.party_phone },
        });
        setPatyBank(res?.data?.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [sale]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Loader2 className="w-10 h-10 text-green-700 animate-spin mb-3" />
        <div className="text-gray-700 font-medium text-base">Loading invoice details...</div>
        <div className="text-gray-400 text-xs mt-1">Please wait a moment</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-md w-full shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Invoice Error</h2>
          <p className="text-sm text-red-600 mb-4">{err}</p>
          <button
            onClick={() => nav(-1)}
            className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg text-xs"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-gray-600">
        No invoice data available.
      </div>
    );
  }

  const company = sale.company || {};
  const party = {
    name: sale.party_name || sale.customer_name,
    gst_no: sale.party_gst || sale.gst_no,
    address: sale.party_address || sale.address,
    mobile_no: sale.party_phone || sale.mobile_no,
    email: sale.party_email || sale.email,
    state_name:
      sale.party_state_name || sale.place_of_supply || sale.state_name,
    state_code: sale.party_state_code || sale.state_code,
  };

  const image_url = import.meta.env.VITE_IMAGE_URL;

  const grandTotal =
    Number(taxBreakup.total || 0) + Number(sale.other_amount || 0);
  const paidAmount = Number(sale?.paid_amount || 0);
  const remainingAmount = grandTotal - paidAmount;

  return (
    <div className="invoice-root-container flex flex-col items-center min-h-screen bg-gray-100 text-gray-900">
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 6mm 8mm;
            }
            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .invoice-root-container {
              display: block !important;
              min-height: 0 !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: transparent !important;
            }
            .no-print,
            .mobile-invoice-view {
              display: none !important;
            }
            .a4-container-wrap,
            #invoice-wrap {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              gap: 0 !important;
            }
            .invoice-page {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              box-sizing: border-box !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
              overflow: visible !important;
            }
            .invoice-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .invoice-outer-box {
              border: 1px solid black !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              height: auto !important;
              min-height: 0 !important;
            }
          }
        `}
      </style>

      {/* TOP ACTION & NAVIGATION BAR */}
      <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur border-b border-gray-200 px-3 py-2.5 shadow-sm no-print">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Back & Invoice Info */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => nav(-1)}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="text-xs font-bold text-gray-900 leading-none">
                Invoice #{safe(sale.bill_no, "")}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {safe(formatDateTime(sale.bill_date), "")}
              </div>
            </div>
          </div>

          {/* Center: View Switcher (Mobile / A4 Sheet) */}
          {/* <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("mobile")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${activeView === "mobile"
                  ? "bg-white text-green-700 shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("a4")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${activeView === "a4"
                  ? "bg-white text-green-700 shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 Sheet</span>
            </button>
          </div> */}

          {/* Right: Actions (Download PDF, Print, WhatsApp) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs py-1.5 px-3 rounded-lg shadow-sm transition"
              title="Download Invoice PDF"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPDF ? "PDF..." : "Download"}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold text-xs py-1.5 px-3 rounded-lg shadow-sm transition"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg shadow-sm transition"
              title="Send via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. DEDICATED MOBILE INVOICE VIEW (Clean, Responsive, Card UI) */}
      {/* ============================================================== */}
      {activeView === "mobile" && (
        <div className="mobile-invoice-view w-full max-w-md px-3 py-4 flex flex-col gap-3.5 no-print">

          {/* Company & Invoice Header Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <img
                src={
                  company?.image_url
                    ? `${image_url}${company.image_url}`
                    : "/img/image.png"
                }
                alt="Logo"
                className="w-14 h-14 border border-gray-200 rounded-xl object-contain p-1 shrink-0 bg-white shadow-xs"
                crossOrigin="anonymous"
              />
              <div className="min-w-0 flex-1">
                <div className="text-base font-extrabold text-green-700 leading-tight uppercase truncate">
                  {safe(company.name, "Bhumisha Organics")}
                </div>
                <div className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-tight">
                  {safe(company.address, "")}
                </div>
                {company.gst_no && (
                  <div className="text-[11px] font-semibold text-gray-700 mt-1">
                    GSTIN: <span className="font-mono font-normal">{company.gst_no}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metadata Grid */}
            <div className="pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="bg-green-700 text-white font-bold text-[11px] px-2 py-0.5 rounded">
                    TAX INVOICE
                  </span>
                  <span className="bg-gray-100 text-gray-700 font-semibold text-[10px] px-1.5 py-0.5 rounded border border-gray-200">
                    ORIGINAL
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Invoice No.</span>
                  <span className="font-mono font-bold text-gray-900 text-xs">
                    #{safe(sale.bill_no, "")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-xl p-2.5 mt-2 border border-gray-100">
                <div>
                  <span className="text-gray-400 text-[10px] uppercase block">Invoice Date</span>
                  <span className="font-medium text-gray-800">
                    {safe(formatDateTime(sale.bill_date), "—")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase block">Challan Date</span>
                  <span className="font-medium text-gray-800">
                    {safe(formatDateTime(sale.challan_date) || formatDateTime(sale.bill_date), "—")}
                  </span>
                </div>
                {sale.vehicle_no && sale.vehicle_no !== "—" && (
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase block">Vehicle No.</span>
                    <span className="font-medium text-gray-800">{sale.vehicle_no}</span>
                  </div>
                )}
                {sale.transport && (
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase block">Transport</span>
                    <span className="font-medium text-gray-800">{sale.transport}</span>
                  </div>
                )}
                {sale.eway_bill_no && (
                  <div className="col-span-2">
                    <span className="text-gray-400 text-[10px] uppercase block">E-Way Bill</span>
                    <span className="font-mono font-medium text-gray-800">{sale.eway_bill_no}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount Due Highlight Banner */}
          <div className="bg-gradient-to-r from-green-700 to-emerald-800 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] text-green-100 uppercase tracking-wider font-medium">Grand Total</div>
              <div className="text-2xl font-black tracking-tight">₹ {fmt(grandTotal)}</div>
              {paidAmount > 0 && (
                <div className="text-[11px] text-green-200 mt-0.5">
                  Paid: ₹ {fmt(paidAmount)}
                </div>
              )}
            </div>

            <div className="text-right">
              {remainingAmount > 0 ? (
                <div className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-xl border border-white/30">
                  <div className="text-[10px] uppercase font-bold text-red-200">Balance Due</div>
                  <div className="text-base font-extrabold text-white">₹ {fmt(remainingAmount)}</div>
                </div>
              ) : (
                <div className="bg-emerald-500/40 backdrop-blur px-3 py-1.5 rounded-xl border border-emerald-300/40 flex items-center gap-1 text-xs font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Fully Paid</span>
                </div>
              )}
            </div>
          </div>

          {/* Bill To & Customer Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">
              Billed To (Customer)
            </div>
            <div className="font-bold text-gray-900 text-base">{safe(party.name, "—")}</div>

            {party.address && (
              <div className="text-xs text-gray-600 mt-1.5 flex items-start gap-1.5 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span>{party.address}</span>
              </div>
            )}

            <div className="mt-2.5 pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
              {party.mobile_no && (
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Mobile</span>
                  <a
                    href={`tel:${party.mobile_no}`}
                    className="text-green-700 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{party.mobile_no}</span>
                  </a>
                </div>
              )}

              {party.gst_no && (
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">GSTIN</span>
                  <span className="font-mono font-semibold text-gray-800">{party.gst_no}</span>
                </div>
              )}

              {party.state_name && (
                <div className="col-span-2">
                  <span className="text-gray-400 block text-[10px] uppercase">Place of Supply</span>
                  <span className="font-medium text-gray-800">{party.state_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Purchased Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-gray-900 text-sm">Items Summary</div>
              <div className="text-xs text-gray-500 font-medium">
                {items.length} {items.length === 1 ? "Item" : "Items"}
              </div>
            </div>

            <div className="space-y-3">
              {items.map((r, i) => {
                const qty = Number(r.qty || 0);
                const rate = Number(r.rate || 0);
                const discAmt = Number(r.discount_amount || 0);
                const taxable = Number(r.taxable_amount || qty * rate - discAmt);
                const gstp = Number(r.gst_percent || r.tax_percent || 0);
                const gstAmt =
                  Number(r.gst_amount || r.cgst_amount || 0) +
                  Number(r.sgst_amount || 0) +
                  Number(r.igst_amount || 0) || (taxable * gstp) / 100;
                const net = Number(r.net_total || taxable + gstAmt);
                const unit = r.unit || r.unit_code || "NOS";
                const desc = r.item_name || r.product_name || `#${r.product_id}`;

                return (
                  <div
                    key={r.id || i}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-gray-900 text-sm leading-tight">
                          {i + 1}. {desc}
                        </div>
                        {r.hsn_code && (
                          <span className="inline-block mt-1 text-[10px] font-mono bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                            HSN: {r.hsn_code}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-gray-900 text-sm">₹ {fmt(net)}</div>
                        <div className="text-[10px] text-gray-500">
                          {fmt(gstp, 0)}% GST
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-dashed border-gray-200 grid grid-cols-3 gap-2 text-xs text-gray-600">
                      <div>
                        <div className="text-[9px] text-gray-400 uppercase font-semibold">Qty</div>
                        <div className="font-medium text-gray-900">
                          {fmt(qty)} {unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-400 uppercase font-semibold">Rate</div>
                        <div className="font-medium text-gray-900">₹ {fmt(rate)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-gray-400 uppercase font-semibold">Taxable</div>
                        <div className="font-medium text-gray-900">₹ {fmt(taxable)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Amount Breakdown Summary Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 space-y-2 text-xs">
            <div className="font-bold text-gray-900 text-sm mb-2">Price Breakdown</div>

            <div className="flex justify-between text-gray-600">
              <span>Total Taxable Amount</span>
              <span className="font-medium text-gray-900">₹ {fmt(taxBreakup.totalTaxable)}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Total GST</span>
              <span className="font-medium text-gray-900">₹ {fmt(taxBreakup.totalGst)}</span>
            </div>

            {Number(sale.other_amount || 0) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Transport / Freight</span>
                <span className="font-medium text-gray-900">₹ {fmt(sale.other_amount)}</span>
              </div>
            )}

            {taxBreakup.totalDiscount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span className="font-semibold">- ₹ {fmt(taxBreakup.totalDiscount)}</span>
              </div>
            )}

            <div className="border-t border-gray-200 my-2 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">Grand Total</span>
                <span className="font-bold text-gray-900 text-base">₹ {fmt(grandTotal)}</span>
              </div>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Paid Amount</span>
              <span className="font-semibold text-emerald-700">₹ {fmt(paidAmount)}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
              <span className="font-bold text-red-600 text-xs">Remaining Balance</span>
              <span className="font-extrabold text-red-600 text-base">₹ {fmt(remainingAmount)}</span>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500 leading-snug">
              <span className="font-semibold text-gray-700">Total in words: </span>
              {toWords(grandTotal)} Rupees Only
            </div>
          </div>

          {/* Bank & Payment Details Card (with 1-click copy buttons!) */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-gray-900 text-sm">Bank & Payment Details</span>
              </div>
              <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                For Payment
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-emerald-100/80">
                <span className="text-gray-600">Bank Name</span>
                <span className="font-medium text-gray-900">{patyBank?.bank_name || "Bank Of India"}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-emerald-100/80">
                <span className="text-gray-600">Branch</span>
                <span className="font-medium text-gray-900">{patyBank?.branch_name || "Gulmohar"}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-emerald-100/80">
                <span className="text-gray-600">Account No.</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-gray-900 text-xs">
                    {patyBank?.account_number || "900920110000551"}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        patyBank?.account_number || "900920110000551",
                        "acc"
                      )
                    }
                    className="p-1 hover:bg-emerald-200/70 rounded transition text-emerald-800"
                    title="Copy Account Number"
                  >
                    {copiedField === "acc" ? (
                      <span className="text-[10px] font-bold text-green-700 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Copied
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-emerald-100/80">
                <span className="text-gray-600">IFSC Code</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-gray-900 text-xs">
                    {patyBank?.ifsc_code || "BKID0009009"}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(patyBank?.ifsc_code || "BKID0009009", "ifsc")
                    }
                    className="p-1 hover:bg-emerald-200/70 rounded transition text-emerald-800"
                    title="Copy IFSC Code"
                  >
                    {copiedField === "ifsc" ? (
                      <span className="text-[10px] font-bold text-green-700 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Copied
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {patyBank?.upi_id && patyBank?.upi_id !== "—" && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">UPI ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-emerald-800 text-xs">
                      {patyBank.upi_id}
                    </span>
                    <button
                      onClick={() => handleCopy(patyBank.upi_id, "upi")}
                      className="p-1 hover:bg-emerald-200/70 rounded transition text-emerald-800"
                      title="Copy UPI ID"
                    >
                      {copiedField === "upi" ? (
                        <span className="text-[10px] font-bold text-green-700 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Conditions Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 text-xs space-y-2">
            <div className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
              Terms and Conditions
            </div>
            <div className="text-[11px] text-gray-600 whitespace-pre-line leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              {sale.remarks ||
                `1. Subject to Bhopal Jurisdiction.
2. Our Responsibility Ceases as soon as goods leaves our Premises.
3. Goods once sold will not taken back.
4. Transport as per actual.
5. Total payment due in 15 days`}
            </div>

            <div className="pt-3 border-t border-gray-100 flex flex-col items-center text-center">
              <div className="text-xs font-bold text-gray-800">
                For {company?.name || "Bhumisha Organics"}
              </div>
              <div className="mt-4 border-t border-gray-400 w-36 pt-1 text-[11px] font-semibold text-gray-700">
                Authorised Signatory
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                This is a computer generated invoice, no signature required.
              </div>
            </div>
          </div>

          {/* Bottom Primary Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handlePDF}
              disabled={isGeneratingPDF}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-xl shadow-md transition text-sm"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingPDF ? "Generating PDF..." : "Download Official A4 PDF"}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {/* <button
                onClick={() => setViewMode("a4")}
                className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 px-3 rounded-xl border border-gray-200 text-xs transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View A4 Sheet</span>
              </button> */}

              <button
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WhatsApp</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 2. OFFICIAL A4 DOCUMENT VIEW (Full Sheet / Print / PDF clone) */}
      {/* ============================================================== */}
      <div
        className={`a4-container-wrap w-full ${activeView === "a4" ? "block" : "hidden md:block"
          }`}
      >
        <div className="w-full overflow-x-auto pb-6 pt-2 px-2 flex flex-col items-center">
          {activeView === "a4" && isMobileScreen && (
            <div className="mb-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 no-print shadow-xs">
              <span>↔️</span>
              <span>Swipe horizontally to view the full document</span>
            </div>
          )}

          <div
            ref={ref}
            id="invoice-wrap"
            className="flex flex-col gap-8 w-full items-center"
            style={{ minWidth: "210mm" }}
          >
            {(grandTotal >= 100000
              ? ["ORIGINAL FOR RECIPIENT", "FOR TRANSPORT"]
              : ["ORIGINAL FOR RECIPIENT"]
            ).map((printType, index) => (
              <div
                key={index}
                className="invoice-page bg-white text-black shadow-lg"
                style={{
                  width: "210mm",
                  height: "297mm",
                  minHeight: "297mm",
                  maxHeight: "297mm",
                  padding: "8mm 10mm",
                  background: "#ffffff",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "10px",
                  boxSizing: "border-box",
                }}
              >
                {/* Header Title */}
                <div className="flex gap-2 mb-1.5 items-center">
                  <span className="font-bold text-sm tracking-wide">TAX INVOICE</span>
                  <span className="border border-black px-1.5 py-0.5 text-[10px] font-semibold">{printType}</span>
                </div>

                {/* Main Outer Border */}
                <div className="invoice-outer-box border border-black flex flex-col">

                  {/* Row 1: Company & Invoice Info */}
                  <div className="grid grid-cols-2 border-b border-black">
                    {/* Company Details */}
                    <div className="p-2.5 border-r border-black flex items-start gap-2.5">
                      <img
                        src={
                          company?.image_url
                            ? `${image_url}${company.image_url}`
                            : "/img/image.png"
                        }
                        alt="Logo"
                        className="w-20 h-20 border border-black object-contain shrink-0"
                        crossOrigin="anonymous"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[16px] font-extrabold text-green-700 leading-tight uppercase">
                          {safe(company.name, "")}
                        </div>
                        <div className="text-[10px] mt-1 leading-tight">
                          {safe(company.address, "")}
                        </div>
                        <div className="text-[10px] mt-1 font-semibold">
                          GSTIN: <span className="font-normal">{safe(company.gst_no, "")}</span>
                        </div>
                        <div className="text-[10px] font-semibold">
                          Mobile: <span className="font-normal">{safe(company.contact_no, "")}</span>
                        </div>
                        <div className="text-[10px] font-semibold">
                          Email: <span className="font-normal">{safe(company.email, "")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="p-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                      <div className="flex flex-col">
                        <div className="font-semibold">Invoice No.</div>
                        <div>{safe(sale.bill_no, "")}</div>
                      </div>
                      <div className="flex flex-col">
                        <div className="font-semibold">Invoice Date</div>
                        <div>{safe(formatDateTime(sale.bill_date), "")}</div>
                      </div>
                      <div className="flex flex-col">
                        <div className="font-semibold">Challan Date</div>
                        <div>
                          {safe(
                            formatDateTime(sale.challan_date) ||
                            formatDateTime(sale.bill_date),
                            ""
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="font-semibold">E-Way Bill No.</div>
                        <div>{safe(sale.eway_bill_no, "")}</div>
                      </div>
                      <div className="flex flex-col">
                        <div className="font-semibold">Transport</div>
                        <div>{safe(sale.transport, "")}</div>
                      </div>
                      <div className="flex flex-col">
                        <div className="font-semibold">Vehicle No.</div>
                        <div>{safe(sale.vehicle_no, "—")}</div>
                      </div>
                      <div className="flex flex-col">
                        <div className="font-semibold">Transport ID</div>
                        <div>{safe(sale.transport_id, "")}</div>
                      </div>
                      <div className="flex flex-col">
                        <div className="font-semibold">Transport Amount</div>
                        <div>{fmt(sale.other_amount)}</div>
                      </div>
                      <div className="col-span-2 flex flex-col">
                        <div className="font-semibold">Remark</div>
                        <div>{safe(sale.other_note, "—")}</div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Bill To & Ship To */}
                  <div className="grid grid-cols-2 border-b border-black">
                    {/* BILL TO */}
                    <div className="p-2.5 border-r border-black">
                      <div className="font-semibold mb-1">BILL TO</div>
                      <div className="font-bold text-[12px]">{safe(party.name, "")}</div>
                      <div className="mt-1">
                        <span className="font-semibold">Address:</span> {safe(party.address, "")}
                      </div>
                      <div className="mt-1 flex justify-between">
                        <div>
                          <span className="font-semibold">GSTIN:</span> {safe(party.gst_no, "")}
                        </div>
                        <div>
                          <span className="font-semibold">Place of Supply:</span>{" "}
                          {safe(party.state_name || party.address, "")}
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="font-semibold">Mobile:</span> {safe(party?.mobile_no, "")}
                      </div>
                    </div>

                    {/* SHIP TO */}
                    <div className="p-2.5">
                      <div className="font-semibold mb-1">SHIP TO</div>
                      <div className="font-bold text-[12px]">{safe(party.name, "")}</div>
                      <div className="mt-1">
                        <span className="font-semibold">Address:</span> {safe(party.address, "")}
                      </div>
                      <div className="mt-1 flex justify-between">
                        <div>
                          <span className="font-semibold">GSTIN:</span> {safe(party.gst_no, "")}
                        </div>
                        <div>
                          <span className="font-semibold">Place of Supply:</span>{" "}
                          {safe(party.state_name || party.address, "")}
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="font-semibold">Mobile:</span> {safe(party?.mobile_no, "")}
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border-b border-black w-full min-h-[140px]">
                    <table className="w-full border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-[#e6f2e6] border-b border-black">
                          <th className="border-r border-black py-1.5 px-2 w-8">S.NO.</th>
                          <th className="border-r border-black py-1.5 px-2 text-left">ITEMS</th>
                          <th className="border-r border-black py-1.5 px-2 w-16">HSN/SAC</th>
                          <th className="border-r border-black py-1.5 px-2 w-12">QTY.</th>
                          <th className="border-r border-black py-1.5 px-2 w-12">UNIT</th>
                          <th className="border-r border-black py-1.5 px-2 w-16">RATE</th>
                          <th className="border-r border-black py-1.5 px-2 w-20">TAXABLE</th>
                          <th className="border-r border-black py-1.5 px-2 w-12">% GST</th>
                          <th className="py-1.5 px-2 w-24 text-right">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((r, i) => {
                          const qty = Number(r.qty || 0);
                          const rate = Number(r.rate || 0);
                          const discAmt = Number(r.discount_amount || 0);
                          const taxable = Number(r.taxable_amount || qty * rate - discAmt);
                          const gstp = Number(r.gst_percent || r.tax_percent || 0);
                          const gstAmt =
                            Number(r.gst_amount || r.cgst_amount || 0) +
                            Number(r.sgst_amount || 0) +
                            Number(r.igst_amount || 0) || (taxable * gstp) / 100;
                          const net = Number(r.net_total || taxable + gstAmt);
                          const unit = r.unit || r.unit_code || "NOS";
                          const desc = r.item_name || r.product_name || `#${r.product_id}`;

                          return (
                            <tr key={r.id || i} className="align-top border-b border-[#ddd]">
                              <td className="border-r border-black py-1 px-2 text-center">{i + 1}</td>
                              <td className="border-r border-black py-1 px-2">{desc}</td>
                              <td className="border-r border-black py-1 px-2 text-center">{safe(r.hsn_code, "—")}</td>
                              <td className="border-r border-black py-1 px-2 text-center">{fmt(qty)}</td>
                              <td className="border-r border-black py-1 px-2 text-center">{unit}</td>
                              <td className="border-r border-black py-1 px-2 text-right">{fmt(rate)}</td>
                              <td className="border-r border-black py-1 px-2 text-right">{fmt(taxable)}</td>
                              <td className="border-r border-black py-1 px-2 text-center">{fmt(gstp, 0)}%</td>
                              <td className="py-1 px-2 text-right">{fmt(net)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#e6f2e6] border-y border-black font-semibold">
                          <td colSpan={3} className="border-r border-black py-1.5 px-2 text-right">TOTAL</td>
                          <td className="border-r border-black py-1.5 px-2 text-center">
                            {fmt(items.reduce((s, r) => s + Number(r.qty || 0), 0))}
                          </td>
                          <td colSpan={2} className="border-r border-black py-1.5 px-2"></td>
                          <td className="border-r border-black py-1.5 px-2 text-right">{fmt(taxBreakup.totalTaxable)}</td>
                          <td className="border-r border-black py-1.5 px-2"></td>
                          <td className="py-1.5 px-2 text-right">₹ {fmt(taxBreakup.total)}</td>
                        </tr>
                        <tr>
                          <td colSpan={8} className="border-r border-black py-1.5 px-2 text-right font-semibold">
                            TRANSPORT AMOUNT
                          </td>
                          <td className="py-1.5 px-2 text-right">₹ {fmt(sale.other_amount)}</td>
                        </tr>
                        {taxBreakup.totalDiscount > 0 && (
                          <tr>
                            <td colSpan={8} className="border-r border-black py-1.5 px-2 text-right font-semibold">
                              DISCOUNT
                            </td>
                            <td className="py-1.5 px-2 text-right">- ₹ {fmt(taxBreakup.totalDiscount)}</td>
                          </tr>
                        )}
                        <tr className="border-y border-black">
                          <td colSpan={8} className="border-r border-black py-1.5 px-2 text-right font-bold text-[12px]">
                            GRAND TOTAL
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-[12px]">₹ {fmt(grandTotal)}</td>
                        </tr>
                        <tr>
                          <td colSpan={8} className="border-r border-black py-1.5 px-2 text-right font-semibold">
                            PAID AMOUNT
                          </td>
                          <td className="py-1.5 px-2 text-right text-green-700 font-bold">₹ {fmt(paidAmount)}</td>
                        </tr>
                        <tr className="border-t border-black">
                          <td colSpan={8} className="border-r border-black py-1.5 px-2 text-right font-bold text-red-600">
                            REMAINING AMOUNT
                          </td>
                          <td className="py-1.5 px-2 text-right text-red-600 font-bold">₹ {fmt(remainingAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Amount in words */}
                  <div className="border-b border-black py-1.5 px-2.5 text-[10px]">
                    <span className="font-semibold">Total Amount (in words): </span>
                    {toWords(grandTotal)} Rupees Only
                  </div>

                  {/* Bottom Section: Bank | Terms | Signature */}
                  <div className="grid grid-cols-3 min-h-[100px]">
                    {/* Bank Details */}
                    <div className="p-2.5 border-r border-black">
                      <div className="font-semibold mb-1">Bank Details</div>
                      <div className="grid grid-cols-[70px_1fr] gap-x-1 text-[10px]">
                        <div>Bank Name:</div>
                        <div className="font-medium">{patyBank?.bank_name || "Bank Of India"}</div>
                        <div>Branch:</div>
                        <div className="font-medium">{patyBank?.branch_name || "Gulmohar"}</div>
                        <div>Account No:</div>
                        <div className="font-medium">{patyBank?.account_number || "900920110000551"}</div>
                        <div>IFSC Code:</div>
                        <div className="font-medium">{patyBank?.ifsc_code || "BKID0009009"}</div>
                        <div>UPI ID:</div>
                        <div className="font-medium">{patyBank?.upi_id || "—"}</div>
                      </div>
                    </div>

                    {/* Terms */}
                    <div className="p-2.5 border-r border-black">
                      <div className="font-semibold mb-1">Terms and Conditions</div>
                      <div className="whitespace-pre-line text-[9px] leading-tight">
                        {sale.remarks ||
                          `1. Subject to Bhopal Jurisdiction.
2. Our Responsibility Ceases as soon as goods leaves our Premises.
3. Goods once sold will not taken back.
4. Transport as per actual.
5. Total payment due in 15 days`}
                      </div>
                    </div>

                    {/* Signature */}
                    <div className="p-2.5 flex flex-col items-center justify-end text-center relative">
                      <div className="absolute top-2 font-semibold text-[10px]">
                        For {company?.name || "Bhumisha Organics"}
                      </div>
                      <div className="mt-8 border-t border-black w-3/4 pt-1 text-[10px] font-semibold">
                        Authorised Signatory
                      </div>
                      <div className="text-[8px] mt-1 text-gray-500">
                        This is a computer generated invoice, no signature required.
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
