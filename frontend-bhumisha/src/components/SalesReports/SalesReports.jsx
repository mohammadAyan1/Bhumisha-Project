// import React, { useEffect, useMemo, useState } from "react";
// import companyAPI from "../../axios/companyAPI.js";
// import getAllSalesBill from "../../axios/getAllSalesBill.js";

// const SalesReports = () => {
//   const [totalCompanies, setTotalCompanies] = useState([]);
//   const [salesBills, setSalesBills] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Filters
//   const [search, setSearch] = useState("");
//   const [partyType, setPartyType] = useState("");
//   const [buyerType, setBuyerType] = useState("");
//   const [companyFilter, setCompanyFilter] = useState("");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");
//   const [modalData, setModalData] = useState(null);

//   // Sorting
//   const [sortBy, setSortBy] = useState("bill_date");
//   const [sortDir, setSortDir] = useState("desc");

//   // Function to get current month's start and end dates
//   const getCurrentMonthDates = () => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = now.getMonth();

//     // First day of the month
//     const firstDay = new Date(year, month, 1);
//     // Last day of the month
//     const lastDay = new Date(year, month + 1, 0);

//     // Format to YYYY-MM-DD for input[type="date"]
//     const formatDate = (date) => {
//       const d = new Date(date);
//       const year = d.getFullYear();
//       const month = String(d.getMonth() + 1).padStart(2, "0");
//       const day = String(d.getDate()).padStart(2, "0");
//       return `${year}-${month}-${day}`;
//     };

//     return {
//       from: formatDate(firstDay),
//       to: formatDate(lastDay),
//     };
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const companyRes = await companyAPI.getAll();
//         setTotalCompanies(companyRes.data || []);
//       } catch (err) {
//         console.error("Error fetching companies for sales", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   // Initialize date filters with current month on component mount
//   useEffect(() => {
//     const { from, to } = getCurrentMonthDates();
//     setDateFrom(from);
//     setDateTo(to);
//   }, []);

//   useEffect(() => {
//     if (Array.isArray(totalCompanies) && totalCompanies.length > 0) {
//       const fetch = async () => {
//         try {
//           setLoading(true);
//           const res = await getAllSalesBill.getAll(totalCompanies);

//           const flattened = (res.data || [])
//             .filter((company) => company && company.companyCode)
//             .flatMap((company) => {
//               const entries = Array.isArray(company.data)
//                 ? company.data
//                 : Array.isArray(company.sales)
//                 ? company.sales
//                 : Array.isArray(company.orders)
//                 ? company.orders
//                 : [];

//               return entries.map((entry) => {
//                 const rawItems = Array.isArray(entry?.items)
//                   ? entry.items
//                   : Array.isArray(entry?.sale_items)
//                   ? entry.sale_items
//                   : [entry];

//                 const itemsArr = rawItems.map((p) => ({
//                   ...p,
//                   category_name:
//                     p?.category_name ||
//                     p?.categoryDetails?.name ||
//                     entry?.category_name ||
//                     "",
//                   hsn_code: p?.hsn_code || p?.hsn || p?.hsnCode || "",
//                   size: p?.qty || p?.measurement || p?.unit || "",
//                   purchase_rate:
//                     (p?.rate ?? p?.cost_price ?? Number(p?.cost_price)) || 0,
//                   qty: p?.qty ?? p?.quantity ?? 0,
//                   unit: p?.unit || p?.product_unit || "",
//                   discount_amount: Number(p?.discount_amount || 0),
//                   gst_amount: Number(p?.gst_amount || 0),
//                   taxable_amount: Number(p?.taxable_amount || 0),
//                   net_total: Number(p?.net_total || 0),
//                 }));

//                 // Calculate totals from items
//                 const totalDiscount = itemsArr.reduce(
//                   (sum, item) => sum + Number(item.discount_amount || 0),
//                   0
//                 );
//                 const totalGST = itemsArr.reduce(
//                   (sum, item) => sum + Number(item.gst_amount || 0),
//                   0
//                 );
//                 const totalTaxable = itemsArr.reduce(
//                   (sum, item) => sum + Number(item.taxable_amount || 0),
//                   0
//                 );
//                 const itemsTotal = itemsArr.reduce(
//                   (sum, item) => sum + Number(item.net_total || 0),
//                   0
//                 );

//                 const customerName =
//                   entry?.customer_name ||
//                   entry?.customerDetails?.name ||
//                   itemsArr[0]?.customer_name ||
//                   "";
//                 const vendorName =
//                   entry?.vendor_name ||
//                   entry?.vendorDetails?.name ||
//                   itemsArr[0]?.vendor_name ||
//                   "";
//                 const farmerName =
//                   entry?.farmer_name ||
//                   entry?.farmerDetails?.name ||
//                   itemsArr[0]?.farmer_name ||
//                   "";

//                 return {
//                   companyCode: company.companyCode || "N/A",
//                   sale_id: entry?.sale_id ?? entry?.id ?? entry?.saleId ?? "-",
//                   bill_no:
//                     entry?.bill_no ??
//                     entry?.billNo ??
//                     itemsArr[0]?.bill_no ??
//                     itemsArr[0]?.billNo ??
//                     "-",
//                   items: itemsArr,
//                   total_amount:
//                     Number(entry?.total_amount ?? entry?.total ?? itemsTotal) ||
//                     0,
//                   total_discount: totalDiscount,
//                   total_gst: totalGST,
//                   total_taxable: totalTaxable,
//                   other_amount: Number(entry?.items[0]?.other_amount || 0),
//                   other_note: entry?.other_note || "",
//                   customer_name: customerName,
//                   vendor_name: vendorName,
//                   farmer_name: farmerName,
//                   party_type:
//                     entry?.party_type ||
//                     entry?.partyType ||
//                     (itemsArr[0]?.party_type ?? itemsArr[0]?.partyType) ||
//                     "unknown",
//                   buyer_type:
//                     entry?.buyer_type || itemsArr[0]?.buyer_type || "unknown",
//                   bill_date:
//                     entry?.bill_date ??
//                     entry?.created_at ??
//                     itemsArr[0]?.bill_date ??
//                     null,
//                   category_name:
//                     entry?.category_name || itemsArr[0]?.category_name || "",
//                   _raw: entry,
//                 };
//               });
//             });

//           // group by companyCode + sale_id
//           const grouped = new Map();
//           for (const e of flattened) {
//             const key = `${e.companyCode}::${e.sale_id}`;
//             if (!grouped.has(key)) grouped.set(key, { ...e });
//             else {
//               const existing = grouped.get(key);
//               existing.items = (existing.items || []).concat(e.items || []);
//               // Recalculate totals after merging items
//               const totalDiscount = existing.items.reduce(
//                 (sum, item) => sum + Number(item.discount_amount || 0),
//                 0
//               );
//               const totalGST = existing.items.reduce(
//                 (sum, item) => sum + Number(item.gst_amount || 0),
//                 0
//               );
//               const totalTaxable = existing.items.reduce(
//                 (sum, item) => sum + Number(item.taxable_amount || 0),
//                 0
//               );
//               const itemsTotal = existing.items.reduce(
//                 (sum, item) => sum + Number(item.net_total || 0),
//                 0
//               );

