// // src/components/customers/CustomersPage.jsx
// import { useEffect, useMemo, useState, useCallback } from "react";
// import customersAPI from "../../axios/customerAPI";
// import { toast } from "react-toastify";

// // Money formatter
// const inr = (n) => {
//   const num = Number(n);
//   if (!Number.isFinite(num)) return "₹0.00";
//   return new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     minimumFractionDigits: 2,
//   }).format(num);
// };

// // Inline Toggle
// function Toggle({ checked = false, onChange, disabled = false, size = "md" }) {
//   const sizes = {
//     sm: {
//       track: "h-5 w-10",
//       thumb: "h-4 w-4",
//       on: "translate-x-5",
//       off: "translate-x-1",
//     },
//     md: {
//       track: "h-6 w-12",
//       thumb: "h-5 w-5",
//       on: "translate-x-6",
//       off: "translate-x-1",
//     },
//     lg: {
//       track: "h-7 w-14",
//       thumb: "h-6 w-6",
//       on: "translate-x-7",
//       off: "translate-x-1",
//     },
//   };
//   const s = sizes[size] || sizes.md;

//   return (
//     <button
//       type="button"
//       onClick={() => !disabled && onChange?.(!checked)}
//       className={[
//         "relative inline-flex items-center rounded-full transition-colors focus:outline-none shadow-inner",
//         checked ? "bg-emerald-500" : "bg-gray-300",
//         disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
//         s.track,
//       ].join(" ")}
//       aria-pressed={checked}
//       aria-label="Toggle status"
//     >
//       <span
//         className={[
//           "inline-block transform rounded-full bg-white shadow transition-transform",
//           s.thumb,
//           checked ? s.on : s.off,
//         ].join(" ")}
//       />
//     </button>
//   );
// }

// // Sale Details Modal Component
// function SaleDetailsModal({ saleId, onClose }) {
//   const [saleDetails, setSaleDetails] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (saleId) {
//       fetchSaleDetails();
//     }
//   }, [saleId]);

//   const fetchSaleDetails = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const { data } = await customersAPI.getSaleItems(saleId);
//       setSaleDetails(data);
//     } catch (err) {
//       setError(err.message || "Failed to load sale details");
//       toast.error(err.message || "Failed to load sale details");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!saleId) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
//         <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
//           <h3 className="text-lg font-semibold">Sale Details</h3>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 text-2xl"
//           >
//             ✕
//           </button>
//         </div>

//         <div className="p-6 overflow-auto max-h-[70vh]">
//           {loading ? (
//             <div className="text-center py-8">Loading sale details...</div>
//           ) : error ? (
//             <div className="text-red-600 text-center py-8">{error}</div>
//           ) : saleDetails ? (
//             <>
//               {/* Sale Header */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
//                 <div>
//                   <div className="text-sm text-gray-600">Customer</div>
//                   <div className="font-semibold">
//                     {saleDetails.sale.customer_name}
//                   </div>
//                 </div>
//                 <div>
//                   <div className="text-sm text-gray-600">Bill No</div>
//                   <div className="font-semibold">
//                     {saleDetails.sale.bill_no}
//                   </div>
//                 </div>
//                 <div>
//                   <div className="text-sm text-gray-600">Date</div>
//                   <div>{saleDetails.sale.bill_date}</div>
//                 </div>
//                 <div>
//                   <div className="text-sm text-gray-600">Payment Status</div>
//                   <div
//                     className={`font-semibold ${
//                       saleDetails.sale.payment_status === "Paid"
//                         ? "text-green-600"
//                         : saleDetails.sale.payment_status === "Partial"
//                         ? "text-yellow-600"
//                         : "text-red-600"
//                     }`}
//                   >
//                     {saleDetails.sale.payment_status}
//                   </div>
//                 </div>
//                 {saleDetails.sale.firm_name && (
//                   <div>
//                     <div className="text-sm text-gray-600">Firm Name</div>
//                     <div>{saleDetails.sale.firm_name}</div>
//                   </div>
//                 )}
//                 {saleDetails.sale.customer_gst_no && (
//                   <div>
//                     <div className="text-sm text-gray-600">GST No</div>
//                     <div>{saleDetails.sale.customer_gst_no}</div>
//                   </div>
//                 )}
//                 {saleDetails.sale.customer_phone && (
//                   <div>
//                     <div className="text-sm text-gray-600">Phone</div>
//                     <div>{saleDetails.sale.customer_phone}</div>
//                   </div>
//                 )}
//                 <div>
//                   <div className="text-sm text-gray-600">Total Amount</div>
//                   <div className="font-semibold text-green-600">
//                     {inr(saleDetails.sale.total_amount)}
//                   </div>
//                 </div>
//               </div>

//               {/* Items Table */}
//               <div className="mb-6 overflow-x-auto">
//                 <table className="min-w-full border">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="p-3 border text-left">#</th>
//                       <th className="p-3 border text-left">Product</th>
//                       <th className="p-3 border text-left">Quantity</th>
//                       <th className="p-3 border text-left">Rate</th>
//                       <th className="p-3 border text-left">Discount</th>
//                       <th className="p-3 border text-left">Taxable Amount</th>
//                       <th className="p-3 border text-left">GST</th>
//                       <th className="p-3 border text-left">Total</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {saleDetails.items.map((item, idx) => (
//                       <tr key={item.id} className="hover:bg-gray-50">
//                         <td className="p-3 border">{idx + 1}</td>
//                         <td className="p-3 border">
//                           <div className="font-medium">{item.product_name}</div>
//                           <div className="text-sm text-gray-600">
//                             {item.product_code && `Code: ${item.product_code}`}
//                             {item.hsn_code && ` | HSN: ${item.hsn_code}`}
//                           </div>
//                         </td>
//                         <td className="p-3 border">
//                           {item.qty} {item.unit}
//                         </td>
//                         <td className="p-3 border">{inr(item.rate)}</td>
//                         <td className="p-3 border">
//                           <div>{inr(item.discount_amount)}</div>
//                           <div className="text-sm text-gray-600">
//                             ({item.discount_rate}%)
//                           </div>
//                         </td>
//                         <td className="p-3 border">
//                           {inr(item.taxable_amount)}
//                         </td>
//                         <td className="p-3 border">
//                           <div>{inr(item.gst_amount)}</div>
//                           <div className="text-sm text-gray-600">
//                             ({item.gst_percent}%)
//                           </div>
//                         </td>
//                         <td className="p-3 border font-semibold">
//                           {inr(item.net_total)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Totals */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
//                 <div className="text-center">
//                   <div className="text-sm text-gray-600">Total Amount</div>
//                   <div className="text-xl font-bold text-green-600">
//                     {inr(saleDetails.totals.total_amount)}
//                   </div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-sm text-gray-600">Total Taxable</div>
//                   <div className="text-lg font-semibold">
//                     {inr(saleDetails.totals.total_taxable)}
//                   </div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-sm text-gray-600">Total GST</div>
//                   <div className="text-lg font-semibold">
//                     {inr(saleDetails.totals.total_gst)}
//                   </div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-sm text-gray-600">Total Discount</div>
//                   <div className="text-lg font-semibold">
//                     {inr(saleDetails.totals.total_discount)}
//                   </div>
//                 </div>
//               </div>

//               {/* Calculations */}
//               <div className="grid grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg mb-4">
//                 <div className="text-center">
//                   <div className="text-sm text-gray-600">Discount %</div>
//                   <div className="text-lg font-semibold">
//                     {saleDetails.calculations?.discount_percentage || "0.00"}%
//                   </div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-sm text-gray-600">GST %</div>
//                   <div className="text-lg font-semibold">
//                     {saleDetails.calculations?.gst_percentage || "0.00"}%
//                   </div>
//                 </div>
//               </div>

