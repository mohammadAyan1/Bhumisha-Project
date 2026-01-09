import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PurchaseOrderAPI from "../../axios/PurchaseOrderAPI";

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
      return `${a[Math.floor(x / 100)]} Hundred${
        x % 100 ? " " + s(x % 100) : ""
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

export default function POinvoice() {
  const formatDateDMY = (date) => {
    if (!date) return "—";

    const d = new Date(date);
    if (isNaN(d)) return "—";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const { id } = useParams();
  const { search } = useLocation();
  const auto = new URLSearchParams(search).get("auto") === "1";

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        // Prefer /:id/invoice if you add it later, otherwise getById
        const res =
          typeof PurchaseOrderAPI.getInvoice === "function"
            ? await PurchaseOrderAPI.getInvoice(id)
            : await PurchaseOrderAPI.getById(id);
        if (!active) return;
        setDoc(res?.data ?? null);
        setErr("");
      } catch (e) {
        if (!active) return;
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to load";
        setErr(msg);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const totals = useMemo(() => {
    const items = Array.isArray(doc?.items) ? doc.items : [];
    const taxable = items.reduce(
      (s, i) =>
        s + (parseFloat(i.amount || 0) - parseFloat(i.discount_total || 0)),
      0
    );
    const gst = items.reduce((s, i) => s + parseFloat(i.gst_amount || 0), 0);
    const total = items.reduce(
      (s, i) => s + parseFloat(i.final_amount || 0),
      0
    );
    const discount = items.reduce(
      (s, i) => s + parseFloat(i.discount_total || 0),
      0
    );
    return { taxable, gst, total, discount };
  }, [doc]);

  const handlePDF = async () => {
    if (!wrapRef.current) {
      console.error("wrapRef not ready");
      return;
    }
    setLoading(true);
    try {
      // Calculate optimal scale based on content height
      const contentHeight = wrapRef.current.scrollHeight;
      const a4Height = 1123; // A4 height in pixels at 96 DPI
      const scale = contentHeight > a4Height ? a4Height / contentHeight : 2;

      const canvas = await html2canvas(wrapRef.current, {
        scale: scale,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 794, // A4 width in pixels
        height: Math.min(contentHeight, a4Height), // Ensure it doesn't exceed A4 height
        windowWidth: 794,
        windowHeight: Math.min(contentHeight, a4Height),
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate image dimensions to fit exactly on one page
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Adjust if image height exceeds PDF height
      const finalHeight = Math.min(imgHeight, pdfHeight);

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, finalHeight);

      // Save PDF (use PO number or id)
      pdf.save(`PO-${doc?.po_no || doc?.bill_no || id}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (err) return <div style={{ color: "red" }}>{err}</div>;
  if (!doc) return <div>No data</div>;

  // Map purchase-order fields to template fields
  const company = doc.company || {};
  const party = doc.party || {
    name: doc.vendor_name || doc.party_name,
    gst_no: doc.gst_no,
    address: doc.address,
    mobile_no: doc.mobile_no,
    email: doc.email,
  };
  const items = Array.isArray(doc?.items) ? doc.items : [];
  const image_url = import.meta.env.VITE_IMAGE_URL;

  // Calculate if we need to adjust layout for many items
  const maxItemsForSinglePage = 8; // Adjust based on your layout
  const shouldCompactLayout = items.length > maxItemsForSinglePage;

  return (
    <div
      className="flex flex-col items-center py-6"
      style={{ background: "#f9fafb", minHeight: "100vh" }}
    >
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => window.print()}
          className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded shadow"
          style={{ background: "#374151", color: "#ffffff" }}
        >
          Print
        </button>
        <button
          onClick={handlePDF}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow"
          style={{ background: "#2563eb", color: "#ffffff" }}
          disabled={loading}
        >
          {loading ? "Generating..." : "Download PDF"}
        </button>
      </div>

      <div
        id="invoice-wrapper"
        ref={wrapRef}
        className="border border-black shadow p-3 print:p-3"
        style={{
          width: "794px", // Exact A4 width in pixels (210mm at 96 DPI)
          maxHeight: "1123px", // Maximum A4 height to ensure single page
          minHeight: "1123px", // Minimum height to maintain A4 size
          background: "#ffffff",
          fontFamily: "Arial, sans-serif",
          fontSize: shouldCompactLayout ? "11px" : "12px",
          display: "flex",
          flexDirection: "column",
          color: "#000000",
          overflow: "hidden", // Prevent content from overflowing
        }}
      >
        {/* Header Section - Fixed height */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "10px",
              marginBottom: "4px",
            }}
          >
            <div>Page No. 1 of 1</div>
            <div style={{ textAlign: "center", flex: 1 }}>
              Purchase Order BILL OF SUPPLY
            </div>
            <div>Original Copy</div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
              border: "1px solid #000",
              padding: "8px",
              marginBottom: "4px",
            }}
          >
            <img
              src={
                company?.image_url
                  ? `${image_url}${company.image_url}`
                  : "/img/image.png"
              }
              alt="Logo"
              style={{
                width: "64px",
                height: "64px",
                objectFit: "contain",
                border: "1px solid #000",
              }}
            />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>
                {safe(company.name, "Bhumisha Organics")}
              </div>
              <div style={{ fontSize: "11px" }}>
                {safe(company.address, "Add Address")}
              </div>
              <div style={{ fontSize: "10px", marginTop: "4px" }}>
                Mobile: {safe(company.mobile, "+91 9999999999")} | Email:{" "}
                {safe(company.email, "company@email.com")}
              </div>
              <div style={{ fontSize: "10px" }}>
                GSTIN - {safe(company.gstin, "99AAAAA1234F001")} | PAN -{" "}
                {safe(company.pan, "99AAAAA1234F")}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <div style={{ border: "1px solid #000", padding: "8px" }}>
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                Billing Details
              </div>
              <div style={{ fontSize: "11px", lineHeight: 1.4 }}>
                <div>
                  <span style={{ display: "inline-block", width: "64px" }}>
                    Name
                  </span>{" "}
                  : {safe(party.name, "—")}
                </div>
                <div>
                  <span style={{ display: "inline-block", width: "64px" }}>
                    GSTIN
                  </span>{" "}
                  : {safe(party.gst_no, "—")} | Mobile{" "}
                  {safe(party.mobile_no, "+91")} |
                </div>
                <div>
                  <span style={{ display: "inline-block", width: "64px" }}>
                    Address
                  </span>{" "}
                  : {safe(party.address, "—")}
                </div>
              </div>
            </div>
            <div style={{ border: "1px solid #000", padding: "8px" }}>
              <div style={{ fontSize: "11px", lineHeight: 1.4 }}>
                <div>
                  <span style={{ display: "inline-block", width: "112px" }}>
                    Invoice
                  </span>{" "}
                  : {safe(doc.po_no || doc.bill_no, "—")}
                </div>
                <div>
                  <span style={{ display: "inline-block", width: "112px" }}>
                    Number
                  </span>{" "}
                  : {safe(doc.number, "—")}
                </div>
                <div>
                  <span style={{ display: "inline-block", width: "112px" }}>
                    Invoice Date
                  </span>{" "}
                  : {formatDateDMY(doc.date || doc.bill_date)}
                </div>

                <div>
                  <span style={{ display: "inline-block", width: "112px" }}>
                    Due Date
                  </span>{" "}
                  : {safe(doc.due_date, "—")}
                </div>
                <div>
                  <span style={{ display: "inline-block", width: "112px" }}>
                    Time
                  </span>{" "}
                  : {safe(doc.bill_time, "—")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table - Flexible height with scroll if needed */}
        <div style={{ flex: 1, overflow: "hidden", marginBottom: "4px" }}>
          <div style={{ border: "1px solid #000", height: "100%" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: shouldCompactLayout ? "10px" : "11px",
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "6px",
                      width: "32px",
                      textAlign: "center",
                    }}
                  >
                    Sr.
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "6px",
                      textAlign: "left",
                    }}
                  >
                    Item Description
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "6px",
                      width: "64px",
                      textAlign: "center",
                    }}
                  >
                    HSN/SAC
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "6px",
                      width: "48px",
                      textAlign: "center",
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "6px",
                      width: "48px",
                      textAlign: "center",
                    }}
                  >
                    Unit
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "6px",
                      width: "72px",
                      textAlign: "right",
                    }}
                  >
                    List Price
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "6px",
                      width: "72px",
                      textAlign: "right",
                    }}
                  >
                    Disc.
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "6px",
                      width: "56px",
                      textAlign: "center",
                    }}
                  >
                    Tax %
                  </th>
                  <th
                    style={{
                      border: "1px solid #000",
                      padding: "6px",
                      width: "96px",
                      textAlign: "right",
                    }}
                  >
                    Amount (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length ? (
                  items.map((it, i) => {
                    const qty = Number(it.qty || 0);
                    const rate = Number(it.rate || 0);
                    const amount = Number(it.amount || qty * rate);
                    const disc = Number(it.discount_total || 0);
                    const gstp = Number(it.gst_percent || 0);
                    const final = Number(it.final_amount || amount - disc);
                    const unit = it.unit || it.unit_code || "N.A.";
                    const desc =
                      it.item_name || it.product_name || `#${it.product_id}`;
                    return (
                      <tr key={it.id || i} style={{ verticalAlign: "top" }}>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px",
                            textAlign: "center",
                          }}
                        >
                          {i + 1}
                        </td>
                        <td
                          style={{ border: "1px solid #000", padding: "6px" }}
                        >
                          {desc}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px",
                            textAlign: "center",
                          }}
                        >
                          {safe(it.hsn_code, "—")}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px",
                            textAlign: "center",
                          }}
                        >
                          {fmt(qty)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px",
                            textAlign: "center",
                          }}
                        >
                          {unit}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px",
                            textAlign: "right",
                          }}
                        >
                          {fmt(rate)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px",
                            textAlign: "right",
                          }}
                        >
                          {disc > 0
                            ? `${fmt(disc)}${
                                it.discount_percent
                                  ? ` (${fmt(it.discount_percent, 0)}%)`
                                  : ""
                              }`
                            : "0.00"}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px",
                            textAlign: "center",
                          }}
                        >
                          {fmt(gstp, 0)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px",
                            textAlign: "right",
                          }}
                        >
                          {fmt(final)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "16px",
                        textAlign: "center",
                      }}
                      colSpan={9}
                    >
                      No Items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Section - Fixed height */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid #000",
              paddingTop: "6px",
              fontSize: "11px",
            }}
          >
            <span>Discount</span>
            <span>- {fmt(totals.discount)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid #000",
              paddingTop: "6px",
              fontSize: "11px",
            }}
          >
            <span>GST</span>
            <span>{fmt(totals.gst)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "2px solid #000",
              paddingTop: "10px",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            <span>Total</span>
            <span>{fmt(totals.total)}</span>
          </div>

          <div style={{ fontSize: "11px", marginTop: "8px" }}>
            <div style={{ fontWeight: 700 }}>Rs. {fmt(totals.total)} Only</div>
            <div style={{ marginTop: "4px" }}>
              Amount in words:{" "}
              <span style={{ fontWeight: 700 }}>
                {toWords(totals.total)} Rupees Only
              </span>
            </div>
            <div style={{ marginTop: "4px" }}>
              Settled by : Bank : {fmt(doc.settled_bank_amount || 0)} | Invoice
              Balance : {fmt(doc.balance || 0)}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "8px",
              borderTop: "1px solid #000",
              marginTop: "12px",
              paddingTop: "8px",
              fontSize: "11px",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                Terms and Conditions
              </div>
              <div style={{ whiteSpace: "pre-line", fontSize: "10px" }}>
                {doc.terms_condition ||
                  `1. Goods once sold will not be taken back.
2. Interest @ 18% p.a. will be charged if payment is delayed.
3. Subject to "Delhi" jurisdiction only.`}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div>For {safe(company.name, "Company Name")}</div>
              <div
                style={{
                  marginTop: "40px",
                  borderTop: "1px solid #000",
                  display: "inline-block",
                  width: "128px",
                }}
              />
              <div style={{ fontSize: "10px", marginTop: "6px" }}>
                Signature
              </div>
            </div>
          </div>

          <div
            style={{ textAlign: "center", fontSize: "10px", marginTop: "8px" }}
          >
            Invoice Created by{" "}
            <a
              href="https://www.mazru.in"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "underline" }}
            >
              www.mazru.in
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @page { 
          size: A4; 
          margin: 5mm; 
        }
        @media print {
  /* Hide entire app */
  body * {
    visibility: hidden !important;
  }

  /* Show only invoice */
  #invoice-wrapper,
  #invoice-wrapper * {
    visibility: visible !important;
  }

  /* Position invoice at top-left */
  #invoice-wrapper {
    position: absolute;
    left: 0;
    top: 0;
    width: 210mm !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
  }

  button {
    display: none !important;
  }
}

      `}</style>
    </div>
  );
}