//               existing.total_amount = itemsTotal;
//               existing.total_discount = totalDiscount;
//               existing.total_gst = totalGST;
//               existing.total_taxable = totalTaxable;
//               existing.customer_name =
//                 existing.customer_name || e.customer_name;
//               existing.vendor_name = existing.vendor_name || e.vendor_name;
//               existing.farmer_name = existing.farmer_name || e.farmer_name;
//               existing.party_type = existing.party_type || e.party_type;
//               existing.buyer_type = existing.buyer_type || e.buyer_type;
//             }
//           }

//           const combined = Array.from(grouped.values()).map((g) => ({
//             ...g,
//             total_amount: Number(g.total_amount) || 0,
//             total_discount: Number(g.total_discount) || 0,
//             total_gst: Number(g.total_gst) || 0,
//             other_amount: Number(g.other_amount) || 0,
//             items: Array.isArray(g.items) ? g.items : [],
//           }));

//           setSalesBills(combined);
//         } catch (err) {
//           console.error("Error fetching sales bills", err);
//         } finally {
//           setLoading(false);
//         }
//       };

//       fetch();
//     }
//   }, [totalCompanies]);

//   // Filtering
//   const filtered = useMemo(() => {
//     const toISODate = (d) => {
//       if (!d) return null;
//       const date = new Date(d);
//       date.setUTCHours(0, 0, 0, 0);
//       return date;
//     };

//     let arr = salesBills || [];

//     if (companyFilter) {
//       arr = arr.filter((b) => b.companyCode === companyFilter);
//     }

//     if (partyType) {
//       arr = arr.filter(
//         (b) =>
//           (b.party_type || "").toString().toLowerCase() ===
//           partyType.toLowerCase()
//       );
//     }

//     if (buyerType) {
//       arr = arr.filter(
//         (b) =>
//           (b.buyer_type || "").toString().toLowerCase() ===
//           buyerType.toLowerCase()
//       );
//     }

//     if (dateFrom) {
//       const from = toISODate(dateFrom);
//       arr = arr.filter((b) => {
//         const d = toISODate(b.bill_date);
//         return d && from && d >= from;
//       });
//     }

//     if (dateTo) {
//       const to = toISODate(dateTo);
//       if (to) to.setUTCHours(23, 59, 59, 999);
//       arr = arr.filter((b) => {
//         const d = toISODate(b.bill_date);
//         return d && to && d <= to;
//       });
//     }

//     if (search && search.trim()) {
//       const q = search.trim().toLowerCase();
//       arr = arr.filter((b) => {
//         const itemMatches = (b.items || []).some(
//           (it) =>
//             String(it?.product_name || "")
//               .toLowerCase()
//               .includes(q) ||
//             String(it?.hsn_code || "")
//               .toLowerCase()
//               .includes(q) ||
//             String(it?.category_name || "")
//               .toLowerCase()
//               .includes(q)
//         );
//         return (
//           itemMatches ||
//           String(b.customer_name || "")
//             .toLowerCase()
//             .includes(q) ||
//           String(b.vendor_name || "")
//             .toLowerCase()
//             .includes(q) ||
//           String(b.farmer_name || "")
//             .toLowerCase()
//             .includes(q) ||
//           String(b.bill_no || "")
//             .toLowerCase()
//             .includes(q) ||
//           String(b.sale_id || "")
//             .toLowerCase()
//             .includes(q)
//         );
//       });
//     }

//     return arr;
//   }, [
//     salesBills,
//     companyFilter,
//     partyType,
//     buyerType,
//     dateFrom,
//     dateTo,
//     search,
//   ]);

//   // Calculate totals for all filtered bills
//   const totals = useMemo(() => {
//     return filtered.reduce(
//       (acc, bill) => {
//         acc.totalAmount += bill.total_amount;
//         acc.totalDiscount += bill.total_discount;
//         acc.totalGST += bill.total_gst;
//         acc.totalOther += bill.other_amount;
//         return acc;
//       },
//       { totalAmount: 0, totalDiscount: 0, totalGST: 0, totalOther: 0 }
//     );
//   }, [filtered]);

//   // Sorting function
//   const toggleSort = (key) => {
//     if (sortBy === key) {
//       setSortDir((d) => (d === "asc" ? "desc" : "asc"));
//     } else {
//       setSortBy(key);
//       setSortDir("asc");
//     }
//   };

//   // Apply sorting
//   const displayed = useMemo(() => {
//     const arr = Array.isArray(filtered) ? [...filtered] : [];

//     if (!sortBy) return arr;

//     arr.sort((a, b) => {
//       let aVal, bVal;

//       switch (sortBy) {
//         case "bill_date":
//           aVal = a.bill_date ? new Date(a.bill_date).getTime() : 0;
//           bVal = b.bill_date ? new Date(b.bill_date).getTime() : 0;
//           break;
//         case "bill_no":
//           aVal = String(a.bill_no || "").toLowerCase();
//           bVal = String(b.bill_no || "").toLowerCase();
//           break;
//         case "total":
//           aVal = Number(a.total_amount || 0);
//           bVal = Number(b.total_amount || 0);
//           break;
//         default:
//           aVal = "";
//           bVal = "";
//       }

//       if (typeof aVal === "number" && typeof bVal === "number") {
//         return sortDir === "asc" ? aVal - bVal : bVal - aVal;
//       }

//       if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
//       if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
//       return 0;
//     });

//     return arr;
//   }, [filtered, sortBy, sortDir]);

//   const handleExpand = (bill) => {
//     setModalData(bill);
//   };

//   const handleCloseModal = () => setModalData(null);

//   const clearFilters = () => {
//     setSearch("");
//     setPartyType("");
//     setBuyerType("");
//     setCompanyFilter("");
//     // Reset dates to current month instead of clearing
//     const { from, to } = getCurrentMonthDates();
//     setDateFrom(from);
//     setDateTo(to);
//     setSortBy("bill_date");
//     setSortDir("desc");
//   };

//   // Function to set date to current month
//   const setCurrentMonthDates = () => {
//     const { from, to } = getCurrentMonthDates();
//     setDateFrom(from);
//     setDateTo(to);
//   };

//   // Function to set date to previous month
//   const setPreviousMonthDates = () => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = now.getMonth() - 1;

//     // Handle January edge case
//     const adjustedMonth = month < 0 ? 11 : month;
//     const adjustedYear = month < 0 ? year - 1 : year;

//     const firstDay = new Date(adjustedYear, adjustedMonth, 1);
//     const lastDay = new Date(adjustedYear, adjustedMonth + 1, 0);

//     const formatDate = (date) => {
//       const d = new Date(date);
//       const year = d.getFullYear();
//       const month = String(d.getMonth() + 1).padStart(2, "0");
//       const day = String(d.getDate()).padStart(2, "0");
//       return `${year}-${month}-${day}`;
//     };