//               {/* Payments if any */}
//               {saleDetails.payments && saleDetails.payments.length > 0 && (
//                 <div className="mb-4">
//                   <h4 className="font-semibold mb-2">Payments</h4>
//                   <div className="overflow-x-auto">
//                     <table className="min-w-full border">
//                       <thead className="bg-gray-100">
//                         <tr>
//                           <th className="p-2 border">Date</th>
//                           <th className="p-2 border">Amount</th>
//                           <th className="p-2 border">Method</th>
//                           <th className="p-2 border">Remarks</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {saleDetails.payments.map((payment, idx) => (
//                           <tr key={idx} className="hover:bg-gray-50">
//                             <td className="p-2 border">
//                               {payment.payment_date}
//                             </td>
//                             <td className="p-2 border font-semibold">
//                               {inr(payment.amount)}
//                             </td>
//                             <td className="p-2 border">{payment.method}</td>
//                             <td className="p-2 border">
//                               {payment.remarks || "-"}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               )}

//               {/* Remarks */}
//               {saleDetails.sale.remarks && (
//                 <div className="p-4 bg-blue-50 rounded-lg">
//                   <div className="text-sm text-gray-600 mb-1">Remarks</div>
//                   <div>{saleDetails.sale.remarks}</div>
//                 </div>
//               )}
//             </>
//           ) : null}
//         </div>

//         <div className="px-6 py-4 border-t bg-gray-50">
//           <button
//             onClick={onClose}
//             className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Form model
// const emptyForm = {
//   name: "",
//   firm_name: "",
//   email: "",
//   phone: "",
//   address: "",
//   status: "Active",
//   gst_no: "",
//   balance: 0,
//   min_balance: 5000,
// };

// // Escape key hook for modal
// function useEscape(handler) {
//   useEffect(() => {
//     const onKey = (e) => {
//       if (e.key === "Escape") handler?.();
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [handler]);
// }

// export default function CustomersPage() {
//   const [form, setForm] = useState(emptyForm);
//   const [editId, setEditId] = useState(null);
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState("");
//   const [q, setQ] = useState("");
//   const [showForm, setShowForm] = useState(false);

//   // Statement modal state
//   const [showStatement, setShowStatement] = useState(false);
//   const [statementRows, setStatementRows] = useState([]);
//   const [statementTotals, setStatementTotals] = useState(null);
//   const [statementLoading, setStatementLoading] = useState(false);
//   const [activeCustomer, setActiveCustomer] = useState(null);
//   const [stFrom, setStFrom] = useState(() => {
//     const d = new Date(Date.now() - 30 * 24 * 3600 * 1000);
//     return d.toISOString().slice(0, 10);
//   });
//   const [stTo, setStTo] = useState(() => new Date().toISOString().slice(0, 10));
//   const [stPage, setStPage] = useState(1);
//   const [stLimit, setStLimit] = useState(50);
//   const [stSort, setStSort] = useState("asc");

//   // Sale details modal state
//   const [showSaleDetails, setShowSaleDetails] = useState(null);

//   // Close modal on Escape
//   useEscape(() => {
//     if (showStatement) setShowStatement(false);
//     if (showSaleDetails) setShowSaleDetails(null);
//   });

//   // Search
//   const filtered = useMemo(() => {
//     const term = q.toLowerCase().trim();
//     if (!term) return rows;
//     return rows.filter((r) =>
//       [
//         r.name,
//         r.firm_name,
//         r.email,
//         r.phone,
//         r.address,
//         r.status,
//         r.balance,
//         r.gst_no,
//       ]
//         .filter(Boolean)
//         .some((v) => String(v).toLowerCase().includes(term))
//     );
//   }, [rows, q]);

//   const fetchAll = async () => {
//     setLoading(true);
//     try {
//       const { data } = await customersAPI.getAll();
//       setRows(Array.isArray(data) ? data : []);
//     } catch (e) {
//       const msg = e?.message || "Failed to load customers";
//       setErr(msg);
//       toast.error(msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAll();
//   }, []);

//   const validate = () => {
//     const gst = (form.gst_no || "").toUpperCase().trim();
//     if (!form.name.trim()) return "Name is required";
//     if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
//       return "Invalid email";
//     if (form.phone && !/^\d{7,15}$/.test(form.phone)) return "Invalid phone";
//     if (form.balance !== "" && Number(form.balance) < 0)
//       return "Balance cannot be negative";
//     if (form.min_balance !== "" && Number(form.min_balance) < 0)
//       return "Min balance cannot be negative";

//     return "";
//   };

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     const v = validate();
//     if (v) {
//       setErr(v);
//       toast.error(v);
//       return;
//     }
//     setErr("");
//     setLoading(true);
//     try {
//       const payload = {
//         name: form.name,
//         firm_name: form.firm_name || "",
//         email: form.email || "",
//         phone: form.phone || "",
//         address: form.address || "",
//         status: form.status || "Active",
//         gst_no: (form.gst_no || "").toUpperCase().trim() || "",
//         balance: Number(form.balance || 0),
//         min_balance: Number(form.min_balance || 5000),
//       };

//       if (editId) {
//         await customersAPI.update(editId, payload);
//         toast.success("Customer updated");
//       } else {
//         const res = await customersAPI.create(payload);
//         toast.success(
//           res?.status === 201 ? "Customer created" : "Customer created"
//         );
//       }
//       await fetchAll();
//       onReset();
//       setShowForm(false);
//     } catch (e2) {
//       const msg =
//         e2?.message || e2?.response?.data?.message || "Request failed";
//       setErr(msg);
//       toast.error(msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onReset = () => {
//     setForm(emptyForm);
//     setEditId(null);
//   };

//   const openCreate = () => {
//     onReset();
//     setShowForm(true);
//     setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
//   };

//   const onEdit = (row) => {
//     setEditId(row.id);
//     setForm({
//       name: row.name || "",
//       firm_name: row.firm_name || "",
//       email: row.email || "",
//       phone: row.phone || "",
//       address: row.address || "",
//       status: row.status || "Active",
//       gst_no: row.gst_no || row.GST_No || "",
//       balance: Number(row.balance ?? 0),
//       min_balance: Number(row.min_balance ?? 5000),
//     });
//     setShowForm(true);
//     setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
//   };

//   const onDelete = async (id) => {
//     if (!confirm("Delete this customer?")) return;
//     setLoading(true);
//     try {
//       await customersAPI.remove(id);
//       toast.success("Customer deleted");
//       await fetchAll();
//       if (editId === id) onReset();
//     } catch (e) {
//       toast.error(e?.message || "Failed to delete");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onToggleOptimistic = async (row) => {
//     const wasActive = String(row.status).toLowerCase() === "active";
//     setRows((list) =>
//       list.map((x) =>
//         x.id === row.id
//           ? { ...x, status: wasActive ? "Inactive" : "Active" }
//           : x
//       )
//     );
//     try {
//       await customersAPI.toggleStatus(row.id, row.status);
//       toast.success(`Status set to ${wasActive ? "Inactive" : "Active"}`);
//     } catch (e) {
//       setRows((list) =>
//         list.map((x) => (x.id === row.id ? { ...x, status: row.status } : x))
//       );
//       toast.error(e?.message || "Failed to toggle status");
//     }
//   };

//   // Statement fetcher
//   const fetchStatement = useCallback(
//     async (id, from, to, page, limit, sort) => {
//       try {
//         setStatementLoading(true);
//         const [{ data: st }, { data: sum }] = await Promise.all([
//           customersAPI.getStatement(id, { from, to, page, limit, sort }),
//           customersAPI.getSummary(id, { as_of: to }),
//         ]);
//         setStatementRows(Array.isArray(st?.rows) ? st.rows : []);
//         setStatementTotals(st?.totals ? { ...st.totals, ...sum } : sum || null);
//       } catch (e) {
//         toast.error(e?.message || "Failed to load statement");
//       } finally {
//         setStatementLoading(false);
//       }
//     },
//     []
//   );

