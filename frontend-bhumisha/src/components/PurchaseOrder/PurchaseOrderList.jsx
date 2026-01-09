import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPurchaseOrders,
  deletePurchaseOrder,
} from "../../features/purchaseOrders/purchaseOrderSlice";
import { fetchProducts } from "../../features/products/productsSlice";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const fx = (n, d = 2) => (isNaN(n) ? (0).toFixed(d) : Number(n).toFixed(d));

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return "-";
  return d.toISOString().split("T")[0];
};

const formatBillTime = (billTime) => {
  if (!billTime) return "-";
  const d = new Date(billTime);
  if (isNaN(d)) return "-";
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
};

const PurchaseOrderList = ({ onEdit }) => {
  const dispatch = useDispatch();
  const { list = [], loading, error } = useSelector((s) => s.purchaseOrders);
  const { list: products = [] } = useSelector(
    (s) => s.products || { list: [] }
  );

  const [selectedPO, setSelectedPO] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    const reload = () => dispatch(fetchPurchaseOrders());
    const onFocus = () => reload();
    const onVis = () => {
      if (!document.hidden) reload();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [dispatch]);

  const productNameOf = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(String(p.id ?? p._id), p.product_name));
    return (id) => map.get(String(id));
  }, [products]);

  const tableRef = useRef(null);

  const exportCSV = () => {
    const rows = [
      [
        "PO No",
        "Vendor",
        "Address",
        "Mobile",
        "Date",
        "Bill Time",
        "GST No",
        "Place of Supply",
        "Terms",
        "Tax Total",
        "GST Total",
        "Final Total",
      ],
      ...list.map((po) => [
        po.po_no || "-",
        po.vendor_name || po.vendor_id || "-",
        po.address || "-",
        po.mobile_no || "-",
        formatDate(po.date),
        formatBillTime(po.bill_time),
        po.gst_no || "-",
        po.place_of_supply || "-",
        (po?.terms_condition || "").replace(/\s+/g, " "),
        fx(po?.summary?.total_taxable ?? po.total_taxable ?? 0),
        fx(po?.summary?.total_gst ?? po.total_gst ?? 0),
        fx(po?.summary?.grand_total ?? po.final_amount ?? 0),
      ]),
    ];
    const csv = rows
      .map((r) =>
        r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `purchase_orders_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportExcel = () => {
    const tableHtml = tableRef.current ? tableRef.current.outerHTML : "";
    const blob = new Blob(
      [
        `\uFEFF<html><head><meta charset="UTF-8"></head><body>${tableHtml}</body></html>`,
      ],
      { type: "application/vnd.ms-excel" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `purchase_orders_${Date.now()}.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportPDF = () => {
    window.print();
  };

  const openModal = (po) => {
    setSelectedPO(po);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setSelectedPO(null);
  };

  const { setPoOrder } = useAuth();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && isModalOpen && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen]);

  if (loading) {
    return (
      <div className="p-6 bg-white shadow rounded text-sm">Loading...</div>
    );
  }
  if (error) {
    return (
      <div className="p-6 bg-white shadow rounded text-sm text-red-600">
        {error}
      </div>
    );
  }

  const formatDateDMY = (dateTime) => {
    if (!dateTime) return "—";

    // Convert "2025-12-17 12:00:00" → "2025-12-17T12:00:00"
    const normalized = dateTime.replace(" ", "T");

    const d = new Date(normalized);
    if (isNaN(d)) return "—";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-6 bg-white shadow rounded">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">All POs</h3>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <button
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          onClick={exportCSV}
        >
          Export CSV
        </button>
        <button
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          onClick={exportExcel}
        >
          Export Excel
        </button>
        <button
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          onClick={exportPDF}
        >
          Export PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        <table
          ref={tableRef}
          className="border border-gray-200 text-sm"
          style={{ minWidth: 1200 }}
        >
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">PO No</th>
              <th className="border p-2 text-left">Vendor</th>
              <th className="border p-2 text-left">Address</th>
              <th className="border p-2 text-left">Mobile</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Bill Time</th>
              <th className="border p-2 text-left">GST No</th>
              <th className="border p-2 text-left">Place of Supply</th>
              <th className="border p-2 text-left">Terms</th>
              <th className="border p-2 text-left">TAX Total</th>
              <th className="border p-2 text-right">GST Total</th>
              <th className="border p-2 text-right">Final Total</th>
              <th className="border p-2 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {(!list || list.length === 0) && (
              <tr>
                <td className="border p-4 text-center" colSpan={13}>
                  No Purchase Orders Found
                </td>
              </tr>
            )}

            {list.map((po) => {
              const poId = po.id || po._id;
              const dateStr = formatDateDMY(po.date);
              const billTimeStr = formatBillTime(po.bill_time);

              return (
                <tr key={poId} className="odd:bg-white even:bg-gray-50">
                  <td className="border p-2">
                    <button
                      className="underline text-blue-600 hover:text-blue-800 active:scale-95"
                      onClick={() => openModal(po)}
                      title="View details"
                    >
                      {po.po_no || "-"}
                    </button>
                  </td>
                  <td className="border p-2">
                    {po.vendor_firmname || po.vendor_id || "-"}
                  </td>
                  <td className="border p-2">{po.address || "-"}</td>
                  <td className="border p-2">{po.mobile_no || "-"}</td>
                  <td className="border p-2">{dateStr}</td>
                  <td className="border p-2">{billTimeStr}</td>
                  <td className="border p-2">{po.gst_no || "-"}</td>
                  <td className="border p-2">{po.place_of_supply || "-"}</td>
                  <td
                    className="border p-2 truncate max-w-[220px]"
                    title={po.terms_condition || ""}
                  >
                    {po.terms_condition || "-"}
                  </td>
                  <td className="border p-2 text-right">
                    {fx(po?.summary?.total_taxable ?? po.total_taxable ?? 0)}
                  </td>
                  <td className="border p-2 text-right">
                    {fx(po?.summary?.total_gst ?? po.total_gst ?? 0)}
                  </td>
                  <td className="border p-2 text-right font-semibold">
                    {fx(po?.summary?.grand_total ?? po.final_amount ?? 0)}
                  </td>

                  {/* ---------- Action Column: inline SVG icons (visible & colored) ---------- */}
                  <td style={{ border: "1px solid #eee", padding: "8px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        justifyContent: "flex-start",
                      }}
                    >
                      {/* 👁️ Eye (View) */}
                      <button
                        onClick={() => openModal(po)}
                        title="View items"
                        aria-label="View items"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 6,
                          cursor: "pointer",
                          fontSize: "20px",
                          transition: "transform 0.2s, color 0.2s",
                          color: "#374151",
                        }}
                        onMouseEnter={(e) => (e.target.style.color = "#111827")}
                        onMouseLeave={(e) => (e.target.style.color = "#374151")}
                      >
                        👁️
                      </button>

                      {/* ✏️ Pencil (Edit) */}
                      {/* <button
                        onClick={() => onEdit && onEdit(po)}
                        title="Edit"
                        aria-label="Edit"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 6,
                          cursor: "pointer",
                          fontSize: "20px",
                          transition: "transform 0.2s, color 0.2s",
                          color: "#d97706",
                        }}
                        onMouseEnter={(e) => (e.target.style.color = "#b45309")}
                        onMouseLeave={(e) => (e.target.style.color = "#d97706")}
                      >
                        ✏️
                      </button> */}

                      {/* 🗑️ Trash (Delete) */}
                      <button
                        onClick={() => {
                          if (window.confirm("Delete this PO?")) {
                            dispatch(deletePurchaseOrder(poId)).then(() =>
                              dispatch(fetchPurchaseOrders())
                            );
                          }
                        }}
                        title="Delete"
                        aria-label="Delete"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 6,
                          cursor: "pointer",
                          fontSize: "20px",
                          transition: "transform 0.2s, color 0.2s",
                          color: "#dc2626",
                        }}
                        onMouseEnter={(e) => (e.target.style.color = "#991b1b")}
                        onMouseLeave={(e) => (e.target.style.color = "#dc2626")}
                      >
                        🗑️
                      </button>

                      {/* 📄 File (Create Purchase) */}
                      <button
                        onClick={() => {
                          setPoOrder("editpo");
                          navigate(`/purchases/create?poId=${po.id}`);
                        }}
                        title="Create Purchase"
                        aria-label="Create Purchase"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 6,
                          cursor: "pointer",
                          fontSize: "20px",
                          transition: "transform 0.2s, color 0.2s",
                          color: "#2563eb",
                        }}
                        onMouseEnter={(e) => (e.target.style.color = "#1d4ed8")}
                        onMouseLeave={(e) => (e.target.style.color = "#2563eb")}
                      >
                        📄
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && selectedPO && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-[95vw] max-w-5xl max-h-[90vh] overflow-auto bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h4 className="text-lg font-semibold">
                PO Details — {selectedPO.po_no || selectedPO.id}
              </h4>
              <div className="flex items-center gap-2 no-print">
                {/* <button
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 active:scale-95"
                  onClick={() => window.print()}
                >
                  Print
                </button> */}
                <button
                  type="button"
                  onClick={() => {
                    const pid = selectedPO?.id || selectedPO?._id;
                    if (!pid) {
                      alert("Invalid PO id");
                      return;
                    }
                    navigate(`/invoice/${pid}?auto=1`);
                  }}
                  className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                  aria-label="Download PO PDF"
                  title="Download PDF"
                >
                  Download
                </button>
                <button
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 active:scale-95"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Vendor</div>
                <div className="font-medium">
                  {selectedPO.vendor_name || selectedPO.vendor_id || "-"}
                </div>
              </div>

              <div>
                <div className="text-gray-500">Date</div>
                <div className="font-medium">
                  {formatDateDMY(selectedPO.date)}
                </div>
              </div>

              <div>
                <div className="text-gray-500">Bill Time</div>
                <div className="font-medium">
                  {formatBillTime(selectedPO.bill_time)}
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="text-gray-500">Address</div>
                <div className="font-medium">{selectedPO.address || "-"}</div>
              </div>

              <div>
                <div className="text-gray-500">Mobile</div>
                <div className="font-medium">{selectedPO.mobile_no || "-"}</div>
              </div>

              <div>
                <div className="text-gray-500">GST No</div>
                <div className="font-medium">{selectedPO.gst_no || "-"}</div>
              </div>

              <div>
                <div className="text-gray-500">Place of Supply</div>
                <div className="font-medium">
                  {selectedPO.place_of_supply || "-"}
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="text-gray-500">Terms</div>
                <div className="font-medium">
                  {selectedPO.terms_condition || "-"}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="text-sm font-semibold mb-2">Items</div>
              <div className="overflow-auto touch-pan-x">
                <table className="border text-xs" style={{ minWidth: 900 }}>
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-1">#</th>
                      <th className="border p-1 text-left">Product</th>
                      <th className="border p-1 text-left">HSN</th>
                      <th className="border p-1 text-right">Qty</th>
                      <th className="border p-1 text-right">Rate</th>
                      <th className="border p-1 text-right">Amount</th>
                      <th className="border p-1 text-right">Disc%/Unit</th>
                      <th className="border p-1 text-right">Disc Amt</th>
                      <th className="border p-1 text-right">GST%</th>
                      <th className="border p-1 text-right">GST Amt</th>
                      <th className="border p-1 text-right">Unit</th>
                      <th className="border p-1 text-right">Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPO.items && selectedPO.items.length > 0 ? (
                      selectedPO.items.map((it, idx) => {
                        const name =
                          it.product_name ||
                          it.item_name ||
                          productNameOf(it.product_id) ||
                          String(it.product_id);
                        return (
                          <tr
                            key={it.id || idx}
                            className="odd:bg-white even:bg-gray-50"
                          >
                            <td className="border p-1">{idx + 1}</td>
                            <td className="border p-1">{name}</td>
                            <td className="border p-1">{it.hsn_code || "-"}</td>
                            <td className="border p-1 text-right">
                              {fx(it.qty, 2)}
                            </td>
                            <td className="border p-1 text-right">
                              {fx(it.rate, 2)}
                            </td>
                            <td className="border p-1 text-right">
                              {fx(it.amount, 2)}
                            </td>
                            <td className="border p-1 text-right">
                              {fx(it.discount_per_qty ?? 0, 2)}{" "}
                              <span className="text-gray-500">
                                ({fx(it.discount_rate ?? 0, 2)})
                              </span>
                            </td>
                            <td className="border p-1 text-right">
                              {fx(it.discount_total ?? 0, 2)}
                            </td>
                            <td className="border p-1 text-right">
                              {fx(it.gst_percent ?? 0, 2)}
                            </td>

                            <td className="border p-1 text-right">
                              {fx(it.gst_amount ?? 0, 2)}
                            </td>
                            <td className="border p-1 text-right">
                              {it?.unit}
                            </td>
                            <td className="border p-1 text-right">
                              {fx(it.final_amount ?? it.total ?? 0, 2)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="border p-2 text-center" colSpan={11}>
                          No Items Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <div className="text-sm">
                  <div>
                    Taxable:{" "}
                    <span className="font-medium">
                      {fx(selectedPO?.summary?.total_taxable ?? 0)}
                    </span>
                  </div>
                  <div>
                    GST:{" "}
                    <span className="font-medium">
                      {fx(selectedPO?.summary?.total_gst ?? 0)}
                    </span>
                  </div>
                  <div className="font-semibold text-base">
                    Grand Total:{" "}
                    {fx(
                      selectedPO?.summary?.grand_total ??
                        selectedPO?.final_amount ??
                        0
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderList;