//     setDateFrom(formatDate(firstDay));
//     setDateTo(formatDate(lastDay));
//   };

//   // Function to set date to today only
//   const setTodayDate = () => {
//     const today = new Date();
//     const year = today.getFullYear();
//     const month = String(today.getMonth() + 1).padStart(2, "0");
//     const day = String(today.getDate()).padStart(2, "0");
//     const todayStr = `${year}-${month}-${day}`;

//     setDateFrom(todayStr);
//     setDateTo(todayStr);
//   };

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <h1 className="text-2xl font-bold mb-6 text-gray-800">Sales Invoices</h1>

//       {loading ? (
//         <div className="text-center text-gray-600 py-8">Loading...</div>
//       ) : salesBills.length === 0 ? (
//         <div className="text-center text-gray-600 py-8">
//           No sales bills found
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {/* Filters Section */}
//           <div className="bg-white p-4 rounded-lg shadow">
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
//               <div>
//                 <label className="block text-xs font-semibold text-gray-600 mb-2">
//                   Company
//                 </label>
//                 <select
//                   value={companyFilter}
//                   onChange={(e) => setCompanyFilter(e.target.value)}
//                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">All Companies</option>
//                   {totalCompanies.map((c) => (
//                     <option
//                       key={c.companyCode || c.code || c.id}
//                       value={c.companyCode || c.code || c.id}
//                     >
//                       {c.name || c.companyCode || c.code}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold text-gray-600 mb-2">
//                   Party Type
//                 </label>
//                 <select
//                   value={partyType}
//                   onChange={(e) => setPartyType(e.target.value)}
//                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">All Party Types</option>
//                   <option value="customer">Customer</option>
//                   <option value="vendor">Vendor</option>
//                   <option value="farmer">Farmer</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold text-gray-600 mb-2">
//                   Buyer Type
//                 </label>
//                 <select
//                   value={buyerType}
//                   onChange={(e) => setBuyerType(e.target.value)}
//                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">All Buyer Types</option>
//                   <option value="retailer">Retailer</option>
//                   <option value="wholesaler">Wholesaler</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold text-gray-600 mb-2">
//                   From Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateFrom}
//                   onChange={(e) => setDateFrom(e.target.value)}
//                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold text-gray-600 mb-2">
//                   To Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateTo}
//                   onChange={(e) => setDateTo(e.target.value)}
//                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div className="flex items-end">
//                 <button
//                   onClick={clearFilters}
//                   className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-medium text-sm transition"
//                 >
//                   Clear Filters
//                 </button>
//               </div>
//             </div>

//             {/* Quick Date Buttons */}
//             <div className="flex flex-wrap gap-2 mb-4">
//               <button
//                 onClick={setTodayDate}
//                 className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition"
//               >
//                 Today
//               </button>
//               <button
//                 onClick={setCurrentMonthDates}
//                 className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium transition"
//               >
//                 Current Month
//               </button>
//               <button
//                 onClick={setPreviousMonthDates}
//                 className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs font-medium transition"
//               >
//                 Previous Month
//               </button>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-3">
//               <input
//                 type="text"
//                 placeholder="Search by bill no, customer, vendor, farmer, product, HSN, category..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>

//           {/* Table Section */}
//           <div className="bg-white rounded-lg shadow overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead className="bg-gray-100 border-b border-gray-300">
//                   <tr>
//                     <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
//                       Company Code
//                     </th>
//                     <th
//                       onClick={() => toggleSort("bill_no")}
//                       className="px-4 py-3 text-left whitespace-nowrap font-semibold cursor-pointer select-none hover:bg-gray-200"
//                     >
//                       Bill No{" "}
//                       {sortBy === "bill_no" && (
//                         <span>{sortDir === "asc" ? "▲" : "▼"}</span>
//                       )}
//                     </th>
//                     <th
//                       onClick={() => toggleSort("bill_date")}
//                       className="px-4 py-3 text-left whitespace-nowrap font-semibold cursor-pointer select-none hover:bg-gray-200"
//                     >
//                       Bill Date{" "}
//                       {sortBy === "bill_date" && (
//                         <span>{sortDir === "asc" ? "▲" : "▼"}</span>
//                       )}
//                     </th>
//                     <th className="px-4 py-3 text-left font-semibold">
//                       Party Type
//                     </th>
//                     <th className="px-4 py-3 text-left font-semibold">
//                       Buyer Type
//                     </th>
//                     <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
//                       Customer/Vendor/Farmer
//                     </th>
//                     <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                       Discount
//                     </th>
//                     <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                       GST
//                     </th>
//                     <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                       Paid Amount
//                     </th>
//                     <th
//                       onClick={() => toggleSort("total")}
//                       className="px-4 py-3 text-right whitespace-nowrap font-semibold cursor-pointer select-none hover:bg-gray-200"
//                     >
//                       Balanced{" "}
//                       {sortBy === "total" && (
//                         <span>{sortDir === "asc" ? "▲" : "▼"}</span>
//                       )}
//                     </th>
//                     <th className="px-4 py-3 text-center font-semibold">
//                       Action
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {displayed.length === 0 ? (
//                     <tr>
//                       <td
//                         colSpan={10}
//                         className="px-4 py-8 text-center text-gray-500"
//                       >
//                         No sales match the current filters
//                       </td>
//                     </tr>
//                   ) : (
//                     displayed.map((bill, index) => {
//                       const rowTotal = bill.total_amount || 0;
//                       const hasMultiple = bill.items?.length > 1;
//                       const partyName =
//                         bill.customer_name ||
//                         bill.vendor_name ||
//                         bill.farmer_name ||
//                         "-";

//                       return (
//                         <tr
//                           key={`${bill.companyCode}::${bill.sale_id}::${index}`}
//                           className="hover:bg-blue-50 transition duration-150"
//                         >
//                           <td className="px-4 py-3 text-gray-700">
//                             {bill.companyCode}
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
//                             {bill.bill_no}
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap text-gray-700">
//                             {bill.bill_date
//                               ? new Date(bill.bill_date).toLocaleDateString()
//                               : "-"}
//                           </td>
//                           <td className="px-4 py-3 text-gray-700">
//                             <span className="capitalize inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium">
//                               {bill.party_type || "-"}
//                             </span>
//                           </td>
//                           <td className="px-4 py-3 text-gray-700">
//                             <span className="capitalize inline-block px-2 py-1 bg-blue-100 rounded text-xs font-medium">
//                               {bill.buyer_type || "-"}
//                             </span>
//                           </td>
//                           <td className="px-4 py-3 text-gray-700">
//                             {partyName}
//                           </td>
//                           <td className="px-4 py-3 text-right text-red-600 font-medium">
//                             {bill.total_discount.toFixed(2)}
//                           </td>
//                           <td className="px-4 py-3 text-right text-green-600 font-medium">
//                             {bill.total_gst.toFixed(2)}
//                           </td>
//                           <td className="px-4 py-3 text-right text-green-600 font-medium">
//                             {bill?._raw?.saleDetails?.paid_amount}
//                           </td>
//                           <td className="px-4 py-3 text-right font-bold text-blue-600">
//                             {rowTotal.toFixed(2)}
//                           </td>
//                           <td className="px-4 py-3 text-center">
//                             {hasMultiple ? (
//                               <button
//                                 onClick={() => handleExpand(bill)}
//                                 className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition font-medium"
//                               >
//                                 View All ({bill.items.length})
//                               </button>
//                             ) : (
//                               <button
//                                 onClick={() => handleExpand(bill)}
//                                 className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition font-medium"
//                               >
//                                 View
//                               </button>
//                             )}
//                           </td>
//                         </tr>
//                       );
//                     })
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Summary Section */}
//           <div className="bg-white p-4 rounded-lg shadow">
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//               <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
//                 <p className="text-gray-600 text-sm mb-1">Total Sales Amount</p>
//                 <p className="text-2xl font-bold text-blue-600">
//                   ₹ {totals.totalAmount.toFixed(2)}
//                 </p>
//               </div>
//               <div className="bg-red-50 p-4 rounded-lg border border-red-200">
//                 <p className="text-gray-600 text-sm mb-1">Total Discount</p>
//                 <p className="text-2xl font-bold text-red-600">
//                   ₹ {totals.totalDiscount.toFixed(2)}
//                 </p>
//               </div>
//               <div className="bg-green-50 p-4 rounded-lg border border-green-200">
//                 <p className="text-gray-600 text-sm mb-1">Total GST</p>
//                 <p className="text-2xl font-bold text-green-600">
//                   ₹ {totals.totalGST.toFixed(2)}
//                 </p>
//               </div>
//               <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
//                 <p className="text-gray-600 text-sm mb-1">Transport Charges</p>
//                 <p className="text-2xl font-bold text-yellow-600">
//                   ₹ {totals.totalOther.toFixed(2)}
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Modal */}
//           {modalData && (
//             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
//               <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
//                 <div className="flex justify-between items-center border-b border-gray-300 p-6 sticky top-0 bg-white rounded-t-lg">
//                   <div>
//                     <h2 className="text-xl font-bold text-gray-900">
//                       Sale Details
//                     </h2>
//                     <p className="text-sm text-gray-600 mt-1">
//                       Bill No:{" "}
//                       <span className="font-semibold">{modalData.bill_no}</span>{" "}
//                       | Sale ID:{" "}
//                       <span className="font-semibold">{modalData.sale_id}</span>{" "}
//                       | Party Type:{" "}
//                       <span className="font-semibold capitalize">
//                         {modalData.party_type}
//                       </span>
//                     </p>
//                   </div>
//                   <button
//                     onClick={handleCloseModal}
//                     className="text-gray-400 hover:text-gray-600 font-bold text-2xl transition"
//                   >
//                     ✕
//                   </button>
//                 </div>