//   const openStatement = (row) => {
//     setActiveCustomer(row);
//     setShowStatement(true);
//     setStPage(1);
//     void fetchStatement(row.id, stFrom, stTo, 1, stLimit, stSort);
//   };

//   // File download helpers for CSV/PDF that respect CORS and filename
//   const downloadBlob = (blob, filename) => {
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = filename;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const exportCSV = async () => {
//     if (!activeCustomer) return;
//     try {
//       const { data } = await customersAPI.exportStatementCSV(
//         activeCustomer.id,
//         { from: stFrom, to: stTo, sort: stSort }
//       );
//       downloadBlob(data, `customer_${activeCustomer.id}_statement.csv`);
//       toast.success("CSV downloaded successfully");
//     } catch (e) {
//       toast.error(e?.message || "CSV export failed");
//     }
//   };

//   const exportPDF = async () => {
//     if (!activeCustomer) return;
//     try {
//       const { data } = await customersAPI.exportStatementPDF(
//         activeCustomer.id,
//         { from: stFrom, to: stTo, sort: stSort }
//       );
//       downloadBlob(data, `customer_${activeCustomer.id}_statement.pdf`);
//       toast.success("PDF downloaded successfully");
//     } catch (e) {
//       toast.error(e?.message || "PDF export failed");
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto">
//       <div className="flex rounded-md items-center justify-between mb-4 bg-white shadow-md p-3">
//         <h2 className="text-xl font-bold">Customer Management</h2>
//         <button
//           type="button"
//           onClick={() => (showForm ? setShowForm(false) : openCreate())}
//           className={`px-4 py-2 rounded-lg text-white ${
//             showForm ? "bg-gray-600" : "bg-green-600"
//           }`}
//           title={showForm ? "Close form" : "Add new customer"}
//         >
//           {showForm ? "Close Form" : "+ Add Customer"}
//         </button>
//       </div>

//       {err && <div className="mb-3 text-red-600">{err}</div>}

//       {showForm && (
//         <form
//           onSubmit={onSubmit}
//           className="bg-white shadow-lg rounded-xl p-6 mb-6"
//         >
//           <h3 className="text-lg font-semibold mb-4">
//             {editId ? "Update Customer" : "Register Customer"}
//           </h3>

//           <div className="grid grid-cols-2 gap-4">
//             <div className="flex flex-col">
//               <label htmlFor="cust_name" className="text-sm text-gray-600 mb-1">
//                 Name
//               </label>
//               <input
//                 id="cust_name"
//                 type="text"
//                 placeholder="Full name"
//                 className="border p-2 rounded-lg"
//                 value={form.name}
//                 onChange={(e) => setForm({ ...form, name: e.target.value })}
//                 required
//               />
//             </div>

//             <div className="flex flex-col">
//               <label
//                 htmlFor="cust_firm_name"
//                 className="text-sm text-gray-600 mb-1"
//               >
//                 Firm Name
//               </label>
//               <input
//                 id="cust_firm_name"
//                 type="text"
//                 placeholder="Firm or company name"
//                 className="border p-2 rounded-lg"
//                 value={form.firm_name}
//                 onChange={(e) =>
//                   setForm({ ...form, firm_name: e.target.value })
//                 }
//               />
//             </div>

//             <div className="flex flex-col">
//               <label
//                 htmlFor="cust_email"
//                 className="text-sm text-gray-600 mb-1"
//               >
//                 Email
//               </label>
//               <input
//                 id="cust_email"
//                 type="email"
//                 placeholder="example@domain.com"
//                 className="border p-2 rounded-lg"
//                 value={form.email}
//                 onChange={(e) => setForm({ ...form, email: e.target.value })}
//               />
//             </div>

//             <div className="flex flex-col">
//               <label
//                 htmlFor="cust_phone"
//                 className="text-sm text-gray-600 mb-1"
//               >
//                 Phone
//               </label>
//               <input
//                 id="cust_phone"
//                 type="number"
//                 placeholder="Phone number"
//                 className="border p-2 rounded-lg"
//                 value={form.phone}
//                 onInput={(e) => {
//                   // Limit to 6 digits
//                   if (e.target.value.length > 10) {
//                     e.target.value = e.target.value.slice(0, 10);
//                   }
//                 }}
//                 onChange={(e) => setForm({ ...form, phone: e.target.value })}
//               />
//             </div>

//             <div className="flex flex-col">
//               <label
//                 htmlFor="cust_address"
//                 className="text-sm text-gray-600 mb-1"
//               >
//                 Address
//               </label>
//               <input
//                 id="cust_address"
//                 type="text"
//                 placeholder="Street, City, State"
//                 className="border p-2 rounded-lg"
//                 value={form.address}
//                 onChange={(e) => setForm({ ...form, address: e.target.value })}
//               />
//             </div>

//             <div className="flex flex-col">
//               <label
//                 htmlFor="cust_gst_no"
//                 className="text-sm text-gray-600 mb-1"
//               >
//                 GST No.
//               </label>
//               <input
//                 id="cust_gst_no"
//                 type="text"
//                 placeholder="15-char GSTIN (optional)"
//                 className="border p-2 rounded-lg uppercase"
//                 value={form.gst_no}
//                 onChange={(e) =>
//                   setForm({ ...form, gst_no: e.target.value.toUpperCase() })
//                 }
//                 maxLength={15}
//               />
//             </div>

//             <div className="flex flex-col">
//               <label
//                 htmlFor="cust_balance"
//                 className="text-sm text-gray-600 mb-1"
//               >
//                 Balance (₹)
//               </label>
//               <input
//                 id="cust_balance"
//                 type="number"
//                 step="1"
//                 className="border p-2 rounded-lg"
//                 value={form.balance}
//                 onChange={(e) => setForm({ ...form, balance: e.target.value })}
//               />
//             </div>

//             {/* Min Balance stays only in form */}
//             <div className="flex flex-col">
//               <label
//                 htmlFor="cust_min_balance"
//                 className="text-sm text-gray-600 mb-1"
//               >
//                 Min Balance (₹)
//               </label>
//               <input
//                 id="cust_min_balance"
//                 type="number"
//                 step="1"
//                 className="border p-2 rounded-lg"
//                 value={form.min_balance}
//                 onChange={(e) =>
//                   setForm({ ...form, min_balance: e.target.value })
//                 }
//               />
//             </div>

//             <div className="flex flex-col">
//               <label
//                 htmlFor="cust_status"
//                 className="text-sm text-gray-600 mb-1"
//               >
//                 Status
//               </label>
//               <select
//                 id="cust_status"
//                 className="border p-2 rounded-lg"
//                 value={form.status}
//                 onChange={(e) => setForm({ ...form, status: e.target.value })}
//               >
//                 <option>Active</option>
//                 <option>Inactive</option>
//               </select>
//             </div>
//           </div>

//           <div className="mt-4 flex gap-2">
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
//             >
//               {editId ? "Update" : "Register"}
//             </button>
//             <button
//               type="button"
//               onClick={onReset}
//               className="px-4 py-2 bg-gray-200 rounded-lg"
//             >
//               Reset
//             </button>
//           </div>
//         </form>
//       )}

//       {/* List + Search */}
//       <div className="bg-white shadow-lg rounded-xl p-6">
//         <div className="flex items-center justify-between mb-3">
//           <h3 className="text-lg font-semibold">Customers</h3>
//           <input
//             className="border p-2 rounded-lg w-60"
//             placeholder="Search..."
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//           />
//         </div>

//         {loading ? (
//           <p>Loading...</p>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full border">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th className="p-2 border">S.No.</th>
//                   <th className="p-2 border">Name</th>
//                   <th className="p-2 border">Firm Name</th>
//                   <th className="p-2 border">Email</th>
//                   <th className="p-2 border">Phone</th>
//                   <th className="p-2 border">Address</th>
//                   <th className="p-2 border">GST No.</th>
//                   <th className="p-2 border">Balance</th>
//                   <th className="p-2 border">Status</th>
//                   <th className="p-2 border">Created At</th>
//                   <th className="p-2 border">Updated At</th>
//                   <th className="p-2 border">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtered.map((r, idx) => {
//                   const bal = Number(r.balance ?? 0);
//                   const minBal = Number(r.min_balance ?? 0);
//                   const isNeg = bal < 0;
//                   const isOverMin = bal >= minBal;
//                   return (
//                     <tr key={r.id} className="hover:bg-gray-50">
//                       <td className="p-2 border">{idx + 1}</td>
//                       <td className="p-2 border">
//                         <button
//                           type="button"
//                           onClick={() => openStatement(r)}
//                           className="text-blue-600 underline hover:text-blue-800"
//                           title="View transactions"
//                         >
//                           {r.name}
//                         </button>
//                       </td>
//                       <td className="p-2 border">{r.firm_name}</td>
//                       <td className="p-2 border">{r.email}</td>
//                       <td className="p-2 border">{r.phone}</td>
//                       <td className="p-2 border">{r.address}</td>
//                       <td className="p-2 border">
//                         {r.gst_no || r.GST_No || "-"}
//                       </td>
//                       <td
//                         className={`p-2 border ${
//                           isNeg || isOverMin
//                             ? "text-red-600 font-semibold"
//                             : "text-gray-800"
//                         }`}
//                       >
//                         {inr(bal)}
//                       </td>
//                       <td className="p-2 border">
//                         <Toggle
//                           checked={String(r.status).toLowerCase() === "active"}
//                           onChange={() => onToggleOptimistic(r)}
//                           size="md"
//                         />
//                       </td>
//                       <td className="p-2 border">
//                         {r.created_at_formatted || r.created_at}
//                       </td>
//                       <td className="p-2 border">
//                         {r.updated_at_formatted || r.updated_at}
//                       </td>
//                       <td className="p-2 border">
//                         <div className="flex gap-2">
//                           <button
//                             className="px-3 py-1 bg-blue-600 text-white rounded"
//                             onClick={() => onEdit(r)}
//                           >
//                             Edit
//                           </button>
//                           <button
//                             className="px-3 py-1 bg-red-600 text-white rounded"
//                             onClick={() => onDelete(r.id)}
//                           >
//                             Delete
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//                 {!filtered.length && (
//                   <tr>
//                     <td className="p-4 text-center" colSpan={12}>
//                       No customers found
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Statement Modal (transactions + CSV/PDF) */}
//       {showStatement && (
//         <div
//           className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
//           onClick={() => setShowStatement(false)}
//           role="dialog"
//           aria-modal="true"
//         >
//           <div
//             className="bg-white rounded-xl shadow-2xl w-[1200px] max-h-[85vh] overflow-hidden"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="px-5 py-3 border-b bg-white/60 backdrop-blur-sm">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center shadow-sm">
//                     <span className="text-sm font-semibold">
//                       {(activeCustomer?.name || "C")
//                         .substring(0, 1)
//                         .toUpperCase()}
//                     </span>
//                   </div>
//                   <div className="flex flex-col">
//                     <div className="flex items-center gap-2">
//                       <h3 className="text-lg font-semibold tracking-tight">
//                         {activeCustomer?.name}
//                       </h3>
//                       <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
//                         Customer Statement
//                       </span>
//                     </div>
//                     <div className="text-xs text-gray-500">
//                       Range: {stFrom} → {stTo} · Sort:{" "}
//                       {stSort === "asc" ? "Oldest → Newest" : "Newest → Oldest"}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <button
//                     type="button"
//                     className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 transition-colors shadow-sm"
//                     onClick={exportCSV}
//                     title="Download CSV"
//                   >
//                     CSV
//                   </button>
//                   <button
//                     type="button"
//                     className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700 active:from-purple-800 active:to-fuchsia-800 transition-colors shadow-md"
//                     onClick={exportPDF}
//                     title="Download PDF"
//                   >
//                     PDF
//                   </button>
//                   <button
//                     type="button"
//                     className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors"
//                     onClick={() => setShowStatement(false)}
//                     title="Close"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>

