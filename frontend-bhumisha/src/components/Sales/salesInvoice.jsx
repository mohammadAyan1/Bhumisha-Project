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

  // Split items into chunks for better display (15 items per page/block)
  const itemsPerPage = 15;
  const itemChunks = [];
  for (let i = 0; i < items.length; i += itemsPerPage) {
    itemChunks.push(items.slice(i, i + itemsPerPage));
  }

  return (
    <div className="flex flex-col items-center py-2 bg-gray-50 min-h-screen">
      <div className="flex gap-2 mb-2 no-print">
        <button
          onClick={() => window.print()}
          className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-1 px-3 rounded shadow text-sm"
        >
          Print
        </button>

        {/* <button
          onClick={handlePDF}
          disabled={isGeneratingPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded shadow text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
        </button> */}

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

      {/* Invoice Container - Fixed width for consistent PDF output */}
      <div
        id="invoice-wrap"
        ref={ref}
        className="bg-white text-black shadow p-2"
        style={{
          width: "794px", // Fixed width for PDF (A4 width in pixels)
          minHeight: "1123px", // A4 height in pixels
          background: "#ffffff",
          fontFamily: "Arial, sans-serif",
          fontSize: "10px",
          boxSizing: "border-box",
          margin: "0 auto",
        }}
      >
        {/* Outer border - reduced margins */}
        <div className="border border-black m-1 p-1">
          {/* Top Brand Header - Compact */}
          <div className="flex items-start gap-2">
            <img
              src={
                company?.image_url
                  ? `${image_url}${company.image_url}`
                  : "/img/image.png"
              }
              alt="Logo"
              className="w-20 h-20 border border-black object-contain mt-1"
              crossOrigin="anonymous"
            />
            <div className="flex-1">
              <div
                className="text-[20px] font-extrabold tracking-wide leading-tight"
                style={{ color: "#008000" }}
              >
                {safe(company.name, "")}
              </div>
              <div
                className="text-[10px] py-0.5 px-1 inline-block text-white mt-0.5"
                style={{ background: "#0aa37f", borderRadius: "2px" }}
              >
                Close to Nature
              </div>
              <div className="text-[9px] mt-0.5 leading-tight">
                {safe(company.address, "")}
              </div>
              <div className="text-[9px] leading-tight">
                Mob: {safe(company.contact_no, "")} &nbsp; Web:{" "}
                {safe("www.bhumishaorganics.com")} &nbsp; Email:{" "}
                {safe(company.email, "")}
              </div>
            </div>
            <div className="text-right text-[9px] min-w-[100px]">
              <div className="font-semibold">
                GST NO : {safe(company.gst_no, "")}
              </div>
              <div className="mt-0.5 border border-black px-1 py-0.5 text-[11px] font-bold">
                TAX INVOICE
              </div>
              <div className="text-[8px] mt-0.5">ORIGINAL FOR RECIPIENT</div>
            </div>
          </div>

          {/* Customer + Invoice Meta - Compact */}
          <div className="grid grid-cols-3 gap-1 mt-1 text-[9px]">
            <div className="border border-black">
              <div className="bg-gray-100 border-b border-black px-1 py-0.5 font-semibold text-[10px]">
                Customer Detail
              </div>
              <div className="grid grid-cols-2 gap-0">
                {/* Row 1 */}
                <div className="flex border-b border-r border-black">
                  <div className="w-fit px-1 py-0.5 bg-gray-50 font-medium">
                    M/S -
                  </div>
                  <div className="flex-1 py-0.5">{safe(party.name, "")}</div>
                </div>

                <div className="flex border-b border-black">
                  <div className="w-fit px-1 py-0.5 bg-gray-50 font-medium">
                    Phone -
                  </div>
                  <div className="flex-1 py-0.5">
                    {safe(party?.mobile_no, "")}
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex border-r border-b border-black">
                  <div className="w-fit px-1 py-0.5 bg-gray-50 font-medium">
                    Place of Supply -
                  </div>
                  <div className="flex-1 py-0.5">
                    {safe(party.state_name || party.address, "")}
                  </div>
                </div>

                <div className="flex border-b border-black">
                  <div className="w-fit px-1 py-0.5 bg-gray-50 font-medium">
                    GSTIN -
                  </div>
                  <div className="flex-1 py-0.5">{safe(party.gst_no, "")}</div>
                </div>

                {/* Row 3 - Place of Supply spans full width */}
                <div className="flex col-span-2">
                  <div className="w-fit px-1 py-0.5 bg-gray-50 font-medium">
                    Address -
                  </div>
                  <div className="flex-1 py-0.5">{safe(party.address, "")}</div>
                </div>
              </div>
            </div>
            <div className="border border-black">
              <div className="grid grid-cols-3 text-[8px]">
                {/* Row 1 */}
                <div className="px-1 py-0.5 border-b border-r border-black">
                  <div>Invoice No.</div>
                  <div className="font-semibold text-[9px]">
                    {safe(sale.bill_no, "")}
                  </div>
                </div>
                <div className="px-1 py-0.5 border-b border-r border-black">
                  <div>Invoice Date</div>
                  <div className="font-semibold text-[9px]">
                    {safe(formatDateTime(sale.bill_date), "")}
                  </div>
                </div>
                <div className="px-1 py-0.5 border-b border-black">
                  <div>Challan Date</div>
                  <div className="font-semibold text-[9px]">
                    {safe(
                      formatDateTime(sale.challan_date) ||
                      formatDateTime(sale.bill_date),
                      ""
                    )}
                  </div>
                </div>

                {/* Row 2 */}
                <div className="px-1 py-0.5 border-b border-r border-black">
                  <div>Transport Amount</div>
                  <div className="font-semibold text-[9px]">
                    {fmt(sale.other_amount)}
                  </div>
                </div>
                <div className="px-1 py-0.5 border-b border-r border-black">
                  <div>Remark</div>
                  <div className="font-semibold text-[9px]">
                    {safe(sale.other_note, "—")}
                  </div>
                </div>
                <div className="px-1 py-0.5 border-b border-black">
                  <div>E-Way Bill No.</div>
                  <div className="font-semibold text-[9px]">
                    {safe(sale.eway_bill_no, "")}
                  </div>
                </div>

                {/* Row 3 */}
                <div className="px-1 py-0.5 border-b border-r border-black">
                  <div>Transport</div>
                  <div className="font-semibold text-[9px]">
                    {safe(sale.transport_name, "")}
                  </div>
                </div>
                <div className="px-1 py-0.5 border-b border-r border-black">
                  <div>Transport ID</div>
                  <div className="font-semibold text-[9px]">
                    {safe(sale.transport_id, "")}
                  </div>
                </div>
                <div className="px-1 py-0.5 border-b border-black">
                  <div>Vehicle No.</div>
                  <div className="font-semibold text-[9px]">
                    {safe(sale.vehicle_no, "—")}
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-black px-1 py-1">
              <div className="font-semibold mb-0.5">Terms and Conditions</div>
              <div className="whitespace-pre-line text-[8px] leading-3">
                {sale.remarks ||
                  `Subject to Bhopal Jurisdiction.\nOur Responsibility Ceases as soon as goods leaves our Premises.\nGoods once sold will not taken back.\nTransport as per actual.\nTotal payment due in 15 days`}
              </div>
            </div>
          </div>

          {/* Items Table - Compact with smaller font */}
          <div className="border border-black mt-1">
            <table className="w-full h-auto border-collapse text-[8px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black py-0.5 px-0.5 w-6">Sr.</th>
                  <th className="border border-black py-0.5 px-0.5 text-left">
                    Name of Product / Service
                  </th>
                  <th className="border border-black py-0.5 px-0.5 w-12">
                    HSN / SAC
                  </th>
                  <th className="border border-black py-0.5 px-0.5 w-8">Qty</th>
                  <th className="border border-black py-0.5 px-0.5 w-8">
                    Unit
                  </th>
                  <th className="border border-black py-0.5 px-0.5 w-12">
                    Rate
                  </th>
                  <th className="border border-black py-0.5 px-0.5 w-14">
                    Taxable Value
                  </th>
                  <th className="border border-black py-0.5 px-0.5 w-10">
                    % GST
                  </th>
                  <th className="border border-black py-0.5 px-0.5 w-14">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {itemChunks.map((chunk, chunkIndex) => (
                  <React.Fragment key={chunkIndex}>
                    {chunk.map((r, i) => {
                      const qty = Number(r.qty || 0);
                      const rate = Number(r.rate || 0);
                      const discAmt = Number(r.discount_amount || 0);
                      const taxable = Number(
                        r.taxable_amount || qty * rate - discAmt
                      );
                      const gstp = Number(r.gst_percent || r.tax_percent || 0);
                      const gstAmt =
                        Number(r.gst_amount || r.cgst_amount || 0) +
                        Number(r.sgst_amount || 0) +
                        Number(r.igst_amount || 0) || (taxable * gstp) / 100;
                      const net = Number(r.net_total || taxable + gstAmt);
                      const unit = r.unit || r.unit_code || "NOS";
                      const desc =
                        r.item_name || r.product_name || `#${r.product_id}`;
                      return (
                        <tr key={r.id || i} className="align-top">
                          <td className="border border-black py-0.5 px-0.5 text-center">
                            {chunkIndex * itemsPerPage + i + 1}
                          </td>
                          <td className="border border-black py-0.5 px-0.5 text-left">
                            {desc}
                          </td>
                          <td className="border border-black py-0.5 px-0.5 text-center">
                            {safe(r.hsn_code, "—")}
                          </td>
                          <td className="border border-black py-0.5 px-0.5 text-center">
                            {fmt(qty)}
                          </td>
                          <td className="border border-black py-0.5 px-0.5 text-center">
                            {unit}
                          </td>
                          <td className="border border-black py-0.5 px-0.5 text-right">
                            {fmt(rate)}
                          </td>
                          <td className="border border-black py-0.5 px-0.5 text-right">
                            {fmt(taxable)}
                          </td>
                          <td className="border border-black py-0.5 px-0.5 text-center">
                            {fmt(gstp, 0)}
                          </td>
                          <td className="border border-black py-0.5 px-0.5 text-right">
                            {fmt(net)}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      className="border border-black py-2 px-0.5 text-center"
                      colSpan={9}
                    >
                      No Items
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td
                    className="border border-black py-0.5 px-0.5 text-center"
                    colSpan={3}
                  >
                    Total
                  </td>
                  <td className="border border-black py-0.5 px-0.5 text-center">
                    {fmt(items.reduce((s, r) => s + Number(r.qty || 0), 0))}
                  </td>
                  <td className="border border-black py-0.5 px-0.5 text-center">
                    NOS
                  </td>
                  <td className="border border-black py-0.5 px-0.5"></td>
                  <td className="border border-black py-0.5 px-0.5 text-right">
                    {fmt(taxBreakup.totalTaxable)}
                  </td>
                  <td className="border border-black py-0.5 px-0.5"></td>
                  <td className="border border-black py-0.5 px-0.5 text-right">
                    {fmt(taxBreakup.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between border">
            <div className="flex justify-between a">
              <h1 className="">paid amount</h1>
            </div>
            <div className="text-green-600 text-2xl">{sale?.paid_amount}</div>
          </div>

          <div className="border border-black">
            <div className="grid grid-cols-6 gap-0 text-[8px]">
              {/* Row 1: Taxable Amount and Total Tax */}
              <div className="px-1 py-0.5 border-b border-r border-black bg-gray-50 font-medium col-span-2">
                Taxable Amount
              </div>
              <div className="px-1 py-0.5 border-b border-r border-black text-right col-span-1">
                {fmt(taxBreakup.totalTaxable)}
              </div>
              <div className="px-1 py-0.5 border-b border-r border-black bg-gray-50 font-medium col-span-2">
                Total Tax
              </div>
              <div className="px-1 py-0.5 border-b border-black text-right col-span-1">
                {fmt(taxBreakup.totalGst)}
              </div>

              {/* Row 2: Discount and Other Amount */}
              <div className="px-1 py-0.5 border-b border-r border-black bg-gray-50 font-medium col-span-2">
                Discount
              </div>
              <div className="px-1 py-0.5 border-b border-r border-black text-right col-span-1">
                - {fmt(taxBreakup.totalDiscount)}
              </div>
              <div className="px-1 py-0.5 border-b border-r border-black bg-gray-50 font-medium col-span-2">
                Transport Amount
              </div>
              <div className="px-1 py-0.5 border-b border-black text-right col-span-1">
                ₹ {fmt(sale.other_amount)}
              </div>

              {/* Row 3: Total Amount After Tax */}
              {/* Row 3: Total Amount After Tax with Remark in same row */}
              <div className="px-1 py-1 border-b border-r border-black bg-gray-100 font-semibold col-span-2">
                Total Amount After Tax
              </div>
              <div className="px-1 py-1 border-b border-r border-black bg-gray-100 font-bold text-right text-[10px] col-span-1">
                ₹ {fmt(taxBreakup.total)}
              </div>
              <div className="px-1 py-1 border-b border-r border-black bg-gray-50 font-medium col-span-1">
                Remark
              </div>
              <div className="px-1 py-1 border-b border-black col-span-2">
                {safe(sale.other_note, "—")}
              </div>

              {/* Row 4: Remark Value and Grand Total Header */}

              <div className="px-1 py-1 border-r border-black bg-gray-100 font-semibold col-span-2">
                Grand Total
              </div>
              <div className="px-1 py-1 font-bold text-right text-[12px] border-black col-span-4 bg-yellow-50">
                ₹{" "}
                {fmt(
                  Number(taxBreakup.total || 0) + Number(sale.other_amount || 0)
                )}
              </div>
            </div>
            {/* GST Breakdown Section - Compact */}
            <div className="mt-1 p-1 bg-gray-50 border border-gray-200">
              <div className="text-[9px] font-semibold text-gray-700 mb-1">
                GST Breakdown Details
              </div>
              <div className="grid grid-cols-2 gap-2 text-[8px]">
                <div className="flex justify-between">
                  <span className="font-medium">SGST AMT:</span>
                  <span className="font-mono">{fmt(taxBreakup.totalSgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">CGST AMT:</span>
                  <span className="font-mono">{fmt(taxBreakup.totalCgst)}</span>
                </div>
              </div>
              <div className="mt-1 space-y-0.5">
                {Object.keys(taxBreakup.groups)
                  .filter((p) => Number(p) > 0)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((percent) => {
                    const group = taxBreakup.groups[percent];
                    return (
                      <div
                        key={percent}
                        className="flex items-center justify-between text-[8px] bg-white p-1 border"
                      >
                        <span className="font-medium">{percent}%:</span>
                        <div className="flex gap-2">
                          <span>SGST {fmt(group.sgst)}</span>
                          <span>CGST {fmt(group.cgst)}</span>
                          <span className="font-medium">
                            = {fmt(group.sgst + group.cgst)} /{" "}
                            {fmt(group.taxable)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Totals Grid - Compact */}
          <div className="grid grid-cols-3 gap-1 mt-1 text-[9px]">
            <div className="border border-black">
              <div className="bg-gray-100 border-b border-black px-1 py-0.5 font-semibold text-[10px]">
                Bank Details
              </div>
              <div className="grid grid-cols-2 gap-0">
                {/* Row 1 - Bank Name and Branch */}
                <div className="flex border-b border-r border-black">
                  <div className="w-fit px-1 py-0.5 bg-gray-50 font-medium">
                    Bank Name -
                  </div>
                  <div className="flex-1 py-0.5">
                    {safe(company?.bank_bank_name, "—")}
                  </div>
                </div>

                <div className="flex border-b border-black">
                  <div className="w-fit px-1 py-0.5 bg-gray-50 font-medium">
                    Branch -
                  </div>
                  <div className="flex-1 py-0.5">
                    {safe(company?.bank_branch_name, "—")}
                  </div>
                </div>

                {/* Row 2 - Account Number and IFSC */}
                <div className="flex border-b border-r border-black">
                  <div className="w-fit px-1 py-0.5 bg-gray-50 font-medium">
                    Account No. -
                  </div>
                  <div className="flex-1 py-0.5">
                    {safe(company?.bank_account_number, "—")}
                  </div>
                </div>

                <div className="flex border-b border-black">
                  <div className="w-fit px-1 py-0.5 bg-gray-50 font-medium">
                    IFSC -
                  </div>
                  <div className="flex-1 py-0.5">
                    {safe(company?.bank_ifsc_code, "—")}
                  </div>
                </div>

                {/* Row 3 - UPI ID (spans full width) */}
                <div className="flex col-span-2 ">
                  <div className="w-fit px-1 py-0.5 bg-gray-50 font-medium">
                    UPI ID -
                  </div>
                  <div className="flex-1 py-0.5">
                    {safe(company?.bank_upi_id || company?.upi_id, "—")}
                  </div>

                  <div className="text-center text-[9.6px] border-l border-black px-1 py-0.5 bg-blue-100">
                    Pay using UPI
                  </div>
                </div>
              </div>
            </div>

            {/* Amount in words - Compact */}
            <div className="border border-black px-1 text-[9px]">
              <div className="bg-gray-100 border-b border-black px-1 py-0.5 font-semibold text-[10px]">
                Total in words
              </div>
              <div className="mt-0.5 font-bold">
                {toWords(
                  Number(taxBreakup.total || 0) + Number(sale.other_amount || 0)
                )}{" "}
                Rupees Only
              </div>
              <div className="mt-0.5">
                GST Amount: {fmt(taxBreakup.totalGst)}
              </div>
              <div className="mt-0.5 italic text-gray-700 text-[8px]">
                Grand Total = Total After Tax + Transport Amount
              </div>
            </div>

            {/* Signature - Compact */}

            <div className="border border-black px-1 py-1 text-center">
              <div>For {safe(company.name, "")}</div>
              <div className="mt-4 inline-block border-t border-black w-32"></div>
              <div className="text-[8px] mt-0.5">Authorised Signatory</div>
              <div className="text-[7px] mt-2 italic">
                This is a computer generated invoice, no signature required.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 mt-1 text-[9px]"></div>

          {/* Footer */}
          <div className="text-center text-[8px] mt-1">
            Thank you for shopping with us!
          </div>
        </div>
      </div>

      <style>{`
@media print {
  @page {
    size: A4;
    margin: 0.1in;
  }

  body * {
    visibility: hidden;
  }

  #invoice-wrap,
  #invoice-wrap * {
    visibility: visible;
  }

  #invoice-wrap {
    position: absolute;
    left: 0;
    top: 0;
    width: 794px; /* exact A4 width in px */
    margin: 0;
    padding: 0;
    box-shadow: none;
    background: #ffffff !important;
  }

  .no-print {
    display: none !important;
  }
}
`}</style>
    </div>
  );
}