//                 <div className="p-6 space-y-6">
//                   {/* Bill Summary */}
//                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
//                     <div>
//                       <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                         Company Code
//                       </p>
//                       <p className="text-lg font-semibold text-gray-800 mt-1">
//                         {modalData.companyCode}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                         Bill Date
//                       </p>
//                       <p className="text-lg font-semibold text-gray-800 mt-1">
//                         {modalData.bill_date
//                           ? new Date(modalData.bill_date).toLocaleDateString(
//                               "en-IN",
//                               {
//                                 weekday: "short",
//                                 year: "numeric",
//                                 month: "short",
//                                 day: "numeric",
//                               }
//                             )
//                           : "-"}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                         Buyer Type
//                       </p>
//                       <p className="text-lg font-semibold text-gray-800 mt-1 capitalize">
//                         {modalData.buyer_type || "-"}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                         Party
//                       </p>
//                       <p className="text-lg font-semibold text-gray-800 mt-1">
//                         {modalData.customer_name ||
//                           modalData.vendor_name ||
//                           modalData.farmer_name ||
//                           "-"}
//                       </p>
//                     </div>
//                   </div>

//                   {/* Items Table */}
//                   <div className="overflow-x-auto border border-gray-300 rounded-lg">
//                     <table className="w-full text-sm">
//                       <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
//                         <tr>
//                           <th className="px-4 py-3 text-left font-semibold">
//                             Product Name
//                           </th>
//                           <th className="px-4 py-3 text-left font-semibold">
//                             Category
//                           </th>
//                           <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
//                             HSN Code
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             Qty
//                           </th>
//                           <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
//                             Unit
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             Rate
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             Disc%
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             Discount
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             GST%
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             GST
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             Total
//                           </th>
//                         </tr>
//                       </thead>

//                       <tbody className="divide-y divide-gray-200">
//                         {modalData.items?.map((item, idx) => {
//                           return (
//                             <tr
//                               key={idx}
//                               className="hover:bg-blue-50 transition"
//                             >
//                               <td className="px-4 py-3 text-gray-800 font-medium">
//                                 {item?.product_name || "-"}
//                               </td>
//                               <td className="px-4 py-3 text-gray-700">
//                                 {item?.category_name || item?.name || "-"}
//                               </td>
//                               <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
//                                 {item?.hsn_code || "-"}
//                               </td>
//                               <td className="px-4 py-3 text-right text-gray-700">
//                                 {item?.qty ?? item?.quantity ?? 0}
//                               </td>
//                               <td className="px-4 py-3 text-gray-700">
//                                 {item?.unit || "-"}
//                               </td>
//                               <td className="px-4 py-3 text-right text-gray-700">
//                                 {item?.purchase_rate ?? item?.rate ?? 0}
//                               </td>
//                               <td className="px-4 py-3 text-right text-gray-700">
//                                 {item?.discount_rate}%
//                               </td>
//                               <td className="px-4 py-3 text-right text-red-600">
//                                 {Number(item?.discount_amount || 0).toFixed(2)}
//                               </td>
//                               <td className="px-4 py-3 text-right text-gray-700">
//                                 {item?.gst_percent}%
//                               </td>
//                               <td className="px-4 py-3 text-right text-green-600">
//                                 {Number(item?.gst_amount || 0).toFixed(2)}
//                               </td>
//                               <td className="px-4 py-3 text-right font-semibold text-blue-600">
//                                 {Number(item?.net_total || 0).toFixed(2)}
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>

//                       <tfoot className="bg-gray-100">
//                         {/* Other Amount Row */}
//                         {modalData.other_amount > 0 && (
//                           <tr className="border-t border-gray-300">
//                             <td
//                               colSpan={10}
//                               className="px-4 py-3 text-right text-gray-800 font-medium"
//                             >
//                               Transport Charges:
//                               {modalData.other_note && (
//                                 <span className="text-xs text-gray-600 ml-2">
//                                   ({modalData.other_note})
//                                 </span>
//                               )}
//                             </td>
//                             <td className="px-4 py-3 text-right font-semibold text-yellow-600">
//                               +{modalData.other_amount.toFixed(2)}
//                             </td>
//                           </tr>
//                         )}