//             <div className="px-5 py-3 border-b flex gap-3 items-end">
//               <div>
//                 <label className="text-xs text-gray-600">From</label>
//                 <input
//                   type="date"
//                   className="border p-2 rounded w-44"
//                   value={stFrom}
//                   onChange={(e) => setStFrom(e.target.value)}
//                 />
//               </div>
//               <div>
//                 <label className="text-xs text-gray-600">To</label>
//                 <input
//                   type="date"
//                   className="border p-2 rounded w-44"
//                   value={stTo}
//                   onChange={(e) => setStTo(e.target.value)}
//                 />
//               </div>
//               <div>
//                 <label className="text-xs text-gray-600">Sort</label>
//                 <select
//                   className="border p-2 rounded"
//                   value={stSort}
//                   onChange={(e) => setStSort(e.target.value)}
//                 >
//                   <option value="asc">Oldest → Newest</option>
//                   <option value="desc">Newest → Oldest</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="text-xs text-gray-600">Page size</label>
//                 <select
//                   className="border p-2 rounded"
//                   value={stLimit}
//                   onChange={(e) => setStLimit(Number(e.target.value))}
//                 >
//                   <option>25</option>
//                   <option>50</option>
//                   <option>100</option>
//                 </select>
//               </div>
//               <button
//                 className="px-4 py-2 rounded bg-blue-600 text-white"
//                 disabled={statementLoading || !activeCustomer}
//                 onClick={() => {
//                   setStPage(1);
//                   if (activeCustomer)
//                     fetchStatement(
//                       activeCustomer.id,
//                       stFrom,
//                       stTo,
//                       1,
//                       stLimit,
//                       stSort
//                     );
//                 }}
//               >
//                 Apply
//               </button>
//             </div>

