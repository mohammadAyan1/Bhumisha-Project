// src/pages/sales/SaleOrderInvoice.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { soApi } from "../../axios/soApi";

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

const image_url = import.meta.env.VITE_IMAGE_URL;

export default function SaleOrderInvoice() {
  const formatDateTimeDMY = (dateTime) => {
    if (!dateTime) return "—";

    // MySQL DATETIME → JS compatible
    const d = new Date(dateTime.replace(" ", "T"));
    if (isNaN(d)) return "—";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12; // convert to 12-hour format

    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

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

  const [so, setSO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    let on = true;
    setLoading(true);
    // Force simple GET; add invoice endpoint later if available
    soApi
      .get(id)
      .then((r) => on && setSO(r.data))
      .catch(
        (e) =>
          on &&
          setErr(e?.response?.data?.message || "Failed to load Sales Order")
      )
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, [id]);

  const items = Array.isArray(so?.items) ? so.items : [];

  const taxBreakup = useMemo(() => {
    // Group by GST percentage
    const gstGroups = {};
    let totalTaxable = 0,
      totalDiscount = 0,
      totalGross = 0;
    for (const r of items) {
      const qty = Number(r.qty || 0);
      const rate = Number(r.rate || 0);
      const lineDiscount = Number(r.discount_total || 0);
      const lineTaxable = Number(r.amount || qty * rate - lineDiscount);
      const gstPercent = Number(r.gst_percent || 0);
      const lineGstAmt = Number(r.gst_amount || 0);
      const lineC = Number(r.cgst_amount || 0);
      const lineS = Number(r.sgst_amount || 0);
      const lineI = Number(r.igst_amount || 0);
      const totalGst = lineGstAmt || lineC + lineS + lineI;
      const net = Number(r.final_amount || lineTaxable + totalGst);

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

  const handlePDF = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fff",
    });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pw = pdf.internal.pageSize.getWidth();
    const ph = (canvas.height * pw) / canvas.width;
    const pageH = pdf.internal.pageSize.getHeight();
    if (ph <= pageH) {
      pdf.addImage(img, "PNG", 0, 0, pw, ph);
    } else {
      let offset = 0;
      while (offset < ph) {
        pdf.addImage(img, "PNG", 0, -offset, pw, ph);
        offset += pageH;
        if (offset < ph) pdf.addPage();
      }
    }
    pdf.save(`SO-${so?.so_no || id}.pdf`);
  };

  useEffect(() => {
    if (!auto || !so) return;
    const t = setTimeout(() => handlePDF(), 300);
    return () => clearTimeout(t);
  }, [auto, so]);

  if (loading) return <div>Loading...</div>;
  if (err) return <div style={{ color: "red" }}>{err}</div>;
  if (!so) return <div>No data</div>;

  const company = so.company || {};
  const party = so.customer || {
    name: so.party_name || so.customer_name,
    gst_no: so.gst_no || so.party_gst,
    address: so.address || so.party_address,
    mobile_no: so.mobile_no || so.party_mobile,
    email: so.email || so.party_email,
  };

  return (
    <div className="flex flex-col items-center py-6 bg-gray-50 min-h-screen">
      <div className="flex gap-2 mb-4 no-print">
        <button
          onClick={() => window.print()}
          className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Print
        </button>
        {/* <button
          onClick={handlePDF}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Download PDF
        </button> */}
        <button
          onClick={() => {
            const phone = String(
              party?.mobile_no || party?.phone || ""
            ).replace(/[^0-9]/g, "");
            if (!phone) return alert("No customer mobile number found");
            const invoiceUrl = window.location.href; // ✅ current browser URL

            const message = `Hello,
Please find your Sales Order invoice below:
${invoiceUrl}

Thank you.`;

            const url = `https://wa.me/${phone}?text=${encodeURIComponent(
              message
            )}`;
            window.open(url, "_blank");
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow"
          title="Send via WhatsApp"
        >
          WhatsApp
        </button>
      </div>

      <div
        id="invoice-wrap"
        ref={ref}
        className="bg-white text-black border border-black shadow max-w-[794px] w-[794px] p-3 print:p-3"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}
      >
        {/* Top meta row */}
        <div className="flex justify-between items-center text-[10px] mb-1">
          <div>Page No. 1 of 1</div>
          <div className="text-center text-lg flex-1 font-bold text-blue-900">
            Sales Order
          </div>
          <div>Original Copy</div>
        </div>

        {/* Header */}
        <div className="flex justify-between gap-2 border border-black p-2 mb-1">
          <img
            src={
              company?.image_url
                ? `${image_url}${company.image_url}`
                : "/img/image.png"
            }
            alt="Logo"
            className="w-16 h-16 border border-black object-contain"
          />
          <div className="flex-1 text-center">
            <div className="text-base font-bold">
              {safe(company.name, "Bhumisha Organics")}
            </div>
            <div className="text-[11px]">
              {safe(company.address, "Add Address")}
            </div>
            <div className="text-[10px] mt-1">
              Mobile: {safe(company.mobile, "+91 9999999999")} | Email:{" "}
              {safe(company.email, "company@email.com")}
            </div>
            <div className="text-[10px]">
              GSTIN - {safe(company.gstin, "99AAAAA1234F001")} | PAN -{" "}
              {safe(company.pan, "99AAAAA1234F")}
            </div>
          </div>
        </div>

        {/* Billing + Right meta grid */}
        <div className="grid grid-cols-2 gap-2 mb-1">
          <div className="border border-black p-2">
            <div className="font-semibold mb-1">Billing Details</div>
            <div className="text-[11px] leading-5">
              <div>
                <span className="inline-block w-16">Name</span> :{" "}
                {safe(party.name, "—")}
              </div>
              <div>
                <span className="inline-block w-16">GSTIN</span> :{" "}
                {safe(party.gst_no, "—")}
              </div>
              <div>
                <span className="inline-block w-16">Mobile</span> :{" "}
                {safe(party.phone, "—")}
              </div>
              {/* <div><span className="inline-block w-16">Email</span> : {safe(party.email, "—")}</div> */}
              <div>
                <span className="inline-block w-16">Address</span> :{" "}
                {safe(party.address, "—")}
              </div>
            </div>
          </div>
          <div className="border border-black p-2">
            <div className="text-[11px] leading-5">
              <div>
                <span className="inline-block w-28">Invoice</span> :{" "}
                {safe(so.so_no || so.bill_no, "—")}
              </div>
              {/* <div><span className="inline-block w-28">Number</span> : {safe(so.number, "—")}</div> */}
              <div>
                <span className="inline-block w-28">Invoice Date</span> :{" "}
                {formatDateDMY(so.date || so.bill_date, "—")}
              </div>
              <div>
                <span className="inline-block w-28">Transport Charges</span> :{" "}
                {Number(so.other_amount || 0).toFixed(2)}
              </div>
              <div>
                <span className="inline-block w-28">Remark</span> :{" "}
                {safe(so.other_note, "—")}
              </div>
              <div>
                <span className="inline-block w-28">Due Date</span> :{" "}
                {safe(so.due_date, "—")}
              </div>
              {/* <div><span className="inline-block w-28">Room No. Check In</span> : {safe(so.room_no, "—")}</div> */}
              {/* <div><span className="inline-block w-28">Time Check Out</span> : {safe(so.time_out, "—")}</div> */}
              <div>
                <span className="inline-block w-28">Time</span> :{" "}
                {formatDateTimeDMY(so.bill_time)}
              </div>
              {/* Other Amount/Remark intentionally hidden */}
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="border border-black mb-1">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black py-1 px-1 w-8">Sr.</th>
                <th className="border border-black py-1 px-1 text-left">
                  Item Description
                </th>
                <th className="border border-black py-1 px-1 w-16">HSN/SAC</th>
                <th className="border border-black py-1 px-1 w-12">Qty</th>
                <th className="border border-black py-1 px-1 w-12">Unit</th>
                <th className="border border-black py-1 px-1 w-16">
                  List Price
                </th>
                <th className="border border-black py-1 px-1 w-20">Disc.</th>
                <th className="border border-black py-1 px-1 w-12">Tax %</th>
                <th className="border border-black py-1 px-1 w-20">
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
                    <tr key={it.id || i} className="align-top">
                      <td className="border border-black py-1 px-1 text-center">
                        {i + 1}
                      </td>
                      <td className="border border-black py-1 px-1">{desc}</td>
                      <td className="border border-black py-1 px-1 text-center">
                        {safe(it.hsn_code, "—")}
                      </td>
                      <td className="border border-black py-1 px-1 text-center">
                        {fmt(qty)}
                      </td>
                      <td className="border border-black py-1 px-1 text-center">
                        {unit}
                      </td>
                      <td className="border border-black py-1 px-1 text-right">
                        {fmt(rate)}
                      </td>
                      <td className="border border-black py-1 px-1 text-right">
                        {disc > 0
                          ? `${fmt(disc)}${it.discount_percent
                            ? ` (${fmt(it.discount_percent, 0)}%)`
                            : ""
                          }`
                          : "0.00"}
                      </td>
                      <td className="border border-black py-1 px-1 text-center">
                        {fmt(gstp, 0)}
                      </td>
                      <td className="border border-black py-1 px-1 text-right">
                        {fmt(final)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="border border-black py-4 px-1 text-center"
                    colSpan={9}
                  >
                    No Items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Taxable Amount/Discount/GST/Total */}
        <div className="flex justify-between border-t border-black py-1 text-[11px]">
          <span>Taxable Amount</span>
          <span>{fmt(taxBreakup.totalTaxable)}</span>
        </div>
        <div className="flex justify-between border-t border-black py-1 text-[11px]">
          <span>Discount</span>
          <span>- {fmt(taxBreakup.totalDiscount)}</span>
        </div>
        <div className="flex justify-between border-t border-black py-1 text-[11px]">
          <span>GST</span>
          <span>{fmt(taxBreakup.totalGst)}</span>
        </div>
        <div className="flex justify-between border-t-2 border-black py-2 font-semibold text-[13px]">
          <span>Total Amount After Tax</span>
          <span>₹ {fmt(taxBreakup.total)}</span>
        </div>
        <div className="flex justify-between border-t border-black py-1 text-[11px]">
          <span>Transport Charges</span>
          <span>₹ {fmt(Number(so.other_amount || 0))}</span>
        </div>
        <div className="flex justify-between border-t border-black py-1 text-[11px]">
          <span>Remark</span>
          <span>{safe(so.other_note, "—")}</span>
        </div>
        <div className="flex justify-between border-t-2 border-black py-2 font-semibold text-[13px]">
          <span>Grand Total</span>
          <span>
            ₹{" "}
            {fmt(Number(taxBreakup.total || 0) + Number(so.other_amount || 0))}
          </span>
        </div>

        {/* GST Breakdown Section */}
        <div className="border-t border-black mt-2 pt-2">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            GST Breakdown Details
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs mb-3">
            <div className="flex justify-between">
              <span className="font-medium">SGST AMT:</span>
              <span className="font-mono">{fmt(taxBreakup.totalSgst)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">CGST AMT:</span>
              <span className="font-mono">{fmt(taxBreakup.totalCgst)}</span>
            </div>
          </div>
          <div className="space-y-2">
            {Object.keys(taxBreakup.groups)
              .filter((p) => Number(p) > 0)
              .sort((a, b) => Number(a) - Number(b))
              .map((percent) => {
                const group = taxBreakup.groups[percent];
                return (
                  <div
                    key={percent}
                    className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border"
                  >
                    <span className="font-medium">{percent}%:</span>
                    <div className="flex gap-4">
                      <span>SGST {fmt(group.sgst)}</span>
                      <span>CGST {fmt(group.cgst)}</span>
                      <span className="font-medium">
                        = {fmt(group.sgst + group.cgst)} / {fmt(group.taxable)}
                      </span>
                    </div>
                  </div>
                );
              })}
            {Object.keys(taxBreakup.groups)
              .filter((p) => Number(p) === 0)
              .map((percent) => {
                const group = taxBreakup.groups[percent];
                return (
                  <div
                    key={percent}
                    className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border"
                  >
                    <span className="font-medium">{percent}%:</span>
                    <div className="flex gap-4">
                      <span>SGST {fmt(group.sgst)}</span>
                      <span>CGST {fmt(group.cgst)}</span>
                      <span className="font-medium">
                        = {fmt(group.sgst + group.cgst)} / {fmt(group.taxable)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Amount words + settled */}
        <div className="text-[11px]">
          <div className="font-semibold">
            Rs. {fmt(Number(taxBreakup.total || 0))} Only
          </div>
          <div className="mt-1">
            Amount in words:{" "}
            <span className="font-bold">
              {toWords(Number(taxBreakup.total || 0))} Rupees Only
            </span>
          </div>
          <div className="mt-1">
            Settled by : Bank : {fmt(so.settled_bank_amount || 0)} | Invoice
            Balance : {fmt(so.balance || 0)}
          </div>
        </div>

        {/* Terms + QR */}
        <div className="grid grid-cols-3 gap-2 border-t border-black mt-2 pt-2 text-[11px]">
          <div className="col-span-2">
            <div className="font-semibold mb-1">Terms and Conditions</div>
            <div className="whitespace-pre-line">
              {so.terms_condition ||
                `1. Goods once sold will not be taken back.
2. Interest @ 18% p.a. will be charged if payment is delayed.
3. Subject to “Delhi” jurisdiction only.`}
            </div>
          </div>
          {/* <div className="flex items-center justify-center">
            <img className="w-20 h-20" alt="QR" src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`SO:${so.so_no} AMT:${fmt(taxBreakup.total)}`)}`} />
          </div> */}
        </div>

        {/* Bank + Signature */}
        <div className="grid grid-cols-3 gap-2 border-t border-black mt-2 pt-2 text-[11px]">
          <div className="col-span-2">
            <div>
              <strong>Account Number:</strong>{" "}
              {safe(company.acc_no, "123456789")}
              <br />
              <strong>Bank:</strong> {safe(company.bank, "ICICI Bank")}
              <br />
              <strong>IFSC:</strong> {safe(company.ifsc, "ICICI1234")}
              <br />
              <strong>Branch:</strong> {safe(company.branch, "Noida")}
            </div>
          </div>
          <div className="text-center">
            <div>For {safe(company.name, "Company Name")}</div>
            <div className="mt-10 border-t border-black inline-block w-32"></div>
            <div className="text-[10px] mt-1">Signature</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] mt-2">
          Invoice Created by{" "}
          <a
            href="https://www.mazru.in"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            www.mazru.in
          </a>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          button, .no-print { display: none !important; }
          .sidebar, .navbar { display: none !important; }
          #invoice-wrap { margin: 0 !important; width: 100% !important; box-shadow:none !important; }
        }
      `}</style>
    </div>
  );
}