//                         {/* Items Total Row */}
//                         <tr className="border-t border-gray-300 ">
//                           <td
//                             colSpan={10}
//                             className="px-4 py-3 text-right text-gray-800 font-medium"
//                           >
//                             Items Total:
//                           </td>
//                           <td className="px-4 py-3 text-right font-semibold text-blue-600">
//                             {modalData.items
//                               ?.reduce(
//                                 (sum, item) =>
//                                   sum + Number(item?.net_total || 0),
//                                 0
//                               )
//                               .toFixed(2)}
//                           </td>
//                         </tr>

//                         {/* Final Total Row */}
//                         <tr className="bg-gray-200 border-t-2 border-gray-300 font-bold ">
//                           <td
//                             colSpan={10}
//                             className="px-4 py-3 text-right text-gray-800"
//                           >
//                             Grand Total:
//                           </td>
//                           <td className="px-4 py-3 text-right text-lg text-blue-600">
//                             {(
//                               Number(modalData.total_amount) +
//                               Number(modalData.other_amount || 0)
//                             ).toFixed(2)}
//                           </td>
//                         </tr>

//                         <tr className="bg-gray-200 border-t-2 border-gray-300 font-bold">
//                           <td
//                             colSpan={10}
//                             className="px-4 py-3 text-right text-gray-800"
//                           >
//                             Paid Amount
//                           </td>
//                           <td className="px-4 py-3 text-right text-lg text-red-600">
//                             {Number(
//                               modalData._raw?.saleDetails?.paid_amount
//                             ).toFixed(2)}
//                           </td>
//                         </tr>

//                         <tr className="bg-gray-200 border-t-2 border-gray-300 font-bold">
//                           <td
//                             colSpan={10}
//                             className="px-4 py-3 text-right text-gray-800"
//                           >
//                             Total Amount
//                           </td>
//                           <td className="px-4 py-3 text-right text-lg text-blue-600">
//                             {(
//                               Number(modalData.total_amount) +
//                               Number(modalData.other_amount || 0)
//                             ).toFixed(2) -
//                               Number(
//                                 modalData._raw?.saleDetails?.paid_amount
//                               ).toFixed(2)}
//                           </td>
//                         </tr>
//                       </tfoot>
//                     </table>
//                   </div>
//                 </div>

//                 <div className="border-t border-gray-300 p-6 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
//                   <button
//                     onClick={handleCloseModal}
//                     className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-medium transition"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default SalesReports;

import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx"; // Import xlsx library
import companyAPI from "../../axios/companyAPI.js";
import getAllSalesBill from "../../axios/getAllSalesBill.js";