//             <div className="px-5 py-3 grid grid-cols-6 gap-3 border-b bg-gray-50">
//               <div className="p-3 rounded bg-white shadow-sm">
//                 <div className="text-xs text-gray-500">Opening Balance</div>
//                 <div className="font-semibold">
//                   {inr(statementTotals?.opening_balance || 0)}
//                 </div>
//               </div>
//               <div className="p-3 rounded bg-white shadow-sm">
//                 <div className="text-xs text-gray-500">Total Invoiced</div>
//                 <div className="font-semibold">
//                   {inr(statementTotals?.total_invoiced || 0)}
//                 </div>
//               </div>
//               <div className="p-3 rounded bg-white shadow-sm">
//                 <div className="text-xs text-gray-500">Total Taxable</div>
//                 <div className="font-semibold">
//                   {inr(statementTotals?.total_taxable || 0)}
//                 </div>
//               </div>
//               <div className="p-3 rounded bg-white shadow-sm">
//                 <div className="text-xs text-gray-500">Total GST</div>
//                 <div className="font-semibold">
//                   {inr(statementTotals?.total_gst || 0)}
//                 </div>
//               </div>
//               <div className="p-3 rounded bg-white shadow-sm">
//                 <div className="text-xs text-gray-500">Total Paid</div>
//                 <div className="font-semibold">
//                   {inr(statementTotals?.total_paid || 0)}
//                 </div>
//               </div>
//               <div className="p-3 rounded bg-white shadow-sm">
//                 <div className="text-xs text-gray-500">
//                   Outstanding (as of To)
//                 </div>
//                 <div className="font-semibold">
//                   {inr(
//                     statementTotals?.outstanding_as_of ||
//                       statementTotals?.outstanding_as_of_to ||
//                       0
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="p-5 overflow-auto max-h-[50vh]">
//               {statementLoading ? (
//                 <div>Loading...</div>
//               ) : (
//                 <table className="min-w-full border">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="p-2 border">Date/Time</th>
//                       <th className="p-2 border">Type</th>
//                       <th className="p-2 border">Ref No</th>
//                       <th className="p-2 border">Amount</th>
//                       <th className="p-2 border">Taxable</th>
//                       <th className="p-2 border">GST</th>
//                       <th className="p-2 border">Net Effect</th>
//                       <th className="p-2 border">Running Balance</th>
//                       <th className="p-2 border">Method</th>
//                       <th className="p-2 border">Remarks</th>
//                       <th className="p-2 border">Details</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {statementRows.map((r, i) => (
//                       <tr key={`${r.ref_no}-${i}`} className="hover:bg-gray-50">
//                         <td className="p-2 border">{r.tx_datetime}</td>
//                         <td className="p-2 border">
//                           <span
//                             className={`px-2 py-1 rounded text-xs ${
//                               r.tx_type === "INVOICE"
//                                 ? "bg-blue-100 text-blue-800"
//                                 : "bg-green-100 text-green-800"
//                             }`}
//                           >
//                             {r.tx_type}
//                           </span>
//                         </td>
//                         <td className="p-2 border">{r.ref_no}</td>
//                         <td className="p-2 border">{inr(r.amount)}</td>
//                         <td className="p-2 border">
//                           {inr(r.total_taxable || 0)}
//                         </td>
//                         <td className="p-2 border">{inr(r.total_gst || 0)}</td>
//                         <td className="p-2 border">{inr(r.net_effect)}</td>
//                         <td className="p-2 border">{inr(r.running_balance)}</td>
//                         <td className="p-2 border">
//                           {r.payment_method || "-"}
//                         </td>
//                         <td className="p-2 border">{r.note || "-"}</td>
//                         <td className="p-2 border">
//                           {r.tx_type === "INVOICE" && r.sale_id && (
//                             <button
//                               onClick={() => setShowSaleDetails(r.sale_id)}
//                               className="px-2 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
//                               title="View sale details"
//                             >
//                               View Details
//                             </button>
//                           )}
//                         </td>
//                       </tr>
//                     ))}
//                     {!statementRows.length && (
//                       <tr>
//                         <td className="p-4 text-center" colSpan={11}>
//                           No transactions
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               )}
//             </div>

//             <div className="px-5 py-3 border-t flex items-center justify-between">
//               <div className="text-sm text-gray-600">Page {stPage}</div>
//               <div className="flex gap-2">
//                 <button
//                   className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
//                   disabled={stPage <= 1 || statementLoading}
//                   onClick={() => {
//                     const p = Math.max(1, stPage - 1);
//                     setStPage(p);
//                     if (activeCustomer)
//                       fetchStatement(
//                         activeCustomer.id,
//                         stFrom,
//                         stTo,
//                         p,
//                         stLimit,
//                         stSort
//                       );
//                   }}
//                 >
//                   Prev
//                 </button>
//                 <button
//                   className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
//                   disabled={statementRows.length < stLimit || statementLoading}
//                   onClick={() => {
//                     const p = stPage + 1;
//                     setStPage(p);
//                     if (activeCustomer)
//                       fetchStatement(
//                         activeCustomer.id,
//                         stFrom,
//                         stTo,
//                         p,
//                         stLimit,
//                         stSort
//                       );
//                   }}
//                 >
//                   Next
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Sale Details Modal */}
//       {showSaleDetails && (
//         <SaleDetailsModal
//           saleId={showSaleDetails}
//           onClose={() => setShowSaleDetails(null)}
//         />
//       )}
//     </div>
//   );
// }

import { useEffect, useMemo, useState, useCallback } from "react";
import customersAPI from "../../axios/customerAPI";
import { toast } from "react-toastify";
import { Building2, Users, UserCheck, UserX } from "lucide-react";

function formatDateDDMMYYYY(dateInput) {
  if (!dateInput) return "";

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// Money formatter
const inr = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
};

// Inline Toggle
function Toggle({ checked = false, onChange, disabled = false, size = "md" }) {
  const sizes = {
    sm: {
      track: "h-5 w-10",
      thumb: "h-4 w-4",
      on: "translate-x-5",
      off: "translate-x-1",
    },
    md: {
      track: "h-6 w-12",
      thumb: "h-5 w-5",
      on: "translate-x-6",
      off: "translate-x-1",
    },
    lg: {
      track: "h-7 w-14",
      thumb: "h-6 w-6",
      on: "translate-x-7",
      off: "translate-x-1",
    },
  };
  const s = sizes[size] || sizes.md;

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange?.(!checked)}
      className={[
        "relative inline-flex items-center rounded-full transition-colors focus:outline-none shadow-inner",
        checked ? "bg-emerald-500" : "bg-gray-300",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        s.track,
      ].join(" ")}
      aria-pressed={checked}
      aria-label="Toggle status"
    >
      <span
        className={[
          "inline-block transform rounded-full bg-white shadow transition-transform",
          s.thumb,
          checked ? s.on : s.off,
        ].join(" ")}
      />
    </button>
  );
}

