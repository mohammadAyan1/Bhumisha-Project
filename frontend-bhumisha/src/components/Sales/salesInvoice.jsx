// src/components/Sales/SalesInvoicePrint.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import salesAPI from "../../axios/salesAPI";
import { api } from "../../axios/axios";
import { encryptInvoicePayload } from "../../utils/invoiceCrypto";
import { decryptInvoicePayload } from "../../utils/invoiceCrypto";

// Add this after the fmt and safe functions
const formatDateTime = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    // Format date as DD-MM-YYYY
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    // Format time as HH:MM
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch (error) {
    // If it's already in a simple format, return as is
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

  const location = useLocation();

  // Auto-download effect
  useEffect(() => {
    if (!sale) return;

    const queryParams = new URLSearchParams(location.search);
    const shouldAutoDownload = queryParams.get("autoDownload") === "true";

    if (shouldAutoDownload && sale && !isGeneratingPDF) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        handlePDF();
      }, 500);
    }
  }, [sale, location.search, isGeneratingPDF]);

  const ref = useRef(null);

  const { token } = useParams();

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
    // Group by GST percentage
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

    // For each group, if no specific CGST/SGST/IGST, assume CGST = SGST = GST/2
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

  // FIXED: PDF Generation Function
  const handlePDF = async () => {
    if (!ref.current || isGeneratingPDF) {
      alert("Invoice not ready yet. Please try again.");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Create a clone of the invoice for PDF generation
      const originalElement = ref.current;
      const clone = originalElement.cloneNode(true);

      // Position clone off-screen
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.zIndex = "99999";
      clone.style.width = "794px";
      clone.style.background = "#ffffff";

      // Remove any existing print-specific styles
      clone
        .querySelectorAll(".no-print")
        .forEach((el) => (el.style.display = "none"));

      // Add the clone to document
      document.body.appendChild(clone);

      // Wait a bit for DOM to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        allowTaint: true,
        // FIXED: Only target unsupported color functions, not all styles
        onclone: (clonedDoc) => {
          // Remove problematic color functions only
          const root = clonedDoc.getElementById("invoice-wrap");
          if (!root) return;

          const allElements = root.querySelectorAll("*");
          allElements.forEach((el) => {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundColor;
            const color = style.color;

            // Convert oklch to hex if found
            if (bg && bg.includes("oklch")) {
              el.style.backgroundColor = "#ffffff";
            }
            if (color && color.includes("oklch")) {
              el.style.color = "#000000";
            }
          });
        },
      });

      // Remove clone from document
      document.body.removeChild(clone);

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(
        canvas.toDataURL("image/png", 1.0),
        "PNG",
        0,
        0,
        imgWidth,
        imgHeight
      );

      // Save PDF with invoice number
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
Amount: ₹ ${fmt(Number(taxBreakup.total || 0) + Number(sale.other_amount || 0))}

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

  if (loading) return <div>Loading...</div>;
  if (err) return <div style={{ color: "red" }}>{err}</div>;
  if (!sale) return <div>No data</div>;

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

  const grandTotal = Number(taxBreakup.total || 0) + Number(sale.other_amount || 0);
  const paidAmount = Number(sale?.paid_amount || 0);
  const remainingAmount = grandTotal - paidAmount;

  return (
    <div className="flex flex-col items-center py-2 bg-gray-50 min-h-screen">
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 5mm;
            }
            body { background: white; margin: 0; padding: 0; }
            .no-print { display: none !important; }
            .invoice-page {
              width: 100% !important;
              height: 280mm !important;
              min-height: 280mm !important;
              max-height: 280mm !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              page-break-after: always;
              break-after: page;
              overflow: hidden;
            }
            .invoice-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            #invoice-wrap {
              gap: 0 !important;
            }
          }
        `}
      </style>

      <div className="flex gap-2 mb-2 no-print">
        <button
          onClick={() => window.print()}
          className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-1 px-3 rounded shadow text-sm"
        >
          Print
        </button>

        <button
          onClick={handleWhatsAppShare}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded shadow text-sm"
          title="Send via WhatsApp"
        >
          WhatsApp
        </button>
        <button
          onClick={() => nav(-1)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded shadow text-sm"
        >
          Back
        </button>
      </div>

      <div ref={ref} id="invoice-wrap" className="flex flex-col gap-8 w-full items-center">
        {(grandTotal >= 100000 
          ? ["ORIGINAL FOR RECIPIENT", "FOR TRANSPORT"] 
          : ["ORIGINAL FOR RECIPIENT"]
        ).map((printType, index) => (
          <div
            key={index}
            className="invoice-page bg-white text-black shadow p-2"
            style={{
              width: "210mm",
              minHeight: "297mm",
              background: "#ffffff",
              fontFamily: "Arial, sans-serif",
              fontSize: "10px",
              boxSizing: "border-box",
            }}
          >
            {/* Header Title */}
            <div className="flex gap-2 mb-1 items-center">
              <span className="font-bold text-sm">TAX INVOICE</span>
              <span className="border border-black px-1 text-[10px]">{printType}</span>
            </div>

            {/* Main Outer Border */}
            <div className="border border-black flex flex-col h-[calc(100%-30px)]">
              
              {/* Row 1: Company & Invoice Info */}
              <div className="grid grid-cols-2 border-b border-black">
                {/* Company Details */}
                <div className="p-2 border-r border-black flex items-start gap-2">
                  <img
                    src={company?.image_url ? `${image_url}${company.image_url}` : "/img/image.png"}
                    alt="Logo"
                    className="w-20 h-20 border border-black object-contain"
                    crossOrigin="anonymous"
                  />
                  <div className="flex-1">
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
                <div className="p-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
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
                    <div>{safe(formatDateTime(sale.challan_date) || formatDateTime(sale.bill_date), "")}</div>
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
                <div className="p-2 border-r border-black">
                  <div className="font-semibold mb-1">BILL TO</div>
                  <div className="font-bold text-[12px]">{safe(party.name, "")}</div>
                  <div className="mt-1">
                    <span className="font-semibold">Address:</span> {safe(party.address, "")}
                  </div>
                  <div className="mt-1 flex justify-between">
                    <div><span className="font-semibold">GSTIN:</span> {safe(party.gst_no, "")}</div>
                    <div><span className="font-semibold">Place of Supply:</span> {safe(party.state_name || party.address, "")}</div>
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold">Mobile:</span> {safe(party?.mobile_no, "")}
                  </div>
                </div>

                {/* SHIP TO */}
                <div className="p-2">
                  <div className="font-semibold mb-1">SHIP TO</div>
                  <div className="font-bold text-[12px]">{safe(party.name, "")}</div>
                  <div className="mt-1">
                    <span className="font-semibold">Address:</span> {safe(party.address, "")}
                  </div>
                  <div className="mt-1 flex justify-between">
                    <div><span className="font-semibold">GSTIN:</span> {safe(party.gst_no, "")}</div>
                    <div><span className="font-semibold">Place of Supply:</span> {safe(party.state_name || party.address, "")}</div>
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold">Mobile:</span> {safe(party?.mobile_no, "")}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="flex-1 border-b border-black">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-[#e6f2e6] border-b border-black">
                      <th className="border-r border-black py-1 px-1 w-8">S.NO.</th>
                      <th className="border-r border-black py-1 px-1 text-left">ITEMS</th>
                      <th className="border-r border-black py-1 px-1 w-16">HSN/SAC</th>
                      <th className="border-r border-black py-1 px-1 w-12">QTY.</th>
                      <th className="border-r border-black py-1 px-1 w-12">UNIT</th>
                      <th className="border-r border-black py-1 px-1 w-16">RATE</th>
                      <th className="border-r border-black py-1 px-1 w-20">TAXABLE</th>
                      <th className="border-r border-black py-1 px-1 w-12">% GST</th>
                      <th className="py-1 px-1 w-24 text-right">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r, i) => {
                      const qty = Number(r.qty || 0);
                      const rate = Number(r.rate || 0);
                      const discAmt = Number(r.discount_amount || 0);
                      const taxable = Number(r.taxable_amount || qty * rate - discAmt);
                      const gstp = Number(r.gst_percent || r.tax_percent || 0);
                      const gstAmt = Number(r.gst_amount || r.cgst_amount || 0) + Number(r.sgst_amount || 0) + Number(r.igst_amount || 0) || (taxable * gstp) / 100;
                      const net = Number(r.net_total || taxable + gstAmt);
                      const unit = r.unit || r.unit_code || "NOS";
                      const desc = r.item_name || r.product_name || `#${r.product_id}`;
                      
                      return (
                        <tr key={r.id || i} className="align-top border-b border-[#ddd]">
                          <td className="border-r border-black py-1 px-1 text-center">{i + 1}</td>
                          <td className="border-r border-black py-1 px-1">{desc}</td>
                          <td className="border-r border-black py-1 px-1 text-center">{safe(r.hsn_code, "—")}</td>
                          <td className="border-r border-black py-1 px-1 text-center">{fmt(qty)}</td>
                          <td className="border-r border-black py-1 px-1 text-center">{unit}</td>
                          <td className="border-r border-black py-1 px-1 text-right">{fmt(rate)}</td>
                          <td className="border-r border-black py-1 px-1 text-right">{fmt(taxable)}</td>
                          <td className="border-r border-black py-1 px-1 text-center">{fmt(gstp, 0)}%</td>
                          <td className="py-1 px-1 text-right">{fmt(net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#e6f2e6] border-y border-black font-semibold">
                      <td colSpan={3} className="border-r border-black py-1 px-2 text-right">TOTAL</td>
                      <td className="border-r border-black py-1 px-1 text-center">{fmt(items.reduce((s, r) => s + Number(r.qty || 0), 0))}</td>
                      <td colSpan={2} className="border-r border-black py-1 px-1"></td>
                      <td className="border-r border-black py-1 px-1 text-right">{fmt(taxBreakup.totalTaxable)}</td>
                      <td className="border-r border-black py-1 px-1"></td>
                      <td className="py-1 px-1 text-right">₹ {fmt(taxBreakup.total)}</td>
                    </tr>
                    <tr>
                      <td colSpan={8} className="border-r border-black py-1 px-2 text-right font-semibold">TRANSPORT AMOUNT</td>
                      <td className="py-1 px-1 text-right">₹ {fmt(sale.other_amount)}</td>
                    </tr>
                    {taxBreakup.totalDiscount > 0 && (
                      <tr>
                        <td colSpan={8} className="border-r border-black py-1 px-2 text-right font-semibold">DISCOUNT</td>
                        <td className="py-1 px-1 text-right">- ₹ {fmt(taxBreakup.totalDiscount)}</td>
                      </tr>
                    )}
                    <tr className="border-y border-black">
                      <td colSpan={8} className="border-r border-black py-1 px-2 text-right font-bold text-[12px]">GRAND TOTAL</td>
                      <td className="py-1 px-1 text-right font-bold text-[12px]">₹ {fmt(grandTotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={8} className="border-r border-black py-1 px-2 text-right font-semibold">PAID AMOUNT</td>
                      <td className="py-1 px-1 text-right text-green-700 font-bold">₹ {fmt(paidAmount)}</td>
                    </tr>
                    <tr className="border-t border-black">
                      <td colSpan={8} className="border-r border-black py-1 px-2 text-right font-bold text-red-600">REMAINING AMOUNT</td>
                      <td className="py-1 px-1 text-right text-red-600 font-bold">₹ {fmt(remainingAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount in words */}
              <div className="border-b border-black p-1 text-[10px]">
                <span className="font-semibold">Total Amount (in words): </span>
                {toWords(grandTotal)} Rupees Only
              </div>

              {/* Bottom Section: Bank | Terms | Signature */}
              <div className="grid grid-cols-3 min-h-[100px]">
                {/* Bank Details */}
                <div className="p-2 border-r border-black">
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
                <div className="p-2 border-r border-black">
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
                <div className="p-2 flex flex-col items-center justify-end text-center relative">
                  <div className="absolute top-2 font-semibold text-[10px]">For {company?.name || "Bhumisha Organics"}</div>
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
  );
}