const SalesReports = () => {
  const [totalCompanies, setTotalCompanies] = useState([]);
  const [salesBills, setSalesBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false); // Loading state for export

  // Filters
  const [search, setSearch] = useState("");
  const [partyType, setPartyType] = useState("");
  const [buyerType, setBuyerType] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modalData, setModalData] = useState(null);

  // Sorting
  const [sortBy, setSortBy] = useState("bill_date");
  const [sortDir, setSortDir] = useState("desc");

  // Function to get current month's start and end dates
  const getCurrentMonthDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Format to YYYY-MM-DD for input[type="date"]
    const formatDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      from: formatDate(firstDay),
      to: formatDate(lastDay),
    };
  };

  // Function to format date as DD-MM-YYYY
  const formatDateDMY = (date) => {
    if (!date) return "—";

    const d = new Date(date);
    if (isNaN(d)) return "—";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const companyRes = await companyAPI.getAll();
        setTotalCompanies(companyRes.data || []);
      } catch (err) {
        console.error("Error fetching companies for sales", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Initialize date filters with current month on component mount
  useEffect(() => {
    const { from, to } = getCurrentMonthDates();
    setDateFrom(from);
    setDateTo(to);
  }, []);

  useEffect(() => {
    if (Array.isArray(totalCompanies) && totalCompanies.length > 0) {
      const fetch = async () => {
        try {
          setLoading(true);
          const res = await getAllSalesBill.getAll(totalCompanies);

          const flattened = (res.data || [])
            .filter((company) => company && company.companyCode)
            .flatMap((company) => {
              const entries = Array.isArray(company.data)
                ? company.data
                : Array.isArray(company.sales)
                ? company.sales
                : Array.isArray(company.orders)
                ? company.orders
                : [];

              return entries.map((entry) => {
                const rawItems = Array.isArray(entry?.items)
                  ? entry.items
                  : Array.isArray(entry?.sale_items)
                  ? entry.sale_items
                  : [entry];

                const itemsArr = rawItems.map((p) => ({
                  ...p,
                  category_name:
                    p?.category_name ||
                    p?.categoryDetails?.name ||
                    entry?.category_name ||
                    "",
                  hsn_code: p?.hsn_code || p?.hsn || p?.hsnCode || "",
                  size: p?.qty || p?.measurement || p?.unit || "",
                  purchase_rate:
                    (p?.rate ?? p?.cost_price ?? Number(p?.cost_price)) || 0,
                  qty: p?.qty ?? p?.quantity ?? 0,
                  unit: p?.unit || p?.product_unit || "",
                  discount_amount: Number(p?.discount_amount || 0),
                  gst_amount: Number(p?.gst_amount || 0),
                  taxable_amount: Number(p?.taxable_amount || 0),
                  net_total: Number(p?.net_total || 0),
                }));

                // Calculate totals from items
                const totalDiscount = itemsArr.reduce(
                  (sum, item) => sum + Number(item.discount_amount || 0),
                  0
                );
                const totalGST = itemsArr.reduce(
                  (sum, item) => sum + Number(item.gst_amount || 0),
                  0
                );
                const totalTaxable = itemsArr.reduce(
                  (sum, item) => sum + Number(item.taxable_amount || 0),
                  0
                );
                const itemsTotal = itemsArr.reduce(
                  (sum, item) => sum + Number(item.net_total || 0),
                  0
                );

                const customerName =
                  entry?.customer_name ||
                  entry?.customerDetails?.name ||
                  itemsArr[0]?.customer_name ||
                  "";
                const vendorName =
                  entry?.vendor_name ||
                  entry?.vendorDetails?.name ||
                  itemsArr[0]?.vendor_name ||
                  "";
                const farmerName =
                  entry?.farmer_name ||
                  entry?.farmerDetails?.name ||
                  itemsArr[0]?.farmer_name ||
                  "";

                return {
                  companyCode: company.companyCode || "N/A",
                  sale_id: entry?.sale_id ?? entry?.id ?? entry?.saleId ?? "-",
                  bill_no:
                    entry?.bill_no ??
                    entry?.billNo ??
                    itemsArr[0]?.bill_no ??
                    itemsArr[0]?.billNo ??
                    "-",
                  items: itemsArr,
                  total_amount:
                    Number(entry?.total_amount ?? entry?.total ?? itemsTotal) ||
                    0,
                  total_discount: totalDiscount,
                  total_gst: totalGST,
                  total_taxable: totalTaxable,
                  other_amount: Number(entry?.items[0]?.other_amount || 0),
                  other_note: entry?.other_note || "",
                  customer_name: customerName,
                  vendor_name: vendorName,
                  farmer_name: farmerName,
                  party_type:
                    entry?.party_type ||
                    entry?.partyType ||
                    (itemsArr[0]?.party_type ?? itemsArr[0]?.partyType) ||
                    "unknown",
                  buyer_type:
                    entry?.buyer_type || itemsArr[0]?.buyer_type || "unknown",
                  bill_date:
                    entry?.bill_date ??
                    entry?.created_at ??
                    itemsArr[0]?.bill_date ??
                    null,
                  category_name:
                    entry?.category_name || itemsArr[0]?.category_name || "",
                  _raw: entry,
                };
              });
            });

          // group by companyCode + sale_id
          const grouped = new Map();
          for (const e of flattened) {
            const key = `${e.companyCode}::${e.sale_id}`;
            if (!grouped.has(key)) grouped.set(key, { ...e });
            else {
              const existing = grouped.get(key);
              existing.items = (existing.items || []).concat(e.items || []);
              // Recalculate totals after merging items
              const totalDiscount = existing.items.reduce(
                (sum, item) => sum + Number(item.discount_amount || 0),
                0
              );
              const totalGST = existing.items.reduce(
                (sum, item) => sum + Number(item.gst_amount || 0),
                0
              );
              const totalTaxable = existing.items.reduce(
                (sum, item) => sum + Number(item.taxable_amount || 0),
                0
              );
              const itemsTotal = existing.items.reduce(
                (sum, item) => sum + Number(item.net_total || 0),
                0
              );

              existing.total_amount = itemsTotal;
              existing.total_discount = totalDiscount;
              existing.total_gst = totalGST;
              existing.total_taxable = totalTaxable;
              existing.customer_name =
                existing.customer_name || e.customer_name;
              existing.vendor_name = existing.vendor_name || e.vendor_name;
              existing.farmer_name = existing.farmer_name || e.farmer_name;
              existing.party_type = existing.party_type || e.party_type;
              existing.buyer_type = existing.buyer_type || e.buyer_type;
            }
          }

          const combined = Array.from(grouped.values()).map((g) => ({
            ...g,
            total_amount: Number(g.total_amount) || 0,
            total_discount: Number(g.total_discount) || 0,
            total_gst: Number(g.total_gst) || 0,
            other_amount: Number(g.other_amount) || 0,
            items: Array.isArray(g.items) ? g.items : [],
          }));

          setSalesBills(combined);
        } catch (err) {
          console.error("Error fetching sales bills", err);
        } finally {
          setLoading(false);
        }
      };

      fetch();
    }
  }, [totalCompanies]);

  // Function to export data to Excel
  const exportToExcel = () => {
    try {
      setExportLoading(true);

      // Prepare data for export
      const exportData = displayed.map((bill, index) => {
        const partyName =
          bill.customer_name || bill.vendor_name || bill.farmer_name || "-";
        const paidAmount = bill?._raw?.saleDetails?.paid_amount || 0;
        const balanceAmount = bill.total_amount - paidAmount;

        return {
          "S.No": index + 1,
          "Company Code": bill.companyCode,
          "Bill No": bill.bill_no || "-",
          "Bill Date": bill.bill_date
            ? new Date(bill.bill_date).toLocaleDateString()
            : "-",
          "Party Type": bill.party_type || "-",
          "Buyer Type": bill.buyer_type || "-",
          "Customer/Vendor/Farmer": partyName,
          "Discount Amount": bill.total_discount.toFixed(2),
          "GST Amount": bill.total_gst.toFixed(2),
          "Paid Amount": Number(paidAmount)?.toFixed(2),
          "Balance Amount": balanceAmount.toFixed(2),
          "Total Amount": bill.total_amount.toFixed(2),
          "Transport Charges": bill.other_amount.toFixed(2),
          "Items Count": bill.items?.length || 0,
        };
      });

      // Add summary rows
      const summaryRow1 = {
        "S.No": "",
        "Company Code": "SUMMARY",
        "Bill No": "",
        "Bill Date": "",
        "Party Type": "",
        "Buyer Type": "",
        "Customer/Vendor/Farmer": "",
        "Discount Amount": totals.totalDiscount.toFixed(2),
        "GST Amount": totals.totalGST.toFixed(2),
        "Paid Amount": "",
        "Balance Amount": "",
        "Total Amount": totals.totalAmount.toFixed(2),
        "Transport Charges": totals.totalOther.toFixed(2),
        "Items Count": "",
      };

      const summaryRow2 = {
        "S.No": "",
        "Company Code": "FILTERS APPLIED",
        "Bill No": "",
        "Bill Date": "",
        "Party Type": partyType ? `Party: ${partyType}` : "",
        "Buyer Type": buyerType ? `Buyer: ${buyerType}` : "",
        "Customer/Vendor/Farmer": companyFilter
          ? `Company: ${companyFilter}`
          : "",
        "Discount Amount": search ? `Search: ${search}` : "",
        "GST Amount": `Date: ${formatDateDMY(dateFrom)} to ${formatDateDMY(
          dateTo
        )}`,
        "Paid Amount": "",
        "Balance Amount": "",
        "Total Amount": `Total Records: ${exportData.length}`,
        "Transport Charges": "",
        "Items Count": "",
      };

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet([
        ...exportData,
        {},
        summaryRow1,
        summaryRow2,
      ]);

      // Set column widths
      const wscols = [
        { wch: 5 }, // S.No
        { wch: 15 }, // Company Code
        { wch: 12 }, // Bill No
        { wch: 12 }, // Bill Date
        { wch: 12 }, // Party Type
        { wch: 12 }, // Buyer Type
        { wch: 25 }, // Customer/Vendor/Farmer
        { wch: 15 }, // Discount Amount
        { wch: 15 }, // GST Amount
        { wch: 15 }, // Paid Amount
        { wch: 15 }, // Balance Amount
        { wch: 15 }, // Total Amount
        { wch: 18 }, // Transport Charges
        { wch: 12 }, // Items Count
      ];
      ws["!cols"] = wscols;

      // Style summary rows
      const range = XLSX.utils.decode_range(ws["!ref"]);
      const summaryRow1Index = range.e.r + 2; // Row after data + empty row
      const summaryRow2Index = summaryRow1Index + 1;

      // Add bold formatting to summary rows
      for (let i = range.s.c; i <= range.e.c; i++) {
        const cellAddress1 = XLSX.utils.encode_cell({
          r: summaryRow1Index,
          c: i,
        });
        const cellAddress2 = XLSX.utils.encode_cell({
          r: summaryRow2Index,
          c: i,
        });

        if (!ws[cellAddress1]) ws[cellAddress1] = {};
        if (!ws[cellAddress2]) ws[cellAddress2] = {};

        ws[cellAddress1].s = { font: { bold: true, color: { rgb: "FF0000" } } };
        ws[cellAddress2].s = { font: { bold: true, color: { rgb: "0000FF" } } };
      }

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales Reports");

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const fileName = `Sales_Reports_${timestamp}.xlsx`;

      // Write to file and trigger download
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  // Filtering
  const filtered = useMemo(() => {
    const toISODate = (d) => {
      if (!d) return null;
      const date = new Date(d);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    };

    let arr = salesBills || [];

    if (companyFilter) {
      arr = arr.filter((b) => b.companyCode === companyFilter);
    }

    if (partyType) {
      arr = arr.filter(
        (b) =>
          (b.party_type || "").toString().toLowerCase() ===
          partyType.toLowerCase()
      );
    }

    if (buyerType) {
      arr = arr.filter(
        (b) =>
          (b.buyer_type || "").toString().toLowerCase() ===
          buyerType.toLowerCase()
      );
    }

    if (dateFrom) {
      const from = toISODate(dateFrom);
      arr = arr.filter((b) => {
        const d = toISODate(b.bill_date);
        return d && from && d >= from;
      });
    }

    if (dateTo) {
      const to = toISODate(dateTo);
      if (to) to.setUTCHours(23, 59, 59, 999);
      arr = arr.filter((b) => {
        const d = toISODate(b.bill_date);
        return d && to && d <= to;
      });
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter((b) => {
        const itemMatches = (b.items || []).some(
          (it) =>
            String(it?.product_name || "")
              .toLowerCase()
              .includes(q) ||
            String(it?.hsn_code || "")
              .toLowerCase()
              .includes(q) ||
            String(it?.category_name || "")
              .toLowerCase()
              .includes(q)
        );
        return (
          itemMatches ||
          String(b.customer_name || "")
            .toLowerCase()
            .includes(q) ||
          String(b.vendor_name || "")
            .toLowerCase()
            .includes(q) ||
          String(b.farmer_name || "")
            .toLowerCase()
            .includes(q) ||
          String(b.bill_no || "")
            .toLowerCase()
            .includes(q) ||
          String(b.sale_id || "")
            .toLowerCase()
            .includes(q)
        );
      });
    }

    return arr;
  }, [
    salesBills,
    companyFilter,
    partyType,
    buyerType,
    dateFrom,
    dateTo,
    search,
  ]);

  // Calculate totals for all filtered bills
  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, bill) => {
        acc.totalAmount += bill.total_amount;
        acc.totalDiscount += bill.total_discount;
        acc.totalGST += bill.total_gst;
        acc.totalOther += bill.other_amount;
        return acc;
      },
      { totalAmount: 0, totalDiscount: 0, totalGST: 0, totalOther: 0 }
    );
  }, [filtered]);

  // Sorting function
  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // Apply sorting
  const displayed = useMemo(() => {
    const arr = Array.isArray(filtered) ? [...filtered] : [];

    if (!sortBy) return arr;

    arr.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "bill_date":
          aVal = a.bill_date ? new Date(a.bill_date).getTime() : 0;
          bVal = b.bill_date ? new Date(b.bill_date).getTime() : 0;
          break;
        case "bill_no":
          aVal = String(a.bill_no || "").toLowerCase();
          bVal = String(b.bill_no || "").toLowerCase();
          break;
        case "total":
          aVal = Number(a.total_amount || 0);
          bVal = Number(b.total_amount || 0);
          break;
        default:
          aVal = "";
          bVal = "";
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [filtered, sortBy, sortDir]);

  const handleExpand = (bill) => {
    setModalData(bill);
  };

  const handleCloseModal = () => setModalData(null);

  const clearFilters = () => {
    setSearch("");
    setPartyType("");
    setBuyerType("");
    setCompanyFilter("");
    // Reset dates to current month instead of clearing
    const { from, to } = getCurrentMonthDates();
    setDateFrom(from);
    setDateTo(to);
    setSortBy("bill_date");
    setSortDir("desc");
  };

  // Function to set date to current month
  const setCurrentMonthDates = () => {
    const { from, to } = getCurrentMonthDates();
    setDateFrom(from);
    setDateTo(to);
  };

  // Function to set date to previous month
  const setPreviousMonthDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() - 1;

    // Handle January edge case
    const adjustedMonth = month < 0 ? 11 : month;
    const adjustedYear = month < 0 ? year - 1 : year;

    const firstDay = new Date(adjustedYear, adjustedMonth, 1);
    const lastDay = new Date(adjustedYear, adjustedMonth + 1, 0);

    const formatDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setDateFrom(formatDate(firstDay));
    setDateTo(formatDate(lastDay));
  };

  // Function to set date to today only
  const setTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    setDateFrom(todayStr);
    setDateTo(todayStr);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sales Invoices</h1>
        {displayed.length > 0 && (
          <button
            onClick={exportToExcel}
            disabled={exportLoading || displayed.length === 0}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              exportLoading || displayed.length === 0
                ? "bg-gray-400 cursor-not-allowed text-gray-700"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {exportLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                Export to Excel ({displayed.length})
              </>
            )}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-600 py-8">Loading...</div>
      ) : salesBills.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          No sales bills found
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters Section */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Company
                </label>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Companies</option>
                  {totalCompanies.map((c) => (
                    <option
                      key={c.companyCode || c.code || c.id}
                      value={c.companyCode || c.code || c.id}
                    >
                      {c.name || c.companyCode || c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Party Type
                </label>
                <select
                  value={partyType}
                  onChange={(e) => setPartyType(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Party Types</option>
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                  <option value="farmer">Farmer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Buyer Type
                </label>
                <select
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Buyer Types</option>
                  <option value="retailer">Retailer</option>
                  <option value="wholesaler">Wholesaler</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-medium text-sm transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Quick Date Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={setTodayDate}
                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition"
              >
                Today
              </button>
              <button
                onClick={setCurrentMonthDates}
                className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium transition"
              >
                Current Month
              </button>
              <button
                onClick={setPreviousMonthDates}
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs font-medium transition"
              >
                Previous Month
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by bill no, customer, vendor, farmer, product, HSN, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
                      Company Code
                    </th>
                    <th
                      onClick={() => toggleSort("bill_no")}
                      className="px-4 py-3 text-left whitespace-nowrap font-semibold cursor-pointer select-none hover:bg-gray-200"
                    >
                      Bill No{" "}
                      {sortBy === "bill_no" && (
                        <span>{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </th>
                    <th
                      onClick={() => toggleSort("bill_date")}
                      className="px-4 py-3 text-left whitespace-nowrap font-semibold cursor-pointer select-none hover:bg-gray-200"
                    >
                      Bill Date{" "}
                      {sortBy === "bill_date" && (
                        <span>{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Party Type
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Buyer Type
                    </th>
                    <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
                      Customer/Vendor/Farmer
                    </th>
                    <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                      GST
                    </th>
                    <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                      Paid Amount
                    </th>
                    <th
                      onClick={() => toggleSort("total")}
                      className="px-4 py-3 text-right whitespace-nowrap font-semibold cursor-pointer select-none hover:bg-gray-200"
                    >
                      Balanced{" "}
                      {sortBy === "total" && (
                        <span>{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayed.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No sales match the current filters
                      </td>
                    </tr>
                  ) : (
                    displayed.map((bill, index) => {
                      const rowTotal = bill.total_amount || 0;
                      const hasMultiple = bill.items?.length > 1;
                      const partyName =
                        bill.customer_name ||
                        bill.vendor_name ||
                        bill.farmer_name ||
                        "-";

                      return (
                        <tr
                          key={`${bill.companyCode}::${bill.sale_id}::${index}`}
                          className="hover:bg-blue-50 transition duration-150"
                        >
                          <td className="px-4 py-3 text-gray-700">
                            {bill.companyCode}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                            {bill.bill_no}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                            {bill.bill_date
                              ? new Date(bill.bill_date).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <span className="capitalize inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                              {bill.party_type || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <span className="capitalize inline-block px-2 py-1 bg-blue-100 rounded text-xs font-medium">
                              {bill.buyer_type || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {partyName}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 font-medium">
                            {bill.total_discount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 font-medium">
                            {bill.total_gst.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 font-medium">
                            {bill?._raw?.saleDetails?.paid_amount || "0.00"}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-blue-600">
                            {rowTotal.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {hasMultiple ? (
                              <button
                                onClick={() => handleExpand(bill)}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition font-medium"
                              >
                                View All ({bill.items.length})
                              </button>
                            ) : (
                              <button
                                onClick={() => handleExpand(bill)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition font-medium"
                              >
                                View
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-gray-600 text-sm mb-1">Total Sales Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹ {totals.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-gray-600 text-sm mb-1">Total Discount</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹ {totals.totalDiscount.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-gray-600 text-sm mb-1">Total GST</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹ {totals.totalGST.toFixed(2)}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-gray-600 text-sm mb-1">Transport Charges</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ₹ {totals.totalOther.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Modal */}
          {modalData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-gray-300 p-6 sticky top-0 bg-white rounded-t-lg">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Sale Details
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Bill No:{" "}
                      <span className="font-semibold">{modalData.bill_no}</span>{" "}
                      | Sale ID:{" "}
                      <span className="font-semibold">{modalData.sale_id}</span>{" "}
                      | Party Type:{" "}
                      <span className="font-semibold capitalize">
                        {modalData.party_type}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 font-bold text-2xl transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Bill Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Company Code
                      </p>
                      <p className="text-lg font-semibold text-gray-800 mt-1">
                        {modalData.companyCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Bill Date
                      </p>
                      <p className="text-lg font-semibold text-gray-800 mt-1">
                        {modalData.bill_date
                          ? new Date(modalData.bill_date).toLocaleDateString(
                              "en-IN",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Buyer Type
                      </p>
                      <p className="text-lg font-semibold text-gray-800 mt-1 capitalize">
                        {modalData.buyer_type || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Party
                      </p>
                      <p className="text-lg font-semibold text-gray-800 mt-1">
                        {modalData.customer_name ||
                          modalData.vendor_name ||
                          modalData.farmer_name ||
                          "-"}
                      </p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto border border-gray-300 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">
                            Product Name
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
                            HSN Code
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
                            Unit
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            Rate
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            Disc%
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            Discount
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            GST%
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            GST
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200">
                        {modalData.items?.map((item, idx) => {
                          return (
                            <tr
                              key={idx}
                              className="hover:bg-blue-50 transition"
                            >
                              <td className="px-4 py-3 text-gray-800 font-medium">
                                {item?.product_name || "-"}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {item?.category_name || item?.name || "-"}
                              </td>
                              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                {item?.hsn_code || "-"}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {item?.qty ?? item?.quantity ?? 0}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {item?.unit || "-"}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {item?.purchase_rate ?? item?.rate ?? 0}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {item?.discount_rate || 0}%
                              </td>
                              <td className="px-4 py-3 text-right text-red-600">
                                {Number(item?.discount_amount || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {item?.gst_percent || 0}%
                              </td>
                              <td className="px-4 py-3 text-right text-green-600">
                                {Number(item?.gst_amount || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-blue-600">
                                {Number(item?.net_total || 0).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      <tfoot className="bg-gray-100">
                        {/* Other Amount Row */}
                        {modalData.other_amount > 0 && (
                          <tr className="border-t border-gray-300">
                            <td
                              colSpan={10}
                              className="px-4 py-3 text-right text-gray-800 font-medium"
                            >
                              Transport Charges:
                              {modalData.other_note && (
                                <span className="text-xs text-gray-600 ml-2">
                                  ({modalData.other_note})
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-yellow-600">
                              +{modalData.other_amount.toFixed(2)}
                            </td>
                          </tr>
                        )}

                        {/* Items Total Row */}
                        <tr className="border-t border-gray-300 ">
                          <td
                            colSpan={10}
                            className="px-4 py-3 text-right text-gray-800 font-medium"
                          >
                            Items Total:
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-600">
                            {modalData.items
                              ?.reduce(
                                (sum, item) =>
                                  sum + Number(item?.net_total || 0),
                                0
                              )
                              .toFixed(2)}
                          </td>
                        </tr>

                        {/* Final Total Row */}
                        <tr className="bg-gray-200 border-t-2 border-gray-300 font-bold ">
                          <td
                            colSpan={10}
                            className="px-4 py-3 text-right text-gray-800"
                          >
                            Grand Total:
                          </td>
                          <td className="px-4 py-3 text-right text-lg text-blue-600">
                            {(
                              Number(modalData.total_amount) +
                              Number(modalData.other_amount || 0)
                            ).toFixed(2)}
                          </td>
                        </tr>

                        <tr className="bg-gray-200 border-t-2 border-gray-300 font-bold">
                          <td
                            colSpan={10}
                            className="px-4 py-3 text-right text-gray-800"
                          >
                            Paid Amount
                          </td>
                          <td className="px-4 py-3 text-right text-lg text-red-600">
                            {Number(
                              modalData._raw?.saleDetails?.paid_amount || 0
                            ).toFixed(2)}
                          </td>
                        </tr>

                        <tr className="bg-gray-200 border-t-2 border-gray-300 font-bold">
                          <td
                            colSpan={10}
                            className="px-4 py-3 text-right text-gray-800"
                          >
                            Total Amount
                          </td>
                          <td className="px-4 py-3 text-right text-lg text-blue-600">
                            {(
                              Number(modalData.total_amount) +
                              Number(modalData.other_amount || 0) -
                              Number(
                                modalData._raw?.saleDetails?.paid_amount || 0
                              )
                            ).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="border-t border-gray-300 p-6 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-medium transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesReports;