// Sale Details Modal Component
function SaleDetailsModal({ saleId, onClose }) {
  const [saleDetails, setSaleDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (saleId) {
      fetchSaleDetails();
    }
  }, [saleId]);

  const fetchSaleDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await customersAPI.getSaleItems(saleId);
      setSaleDetails(data);
    } catch (err) {
      setError(err.message || "Failed to load sale details");
      toast.error(err.message || "Failed to load sale details");
    } finally {
      setLoading(false);
    }
  };

  if (!saleId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sale Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-auto max-h-[70vh]">
          {loading ? (
            <div className="text-center py-8">Loading sale details...</div>
          ) : error ? (
            <div className="text-red-600 text-center py-8">{error}</div>
          ) : saleDetails ? (
            <>
              {/* Sale Header */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Customer</div>
                  <div className="font-semibold">
                    {saleDetails.sale.customer_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Bill No</div>
                  <div className="font-semibold">
                    {saleDetails.sale.bill_no}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Date</div>
                  <div>{saleDetails.sale.bill_date}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Payment Status</div>
                  <div
                    className={`font-semibold ${
                      saleDetails.sale.payment_status === "Paid"
                        ? "text-green-600"
                        : saleDetails.sale.payment_status === "Partial"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {saleDetails.sale.payment_status}
                  </div>
                </div>
                {saleDetails.sale.firm_name && (
                  <div>
                    <div className="text-sm text-gray-600">Firm Name</div>
                    <div>{saleDetails.sale.firm_name}</div>
                  </div>
                )}
                {saleDetails.sale.customer_gst_no && (
                  <div>
                    <div className="text-sm text-gray-600">GST No</div>
                    <div>{saleDetails.sale.customer_gst_no}</div>
                  </div>
                )}
                {saleDetails.sale.customer_phone && (
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <div>{saleDetails.sale.customer_phone}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="font-semibold text-green-600">
                    {inr(saleDetails.sale.total_amount)}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6 overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 border text-left">#</th>
                      <th className="p-3 border text-left">Product</th>
                      <th className="p-3 border text-left">Quantity</th>
                      <th className="p-3 border text-left">Rate</th>
                      <th className="p-3 border text-left">Discount</th>
                      <th className="p-3 border text-left">Taxable Amount</th>
                      <th className="p-3 border text-left">GST</th>
                      <th className="p-3 border text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleDetails.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-3 border">{idx + 1}</td>
                        <td className="p-3 border">
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-gray-600">
                            {item.product_code && `Code: ${item.product_code}`}
                            {item.hsn_code && ` | HSN: ${item.hsn_code}`}
                          </div>
                        </td>
                        <td className="p-3 border">
                          {item.qty} {item.unit}
                        </td>
                        <td className="p-3 border">{inr(item.rate)}</td>
                        <td className="p-3 border">
                          <div>{inr(item.discount_amount)}</div>
                          <div className="text-sm text-gray-600">
                            ({item.discount_rate}%)
                          </div>
                        </td>
                        <td className="p-3 border">
                          {inr(item.taxable_amount)}
                        </td>
                        <td className="p-3 border">
                          <div>{inr(item.gst_amount)}</div>
                          <div className="text-sm text-gray-600">
                            ({item.gst_percent}%)
                          </div>
                        </td>
                        <td className="p-3 border font-semibold">
                          {inr(item.net_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="text-xl font-bold text-green-600">
                    {inr(saleDetails.totals.total_amount)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Total Taxable</div>
                  <div className="text-lg font-semibold">
                    {inr(saleDetails.totals.total_taxable)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Total GST</div>
                  <div className="text-lg font-semibold">
                    {inr(saleDetails.totals.total_gst)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Total Discount</div>
                  <div className="text-lg font-semibold">
                    {inr(saleDetails.totals.total_discount)}
                  </div>
                </div>
              </div>

              {/* Calculations */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg mb-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Discount %</div>
                  <div className="text-lg font-semibold">
                    {saleDetails.calculations?.discount_percentage || "0.00"}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">GST %</div>
                  <div className="text-lg font-semibold">
                    {saleDetails.calculations?.gst_percentage || "0.00"}%
                  </div>
                </div>
              </div>

              {/* Payments if any */}
              {saleDetails.payments && saleDetails.payments.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Payments</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 border">Date</th>
                          <th className="p-2 border">Amount</th>
                          <th className="p-2 border">Method</th>
                          <th className="p-2 border">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleDetails.payments.map((payment, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-2 border">
                              {payment.payment_date}
                            </td>
                            <td className="p-2 border font-semibold">
                              {inr(payment.amount)}
                            </td>
                            <td className="p-2 border">{payment.method}</td>
                            <td className="p-2 border">
                              {payment.remarks || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Remarks */}
              {saleDetails.sale.remarks && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Remarks</div>
                  <div>{saleDetails.sale.remarks}</div>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Form model
const emptyForm = {
  name: "",
  firm_name: "",
  email: "",
  phone: "",
  address: "",
  status: "Active",
  gst_no: "",
  balance: 0,
  min_balance: 5000,
};

// Escape key hook for modal
function useEscape(handler) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handler?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler]);
}

export default function CustomersPage() {
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Toggle state for active/inactive customers
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Statement modal state
  const [showStatement, setShowStatement] = useState(false);
  const [statementRows, setStatementRows] = useState([]);
  const [statementTotals, setStatementTotals] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [stFrom, setStFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [stTo, setStTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [stPage, setStPage] = useState(1);
  const [stLimit, setStLimit] = useState(50);
  const [stSort, setStSort] = useState("asc");

  // Sale details modal state
  const [showSaleDetails, setShowSaleDetails] = useState(null);

  // Close modal on Escape
  useEscape(() => {
    if (showStatement) setShowStatement(false);
    if (showSaleDetails) setShowSaleDetails(null);
  });

  // Fetch all customers
  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await customersAPI.getAll();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.message || "Failed to load customers";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Filter customers based on showInactive toggle and search
  const filteredCustomers = useMemo(() => {
    // First filter by active/inactive status
    const statusFiltered = showInactive
      ? rows.filter(
          (c) => (c.status || "").toString().toLowerCase() === "inactive"
        )
      : rows.filter(
          (c) => (c.status || "").toString().toLowerCase() === "active"
        );

    // Then apply search filter
    const term = q.toLowerCase().trim();
    if (!term) return statusFiltered;

    return statusFiltered.filter((c) =>
      [
        c.name,
        c.firm_name,
        c.email,
        c.phone,
        c.address,
        c.status,
        c.balance,
        c.gst_no || c.GST_No,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [rows, q, showInactive]);

  // Calculate pagination
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  }, [filteredCustomers, pageSize]);

  const currentPageCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page, pageSize]);

  const totalCustomers = rows.length;
  const activeCustomers = rows.filter(
    (c) => (c.status || "").toString().toLowerCase() === "active"
  ).length;
  const inactiveCustomers = totalCustomers - activeCustomers;

  const validate = () => {
    const gst = (form.gst_no || "").toUpperCase().trim();
    if (!form.name.trim()) return "Name is required";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      return "Invalid email";
    if (form.phone && !/^\d{7,15}$/.test(form.phone)) return "Invalid phone";
    if (form.balance !== "" && Number(form.balance) < 0)
      return "Balance cannot be negative";
    if (form.min_balance !== "" && Number(form.min_balance) < 0)
      return "Min balance cannot be negative";

    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setErr(v);
      toast.error(v);
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        firm_name: form.firm_name || "",
        email: form.email || "",
        phone: form.phone || "",
        address: form.address || "",
        status: form.status || "Active",
        gst_no: (form.gst_no || "").toUpperCase().trim() || "",
        balance: Number(form.balance || 0),
        min_balance: Number(form.min_balance || 5000),
      };

      if (editId) {
        await customersAPI.update(editId, payload);
        toast.success("Customer updated");
      } else {
        const res = await customersAPI.create(payload);
        toast.success(
          res?.status === 201 ? "Customer created" : "Customer created"
        );
      }
      await fetchAll();
      onReset();
      setShowForm(false);
    } catch (e2) {
      const msg =
        e2?.message || e2?.response?.data?.message || "Request failed";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const openCreate = () => {
    onReset();
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const onEdit = (row) => {
    setEditId(row.id);
    setForm({
      name: row.name || "",
      firm_name: row.firm_name || "",
      email: row.email || "",
      phone: row.phone || "",
      address: row.address || "",
      status: row.status || "Active",
      gst_no: row.gst_no || row.GST_No || "",
      balance: Number(row.balance ?? 0),
      min_balance: Number(row.min_balance ?? 5000),
    });
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this customer?")) return;
    setLoading(true);
    try {
      await customersAPI.remove(id);
      toast.success("Customer deleted");
      await fetchAll();
      if (editId === id) onReset();
    } catch (e) {
      toast.error(e?.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const onToggleOptimistic = async (row) => {
    const wasActive = String(row.status).toLowerCase() === "active";
    setRows((list) =>
      list.map((x) =>
        x.id === row.id
          ? { ...x, status: wasActive ? "Inactive" : "Active" }
          : x
      )
    );
    try {
      await customersAPI.toggleStatus(row.id, row.status);
      toast.success(`Status set to ${wasActive ? "Inactive" : "Active"}`);
    } catch (e) {
      setRows((list) =>
        list.map((x) => (x.id === row.id ? { ...x, status: row.status } : x))
      );
      toast.error(e?.message || "Failed to toggle status");
    }
  };

  // Statement fetcher
  const fetchStatement = useCallback(
    async (id, from, to, page, limit, sort) => {
      try {
        setStatementLoading(true);
        const [{ data: st }, { data: sum }] = await Promise.all([
          customersAPI.getStatement(id, { from, to, page, limit, sort }),
          customersAPI.getSummary(id, { as_of: to }),
        ]);
        setStatementRows(Array.isArray(st?.rows) ? st.rows : []);
        setStatementTotals(st?.totals ? { ...st.totals, ...sum } : sum || null);
      } catch (e) {
        toast.error(e?.message || "Failed to load statement");
      } finally {
        setStatementLoading(false);
      }
    },
    []
  );

  const openStatement = (row) => {
    setActiveCustomer(row);
    setShowStatement(true);
    setStPage(1);
    void fetchStatement(row.id, stFrom, stTo, 1, stLimit, stSort);
  };

  // File download helpers for CSV/PDF that respect CORS and filename
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = async () => {
    if (!activeCustomer) return;
    try {
      const { data } = await customersAPI.exportStatementCSV(
        activeCustomer.id,
        { from: stFrom, to: stTo, sort: stSort }
      );
      downloadBlob(data, `customer_${activeCustomer.id}_statement.csv`);
      toast.success("CSV downloaded successfully");
    } catch (e) {
      toast.error(e?.message || "CSV export failed");
    }
  };

  const exportPDF = async () => {
    if (!activeCustomer) return;
    try {
      const { data } = await customersAPI.exportStatementPDF(
        activeCustomer.id,
        { from: stFrom, to: stTo, sort: stSort }
      );
      downloadBlob(data, `customer_${activeCustomer.id}_statement.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (e) {
      toast.error(e?.message || "PDF export failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Customer Management
        </h2>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-100 via-blue-200 to-blue-50 rounded-lg shadow p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-blue-900">
                Total Customers
              </p>
              <Users size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-2">
              {totalCustomers}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-100 via-green-200 to-green-50 rounded-lg shadow p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-green-900">Active</p>
              <UserCheck size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900 mt-2">
              {activeCustomers}
            </p>
          </div>
          <div className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-50 rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Inactive</p>
              <UserX size={18} className="text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {inactiveCustomers}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 via-purple-200 to-purple-50 rounded-lg shadow p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-purple-900">Showing</p>
              <span
                className={`w-3 h-3 rounded-full ${
                  showInactive ? "bg-gray-500" : "bg-green-500"
                }`}
              />
            </div>
            <p className="text-2xl font-bold text-purple-900 mt-2">
              {showInactive ? "Inactive" : "Active"}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              ({filteredCustomers.length} customers)
            </p>
          </div>
        </div>

        {/* Search, Toggle, and Add Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, firm, email, phone..."
              className="border rounded px-3 py-2 w-full max-w-md"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Toggle Button */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              Show Inactive Customers
            </span>
            <button
              onClick={() => {
                setShowInactive(!showInactive);
                setPage(1);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                showInactive ? "bg-purple-600" : "bg-gray-300"
              }`}
              aria-label={
                showInactive
                  ? "Show active customers"
                  : "Show inactive customers"
              }
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  showInactive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Add Customer Button */}
          <button
            type="button"
            onClick={() => (showForm ? setShowForm(false) : openCreate())}
            className={`px-4 py-2 rounded-lg text-white ${
              showForm ? "bg-gray-600" : "bg-green-600"
            } hover:opacity-90`}
            title={showForm ? "Close form" : "Add new customer"}
          >
            {showForm ? "Close Form" : "+ Add Customer"}
          </button>
        </div>

        {/* Info banner when showing inactive customers */}
        {showInactive && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-yellow-700">
                Showing inactive customers only. To activate a customer, click
                on its status toggle.
              </p>
            </div>
          </div>
        )}
      </div>

      {err && (
        <div className="mb-6 text-red-600 bg-red-50 p-3 rounded-lg">{err}</div>
      )}

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="bg-white shadow-lg rounded-xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">
            {editId ? "Update Customer" : "Register Customer"}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="cust_name" className="text-sm text-gray-600 mb-1">
                Name
              </label>
              <input
                id="cust_name"
                type="text"
                placeholder="Full name"
                className="border p-2 rounded-lg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="cust_firm_name"
                className="text-sm text-gray-600 mb-1"
              >
                Firm Name
              </label>
              <input
                id="cust_firm_name"
                type="text"
                placeholder="Firm or company name"
                className="border p-2 rounded-lg"
                value={form.firm_name}
                onChange={(e) =>
                  setForm({ ...form, firm_name: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="cust_email"
                className="text-sm text-gray-600 mb-1"
              >
                Email
              </label>
              <input
                id="cust_email"
                type="email"
                placeholder="example@domain.com"
                className="border p-2 rounded-lg"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="cust_phone"
                className="text-sm text-gray-600 mb-1"
              >
                Phone
              </label>
              <input
                id="cust_phone"
                type="number"
                placeholder="Phone number"
                className="border p-2 rounded-lg"
                value={form.phone}
                onInput={(e) => {
                  // Limit to 10 digits
                  if (e.target.value.length > 10) {
                    e.target.value = e.target.value.slice(0, 10);
                  }
                }}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="cust_address"
                className="text-sm text-gray-600 mb-1"
              >
                Address
              </label>
              <input
                id="cust_address"
                type="text"
                placeholder="Street, City, State"
                className="border p-2 rounded-lg"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="cust_gst_no"
                className="text-sm text-gray-600 mb-1"
              >
                GST No.
              </label>
              <input
                id="cust_gst_no"
                type="text"
                placeholder="15-char GSTIN (optional)"
                className="border p-2 rounded-lg uppercase"
                value={form.gst_no}
                onChange={(e) =>
                  setForm({ ...form, gst_no: e.target.value.toUpperCase() })
                }
                maxLength={15}
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="cust_balance"
                className="text-sm text-gray-600 mb-1"
              >
                Balance (₹)
              </label>
              <input
                id="cust_balance"
                type="number"
                step="1"
                className="border p-2 rounded-lg"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
              />
            </div>

            {/* Min Balance stays only in form */}
            <div className="flex flex-col">
              <label
                htmlFor="cust_min_balance"
                className="text-sm text-gray-600 mb-1"
              >
                Min Balance (₹)
              </label>
              <input
                id="cust_min_balance"
                type="number"
                step="1"
                className="border p-2 rounded-lg"
                value={form.min_balance}
                onChange={(e) =>
                  setForm({ ...form, min_balance: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="cust_status"
                className="text-sm text-gray-600 mb-1"
              >
                Status
              </label>
              <select
                id="cust_status"
                className="border p-2 rounded-lg"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60 hover:bg-blue-700"
            >
              {editId ? "Update" : "Register"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </form>
      )}

      {/* Customers Table */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Customers List</h3>
          <div className="text-sm text-gray-600">
            Showing {currentPageCustomers.length} of {filteredCustomers.length}{" "}
            customers
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading customers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border text-left">S.No.</th>
                  <th className="p-3 border text-left">Name</th>
                  <th className="p-3 border text-left">Firm Name</th>
                  <th className="p-3 border text-left">Email</th>
                  <th className="p-3 border text-left">Phone</th>
                  <th className="p-3 border text-left">Address</th>
                  <th className="p-3 border text-left">GST No.</th>
                  <th className="p-3 border text-left">Balance</th>
                  <th className="p-3 border text-left">Status</th>
                  <th className="p-3 border text-left">Created At</th>
                  <th className="p-3 border text-left">Updated At</th>
                  <th className="p-3 border text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPageCustomers.map((r, idx) => {
                  const bal = Number(r.balance ?? 0);
                  const minBal = Number(r.min_balance ?? 0);
                  const isNeg = bal < 0;
                  const isOverMin = bal >= minBal;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="p-3 border">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="p-3 border">
                        <button
                          type="button"
                          onClick={() => openStatement(r)}
                          className="text-blue-600 underline hover:text-blue-800"
                          title="View transactions"
                        >
                          {r.name}
                        </button>
                      </td>
                      <td className="p-3 border">{r.firm_name}</td>
                      <td className="p-3 border">{r.email}</td>
                      <td className="p-3 border">{r.phone}</td>
                      <td className="p-3 border">{r.address}</td>
                      <td className="p-3 border">
                        {r.gst_no || r.GST_No || "-"}
                      </td>
                      <td
                        className={`p-3 border ${
                          isNeg || isOverMin
                            ? "text-red-600 font-semibold"
                            : "text-gray-800"
                        }`}
                      >
                        {inr(bal)}
                      </td>
                      <td className="p-3 border">
                        <Toggle
                          checked={String(r.status).toLowerCase() === "active"}
                          onChange={() => onToggleOptimistic(r)}
                          size="md"
                        />
                      </td>
                      <td className="p-3 border">
                        {formatDateDDMMYYYY(r.created_at_formatted) ||
                          formatDateDDMMYYYY(r.created_at)}
                      </td>
                      <td className="p-3 border">
                        {formatDateDDMMYYYY(r.updated_at_formatted) ||
                          formatDateDDMMYYYY(r.updated_at)}
                      </td>
                      <td className="p-3 border">
                        <div className="flex gap-2">
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={() => onEdit(r)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            onClick={() => onDelete(r.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!currentPageCustomers.length && (
                  <tr>
                    <td className="p-4 text-center" colSpan={12}>
                      No {showInactive ? "inactive" : "active"} customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredCustomers.length > pageSize && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="text-sm font-medium">
              Page <span className="font-bold">{page}</span> of{" "}
              <span className="font-bold">{totalPages}</span>
            </span>
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Statement Modal (transactions + CSV/PDF) */}
      {showStatement && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setShowStatement(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-[1200px] max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b bg-white/60 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center shadow-sm">
                    <span className="text-sm font-semibold">
                      {(activeCustomer?.name || "C")
                        .substring(0, 1)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold tracking-tight">
                        {activeCustomer?.name}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Customer Statement
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Range: {stFrom} → {stTo} · Sort:{" "}
                      {stSort === "asc" ? "Oldest → Newest" : "Newest → Oldest"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 transition-colors shadow-sm"
                    onClick={exportCSV}
                    title="Download CSV"
                  >
                    CSV
                  </button>
                  {/* <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700 active:from-purple-800 active:to-fuchsia-800 transition-colors shadow-md"
                    onClick={exportPDF}
                    title="Download PDF"
                  >
                    PDF
                  </button> */}
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                    onClick={() => setShowStatement(false)}
                    title="Close"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-b flex gap-3 items-end">
              <div>
                <label className="text-xs text-gray-600">From</label>
                <input
                  type="date"
                  className="border p-2 rounded w-44"
                  value={stFrom}
                  onChange={(e) => setStFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">To</label>
                <input
                  type="date"
                  className="border p-2 rounded w-44"
                  value={stTo}
                  onChange={(e) => setStTo(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Sort</label>
                <select
                  className="border p-2 rounded"
                  value={stSort}
                  onChange={(e) => setStSort(e.target.value)}
                >
                  <option value="asc">Oldest → Newest</option>
                  <option value="desc">Newest → Oldest</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Page size</label>
                <select
                  className="border p-2 rounded"
                  value={stLimit}
                  onChange={(e) => setStLimit(Number(e.target.value))}
                >
                  <option>25</option>
                  <option>50</option>
                  <option>100</option>
                </select>
              </div>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white"
                disabled={statementLoading || !activeCustomer}
                onClick={() => {
                  setStPage(1);
                  if (activeCustomer)
                    fetchStatement(
                      activeCustomer.id,
                      stFrom,
                      stTo,
                      1,
                      stLimit,
                      stSort
                    );
                }}
              >
                Apply
              </button>
            </div>

            <div className="px-5 py-3 grid grid-cols-6 gap-3 border-b bg-gray-50">
              <div className="p-3 rounded bg-white shadow-sm">
                <div className="text-xs text-gray-500">Opening Balance</div>
                <div className="font-semibold">
                  {inr(statementTotals?.opening_balance || 0)}
                </div>
              </div>
              <div className="p-3 rounded bg-white shadow-sm">
                <div className="text-xs text-gray-500">Total Invoiced</div>
                <div className="font-semibold">
                  {inr(statementTotals?.total_invoiced || 0)}
                </div>
              </div>
              <div className="p-3 rounded bg-white shadow-sm">
                <div className="text-xs text-gray-500">Total Taxable</div>
                <div className="font-semibold">
                  {inr(statementTotals?.total_taxable || 0)}
                </div>
              </div>
              <div className="p-3 rounded bg-white shadow-sm">
                <div className="text-xs text-gray-500">Total GST</div>
                <div className="font-semibold">
                  {inr(statementTotals?.total_gst || 0)}
                </div>
              </div>
              <div className="p-3 rounded bg-white shadow-sm">
                <div className="text-xs text-gray-500">Total Paid</div>
                <div className="font-semibold">
                  {inr(statementTotals?.total_paid || 0)}
                </div>
              </div>
              <div className="p-3 rounded bg-white shadow-sm">
                <div className="text-xs text-gray-500">
                  Outstanding (as of To)
                </div>
                <div className="font-semibold">
                  {inr(
                    statementTotals?.outstanding_as_of ||
                      statementTotals?.outstanding_as_of_to ||
                      0
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 overflow-auto max-h-[50vh]">
              {statementLoading ? (
                <div>Loading...</div>
              ) : (
                <table className="min-w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border">Date/Time</th>
                      <th className="p-2 border">Type</th>
                      <th className="p-2 border">Ref No</th>
                      <th className="p-2 border">Amount</th>
                      <th className="p-2 border">Taxable</th>
                      <th className="p-2 border">GST</th>
                      <th className="p-2 border">Net Effect</th>
                      <th className="p-2 border">Remaining Balance</th>
                      <th className="p-2 border">Method</th>
                      <th className="p-2 border">Remarks</th>
                      <th className="p-2 border">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementRows.map((r, i) => (
                      <tr key={`${r.ref_no}-${i}`} className="hover:bg-gray-50">
                        <td className="p-2 border">{r.tx_datetime}</td>
                        <td className="p-2 border">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              r.tx_type === "INVOICE"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {r.tx_type}
                          </span>
                        </td>
                        <td className="p-2 border">{r.ref_no}</td>
                        <td className="p-2 border">{inr(r.amount)}</td>
                        <td className="p-2 border">
                          {inr(r.total_taxable || 0)}
                        </td>
                        <td className="p-2 border">{inr(r.total_gst || 0)}</td>
                        <td className="p-2 border">{inr(r.net_effect)}</td>
                        <td className="p-2 border">{inr(r.running_balance)}</td>
                        <td className="p-2 border">
                          {r.payment_method || "-"}
                        </td>
                        <td className="p-2 border">{r.note || "-"}</td>
                        <td className="p-2 border">
                          {r.tx_type === "INVOICE" && r.sale_id && (
                            <button
                              onClick={() => setShowSaleDetails(r.sale_id)}
                              className="px-2 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                              title="View sale details"
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!statementRows.length && (
                      <tr>
                        <td className="p-4 text-center" colSpan={11}>
                          No transactions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-5 py-3 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">Page {stPage}</div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                  disabled={stPage <= 1 || statementLoading}
                  onClick={() => {
                    const p = Math.max(1, stPage - 1);
                    setStPage(p);
                    if (activeCustomer)
                      fetchStatement(
                        activeCustomer.id,
                        stFrom,
                        stTo,
                        p,
                        stLimit,
                        stSort
                      );
                  }}
                >
                  Prev
                </button>
                <button
                  className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                  disabled={statementRows.length < stLimit || statementLoading}
                  onClick={() => {
                    const p = stPage + 1;
                    setStPage(p);
                    if (activeCustomer)
                      fetchStatement(
                        activeCustomer.id,
                        stFrom,
                        stTo,
                        p,
                        stLimit,
                        stSort
                      );
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      {showSaleDetails && (
        <SaleDetailsModal
          saleId={showSaleDetails}
          onClose={() => setShowSaleDetails(null)}
        />
      )}
    </div>
  );
}
