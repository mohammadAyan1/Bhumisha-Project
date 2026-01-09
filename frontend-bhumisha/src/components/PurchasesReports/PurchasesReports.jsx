// import React, { useEffect, useMemo, useState } from "react";
// import companyAPI from "../../axios/companyAPI.js";
// import getAllPurchaseBill from "../../axios/getAllPurchasesBill.js";

// const PurchaseBillsTable = () => {
//   // Function to format date as DD-MM-YYYY
//   const formatDateDMY = (date) => {
//     if (!date) return "—";

//     const d = new Date(date);
//     if (isNaN(d)) return "—";

//     const day = String(d.getDate()).padStart(2, "0");
//     const month = String(d.getMonth() + 1).padStart(2, "0");
//     const year = d.getFullYear();

//     return `${day}-${month}-${year}`;
//   };

//   // Function to get current month's start and end dates
//   const getCurrentMonthDates = () => {
//     const today = new Date();
//     const currentYear = today.getFullYear();
//     const currentMonth = today.getMonth();

//     // First day of current month
//     const startDate = new Date(currentYear, currentMonth, 1);
//     // Last day of current month
//     const endDate = new Date(currentYear, currentMonth + 1, 0);

//     // Format as YYYY-MM-DD for input[type="date"]
//     const formatDateForInput = (date) => {
//       const year = date.getFullYear();
//       const month = String(date.getMonth() + 1).padStart(2, "0");
//       const day = String(date.getDate()).padStart(2, "0");
//       return `${year}-${month}-${day}`;
//     };

//     return {
//       start: formatDateForInput(startDate),
//       end: formatDateForInput(endDate),
//     };
//   };

//   const [totalCompanies, setTotalCompanies] = useState([]);
//   const [purchaseBills, setPurchaseBills] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [totalPurchaseGSTAmount, setTotalPurchaseGSTAmount] = useState(0);

//   // Filters - Initialize with current month dates
//   const currentMonth = getCurrentMonthDates();
//   const [search, setSearch] = useState("");
//   const [partyType, setPartyType] = useState(""); // 'vendor' | 'farmer' | ''
//   const [companyFilter, setCompanyFilter] = useState("");
//   const [dateFrom, setDateFrom] = useState(currentMonth.start);
//   const [dateTo, setDateTo] = useState(currentMonth.end);
//   const [modalData, setModalData] = useState(null);
//   // Sorting
//   const [sortBy, setSortBy] = useState(""); // 'bill_no'|'bill_date'|'product'|'size'|'rate'|'total'
//   const [sortDir, setSortDir] = useState("asc");

//   // 1️⃣ Fetch vendor and company data
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const companyRes = await companyAPI.getAll();
//         setTotalCompanies(companyRes.data || []);
//       } catch (error) {
//         console.error("Error fetching vendors/companies:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // 2️⃣ Fetch purchase bills for all companies
//   useEffect(() => {
//     if (Array.isArray(totalCompanies) && totalCompanies.length > 0) {
//       const fetchBills = async () => {
//         try {
//           setLoading(true);
//           const res = await getAllPurchaseBill.getAll(totalCompanies);

//           const companies = res.data || [];

//           const totalPurchasesAmount = companies?.reduce((sum, item) => {
//             const totalForEachCompany = item?.purchases?.reduce(
//               (secondSum, secondItem) => {
//                 const eachPurchaseTotal = secondItem?.items.reduce((n, b) => {
//                   return n + Number(b?.gst_amount);
//                 }, 0);
//                 return secondSum + eachPurchaseTotal;
//               },
//               0
//             );

//             return sum + totalForEachCompany;
//           }, 0);

//           setTotalPurchaseGSTAmount(totalPurchasesAmount);

//           // Flatten & sanitize data
//           // backend returns companies with either `data` or `purchases` array.
//           // accept both shapes for robustness.
//           // 1) Flatten companies -> purchase entries (accept both `data` and `purchases`)
//           const flattened = (res.data || [])
//             .filter((company) => company && company.companyCode)
//             .flatMap((company) => {
//               const entries = Array.isArray(company.data)
//                 ? company.data
//                 : Array.isArray(company.purchases)
//                 ? company.purchases
//                 : [];

//               return entries.map((entry) => {
//                 // Normalize items: either a nested array `items` or single-row entry
//                 const rawItems = Array.isArray(entry) ? entry.items : [entry];

//                 // normalize each item to ensure consistent keys used by UI
//                 const itemsArr = rawItems.map((p) => ({
//                   ...p,
//                   category_name:
//                     p?.category_name ||
//                     p?.categoryDetails?.name ||
//                     entry?.category_name ||
//                     entry?.categoryDetails?.name ||
//                     "",
//                   hsn_code: p?.hsn_code || p?.hsn || "",
//                   size: p?.size || p?.measurement || p?.unit || "",
//                   purchase_rate:
//                     (p?.purchase_rate ?? p?.rate ?? Number(p?.rate)) || 0,
//                   qty: p?.qty ?? p?.quantity ?? p?.qty_sold ?? 0,
//                 }));

//                 const totalAmt = itemsArr.reduce(
//                   (s, p) =>
//                     s + Number(p?.total ?? p?.amount ?? p?.total_amount ?? 0),
//                   0
//                 );

//                 // prefer vendor/farmer names from the entry or from nested item
//                 const vendorName =
//                   entry?.vendor_name ||
//                   entry?.vendorDetails?.name ||
//                   itemsArr[0]?.vendor_name ||
//                   itemsArr[0]?.vendorDetails?.name ||
//                   "";
//                 const farmerName =
//                   entry?.farmer_name ||
//                   entry?.farmerDetails?.name ||
//                   itemsArr[0]?.farmer_name ||
//                   itemsArr[0]?.farmerDetails?.name ||
//                   "";

//                 return {
//                   companyCode: company.companyCode || "N/A",
//                   purchase_id: entry?.purchase_id ?? entry?.id ?? "-",
//                   // prefer explicit bill_no at entry level, otherwise fallback to first item's bill_no
//                   bill_no:
//                     entry?.bill_no ??
//                     entry?.billNo ??
//                     itemsArr[0]?.bill_no ??
//                     itemsArr[0]?.billNo ??
//                     "-",
//                   items: itemsArr,
//                   total_amount:
//                     Number(entry?.total_amount ?? entry?.total ?? totalAmt) ||
//                     0,
//                   vendor_name: vendorName,
//                   farmer_name: farmerName,
//                   party_type:
//                     entry?.party_type ||
//                     entry?.partyType ||
//                     (itemsArr[0]?.party_type ?? itemsArr[0]?.partyType) ||
//                     "unknown",
//                   bill_date:
//                     entry?.bill_date ??
//                     entry?.created_at ??
//                     itemsArr[0]?.bill_date ??
//                     null,
//                   category_name:
//                     entry?.category_name ||
//                     entry?.categoryDetails?.name ||
//                     itemsArr[0]?.category_name ||
//                     "",
//                   _raw: entry,
//                 };
//               });
//             });

//           // 2) Group by companyCode + purchase_id so we produce one row per bill (merge items and totals)
//           const grouped = new Map();
//           for (const e of flattened) {
//             const key = `${e.companyCode}::${e.purchase_id}`;
//             if (!grouped.has(key)) {
//               grouped.set(key, { ...e });
//             } else {
//               const existing = grouped.get(key);
//               existing.items = (existing.items || []).concat(e.items || []);
//               existing.total_amount =
//                 (Number(existing.total_amount) || 0) +
//                 (Number(e.total_amount) || 0);
//               // prefer non-empty vendor/farmer/party values
//               existing.vendor_name = existing.vendor_name || e.vendor_name;
//               existing.farmer_name = existing.farmer_name || e.farmer_name;
//               existing.party_type = existing.party_type || e.party_type;
//               existing.category_name =
//                 existing.category_name || e.category_name;
//             }
//           }

//           const combinedData = Array.from(grouped.values()).map((g) => ({
//             ...g,
//             // ensure numbers
//             total_amount: Number(g.total_amount) || 0,
//             items: Array.isArray(g.items) ? g.items : [],
//           }));

//           setPurchaseBills(combinedData);
//         } catch (error) {
//           console.error("Error fetching purchase bills:", error);
//         } finally {
//           setLoading(false);
//         }
//       };

//       fetchBills();
//     }
//   }, [totalCompanies]);

//   // derived filtered data and totals - FIXED FILTERING
//   const filteredBills = useMemo(() => {
//     const toISODate = (d) => {
//       if (!d) return null;
//       // Parse date and set to start of day UTC
//       const date = new Date(d);
//       date.setUTCHours(0, 0, 0, 0);
//       return date;
//     };

//     let arr = purchaseBills || [];

//     if (companyFilter) {
//       arr = arr.filter((b) => b?.companyCode === companyFilter);
//     }

//     if (partyType) {
//       arr = arr.filter(
//         (b) =>
//           (b?.items[0]?.items[0]?.party_type || "").toString().toLowerCase() ===
//           partyType.toLowerCase()
//       );
//     }

//     if (dateFrom) {
//       const from = toISODate(dateFrom);
//       arr = arr.filter((b) => {
//         const d = toISODate(b?.items[0]?.items[0]?.bill_date);
//         return d && from && d >= from;
//       });
//     }

//     if (dateTo) {
//       const to = toISODate(dateTo);
//       // set to end of day
//       if (to) to.setUTCHours(23, 59, 59, 999);
//       arr = arr.filter((b) => {
//         const d = toISODate(b?.items[0]?.items[0]?.bill_date);
//         return d && to && d <= to;
//       });
//     }

//     if (search && search.trim()) {
//       const q = search.trim().toLowerCase();
//       arr = arr.filter((b) => {
//         // search across all items in the bill, plus bill-level fields
//         const itemMatches = (b.items || []).some(
//           (item) =>
//             String(item?.items[0]?.product_name || "")
//               .toLowerCase()
//               .includes(q) ||
//             String(item?.items[0]?.hsn_code || "")
//               .toLowerCase()
//               .includes(q) ||
//             String(item?.items[0]?.category_name || "")
//               .toLowerCase()
//               .includes(q) ||
//             String(item?.companyCode || "")
//               .toLowerCase()
//               .includes(q)
//         );
//         return (
//           itemMatches ||
//           String(b?.items[0].items[0]?.firm_name || "")
//             .toLowerCase()
//             .includes(q) ||
//           String(b?.items[0]?.items[0]?.farmer_name || "")
//             .toLowerCase()
//             .includes(q) ||
//           String(b?.items[0]?.items[0]?.bill_no || "")
//             .toLowerCase()
//             .includes(q) ||
//           String(b?.items[0]?.items[0]?.purchase_id || "")
//             .toLowerCase()
//             .includes(q)
//         );
//       });
//     }

//     return arr;
//   }, [purchaseBills, companyFilter, partyType, dateFrom, dateTo, search]);

//   const totalAmount = useMemo(() => {
//     return filteredBills.reduce(
//       (s, b) => s + Number(b?.items[0]?.items[0]?.total_amount || 0),
//       0
//     );
//   }, [filteredBills]);

//   // Sorting: compute displayed (sorted) bills from filteredBills
//   const toggleSort = (key) => {
//     if (sortBy === key) {
//       setSortDir((d) => (d === "asc" ? "desc" : "asc"));
//     } else {
//       setSortBy(key);
//       setSortDir("asc");
//     }
//   };

//   const displayedBills = useMemo(() => {
//     const arr = Array.isArray(filteredBills) ? [...filteredBills] : [];
//     if (!sortBy) return arr;

//     const getVal = (bill, key) => {
//       const first = bill.items?.[0] || {};
//       switch (key) {
//         case "bill_no":
//           return String(bill.bill_no || "").toLowerCase();
//         case "bill_date":
//           return bill.bill_date ? new Date(bill.bill_date).getTime() : 0;
//         case "product":
//           return String(first.product_name || "").toLowerCase();
//         case "size":
//           return Number(first.size) || 0;
//         case "rate":
//           return Number(first.purchase_rate ?? first.rate ?? 0) || 0;
//         case "total":
//           return Number(bill.total_amount || 0) || 0;
//         default:
//           return "";
//       }
//     };

//     arr.sort((a, b) => {
//       const va = getVal(a, sortBy);
//       const vb = getVal(b, sortBy);

//       if (typeof va === "number" && typeof vb === "number") {
//         return sortDir === "asc" ? va - vb : vb - va;
//       }

//       if (va < vb) return sortDir === "asc" ? -1 : 1;
//       if (va > vb) return sortDir === "asc" ? 1 : -1;
//       return 0;
//     });

//     return arr;
//   }, [filteredBills, sortBy, sortDir]);

//   const handleExpand = (bill) => {
//     setModalData(bill);
//   };

//   const handleCloseModal = () => {
//     setModalData(null);
//   };

//   // Function to reset dates to current month
//   const resetToCurrentMonth = () => {
//     const currentMonthDates = getCurrentMonthDates();
//     setDateFrom(currentMonthDates.start);
//     setDateTo(currentMonthDates.end);
//   };

//   // 3️⃣ Render
//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <h1 className="text-2xl font-bold mb-6 text-gray-800">
//         Purchase Invoices
//       </h1>

//       {loading ? (
//         <div className="text-center text-gray-600 py-8">Loading...</div>
//       ) : purchaseBills.length === 0 ? (
//         <div className="text-center text-gray-600 py-8">
//           No purchase bills found
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {/* Filters */}
//           <div className="bg-white p-4 rounded-lg shadow">
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
//               <div>
//                 <label className="block text-xs font-semibold text-gray-600 mb-2">
//                   Party Type
//                 </label>
//                 <select
//                   value={partyType}
//                   onChange={(e) => setPartyType(e.target.value)}
//                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">All</option>
//                   <option value="farmer">Farmer</option>
//                   <option value="vendor">Vendor</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-xs font-semibold text-gray-600 mb-2">
//                   Company
//                 </label>
//                 <select
//                   value={companyFilter}
//                   onChange={(e) => setCompanyFilter(e.target.value)}
//                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">All</option>
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
//                   From Date
//                 </label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="date"
//                     value={dateFrom}
//                     onChange={(e) => setDateFrom(e.target.value)}
//                     className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                   <button
//                     onClick={resetToCurrentMonth}
//                     className="px-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs whitespace-nowrap"
//                     title="Reset to current month"
//                   >
//                     Current Month
//                   </button>
//                 </div>
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
//             </div>

//             <div className="flex flex-col sm:flex-row gap-3">
//               <input
//                 type="text"
//                 placeholder="Search by party type, Company Code, bill no..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//               <button
//                 onClick={() => {
//                   setSearch("");
//                   setPartyType("");
//                   setCompanyFilter("");
//                   resetToCurrentMonth();
//                 }}
//                 className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-medium text-sm transition"
//               >
//                 Clear Filters
//               </button>
//             </div>

//             {/* Current Month Indicator */}
//             <div className="mt-3 text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
//               <span className="font-medium">Date Range:</span>{" "}
//               {formatDateDMY(dateFrom)} to {formatDateDMY(dateTo)}
//               <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
//                 Current Month Filter
//               </span>
//             </div>
//           </div>

//           {/* Table */}
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
//                       className="px-4 py-3 text-left whitespace-nowrap font-semibold cursor-pointer select-none"
//                     >
//                       Bill No{" "}
//                       {sortBy === "bill_no"
//                         ? sortDir === "asc"
//                           ? "▲"
//                           : "▼"
//                         : ""}
//                     </th>
//                     <th
//                       onClick={() => toggleSort("bill_date")}
//                       className="px-4 py-3 text-left whitespace-nowrap font-semibold cursor-pointer select-none"
//                     >
//                       Bill Date{" "}
//                       {sortBy === "bill_date"
//                         ? sortDir === "asc"
//                           ? "▲"
//                           : "▼"
//                         : ""}
//                     </th>

//                     <th
//                       onClick={() => toggleSort("total")}
//                       className="px-4 py-3 text-right whitespace-nowrap font-semibold cursor-pointer select-none"
//                     >
//                       Total{" "}
//                       {sortBy === "total"
//                         ? sortDir === "asc"
//                           ? "▲"
//                           : "▼"
//                         : ""}
//                     </th>
//                     <th className="px-4 py-3 text-left font-semibold">
//                       GST Total
//                     </th>
//                     <th className="px-4 py-3 text-left font-semibold">Party</th>
//                     <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
//                       Vendor / Farmer
//                     </th>
//                     <th className="px-4 py-3 text-left font-semibold">
//                       Transport Rate
//                     </th>
//                     <th className="px-4 py-3 text-left font-semibold">
//                       Paid Amount
//                     </th>
//                     <th className="px-4 py-3 text-center font-semibold">
//                       Action
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {filteredBills.length === 0 ? (
//                     <tr>
//                       <td
//                         colSpan={12}
//                         className="px-4 py-8 text-center text-gray-500"
//                       >
//                         No purchase bills match the current filters
//                       </td>
//                     </tr>
//                   ) : (
//                     displayedBills.map((bill, index) => {
//                       // show first product only, with expand button if there are multiple

//                       const filterData = bill?.items?.[0]?.items;

//                       const eachRowTotalPurchaseGst = filterData?.reduce(
//                         (sum, item) => {
//                           return sum + Number(item?.gst_amount);
//                         },
//                         0
//                       );

//                       const hasMultiple = bill.items[0]?.items.length > 0;

//                       return (
//                         <tr
//                           key={`${bill.companyCode}::${bill.purchase_id}::${index}`}
//                           className="hover:bg-blue-50 transition duration-150"
//                         >
//                           <td className="px-4 py-3 text-gray-700">
//                             {bill.companyCode.toUpperCase()}
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
//                             {bill?.items[0].purchaseDetails?.bill_no}
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap text-gray-700">
//                             {bill.items
//                               ? formatDateDMY(
//                                   bill.items[0]?.purchaseDetails?.bill_date
//                                 )
//                               : "-"}
//                           </td>

//                           <td className="px-4 py-3 text-right font-bold text-blue-600">
//                             {(
//                               Number(
//                                 bill.items[0]?.purchaseDetails?.total_amount
//                               ) || 0
//                             ).toFixed(2)}
//                           </td>
//                           <td
//                             className="
//                           px-4 py-3 text-right font-bold text-blue-600
//                           "
//                           >
//                             {eachRowTotalPurchaseGst.toFixed(2)}
//                           </td>
//                           <td className="px-4 py-3 text-gray-700">
//                             <span className="capitalize inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium">
//                               {bill.items[0]?.purchaseDetails?.party_type ||
//                                 "-"}
//                             </span>
//                           </td>
//                           <td className="px-4 py-3 text-gray-700">
//                             {bill.items[0]?.purchaseDetails?.firm_name ||
//                               bill?.farmer_name ||
//                               "-"}
//                           </td>
//                           <td className="px-4 py-3 text-gray-700">
//                             <div className="max-w-xs truncate">
//                               {Number(
//                                 bill.items[0]?.purchaseDetails?.transport
//                               ).toFixed(2) || "-"}
//                             </div>
//                           </td>
//                           <td className="px-4 py-3 text-gray-700">
//                             <div className="max-w-xs truncate">
//                               {Number(
//                                 bill.items[0]?.purchaseDetails?.paid_amount
//                               ).toFixed(2) || "-"}
//                             </div>
//                           </td>
//                           <td className="px-4 py-3 text-center">
//                             {hasMultiple ? (
//                               <button
//                                 onClick={() => handleExpand(bill)}
//                                 className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition font-medium"
//                               >
//                                 View All (
//                                 {bill?.items?.reduce(
//                                   (total, group) =>
//                                     total + (group.items?.length || 0),
//                                   0
//                                 ) ?? 0}
//                                 )
//                               </button>
//                             ) : (
//                               <span className="text-gray-300 text-xs">-</span>
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

//           {/* Total Summary */}
//           <div className="bg-white p-4 rounded-lg shadow flex justify-between">
//             <div className="text-right">
//               <p className="text-gray-600 text-sm mb-1">
//                 Total Purchase Amount:
//               </p>
//               <p className="text-2xl font-bold text-blue-600">
//                 ₹ {totalAmount.toFixed(2)}
//               </p>
//             </div>

//             <div className="text-right">
//               <p className="text-gray-600 text-sm mb-1">
//                 Total Purchase GST Amount:
//               </p>
//               <p className="text-2xl font-bold text-red-600">
//                 ₹ {totalPurchaseGSTAmount.toFixed(2)}
//               </p>
//             </div>
//           </div>

//           {/* Modal for expanded bill */}
//           {modalData && (
//             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
//               <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
//                 {/* Modal Header */}
//                 <div className="flex justify-between items-center border-b border-gray-300 p-6 sticky top-0 bg-white rounded-t-lg">
//                   <div>
//                     <h2 className="text-xl font-bold text-gray-900">
//                       Bill Details
//                     </h2>
//                     <p className="text-sm text-gray-600 mt-1">
//                       Bill No:{" "}
//                       <span className="font-semibold">{modalData.bill_no}</span>{" "}
//                       | Purchase ID:{" "}
//                       <span className="font-semibold">
//                         {modalData.purchase_id}
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

//                 {/* Modal Body - Info & Table */}
//                 <div className="p-6 space-y-6">
//                   {/* Bill Information */}
//                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
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
//                         Party Type
//                       </p>
//                       <p className="text-lg font-semibold text-gray-800 mt-1">
//                         <span className="capitalize inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
//                           {modalData.items[0]?.items[0]?.party_type}
//                         </span>
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                         Bill Date
//                       </p>
//                       <p className="text-lg font-semibold text-gray-800 mt-1">
//                         {modalData.items[0]?.items[0]?.bill_date
//                           ? new Date(
//                               modalData.items[0]?.items[0]?.bill_date
//                             ).toLocaleDateString("en-IN", {
//                               weekday: "short",
//                               year: "numeric",
//                               month: "short",
//                               day: "numeric",
//                             })
//                           : "-"}
//                       </p>
//                     </div>
//                     <div className="sm:col-span-2 md:col-span-3">
//                       <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                         Vendor / Farmer Name
//                       </p>
//                       <p className="text-lg font-semibold text-gray-800 mt-1">
//                         {modalData.items[0]?.items[0]?.firm_name ||
//                           modalData.items[0]?.items[0]?.name ||
//                           "-"}
//                       </p>
//                     </div>

//                     <div className="sm:col-span-2 md:col-span-3">
//                       <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                         Paid Amount
//                       </p>
//                       <p className="text-lg font-semibold text-gray-800 mt-1">
//                         {Number(
//                           modalData?.items[0]?.items[0]?.paid_amount
//                         ).toFixed(2) || "-"}
//                       </p>
//                     </div>
//                   </div>

//                   {/* Products Table */}
//                   <div className="overflow-x-auto border border-gray-300 rounded-lg">
//                     <table className="w-full text-sm">
//                       <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
//                         <tr>
//                           <th className="px-4 py-3 text-left font-semibold">
//                             Product Name
//                           </th>

//                           <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
//                             HSN Code
//                           </th>
//                           <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
//                             Size
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             unit
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             Rate
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             Disc Amount
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             Disc Per
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             GSt Per
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             GST Amount
//                           </th>
//                           <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
//                             Total
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-gray-200">
//                         {modalData.items[0]?.items?.map((item, idx) => {
//                           return (
//                             <tr
//                               key={idx}
//                               className="hover:bg-blue-50 transition"
//                             >
//                               <td className="px-4 py-3 text-gray-800 font-medium">
//                                 {item?.product_name || "-"}
//                               </td>
//                               <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
//                                 {item?.hsn_code || "-"}
//                               </td>
//                               <td className="px-4 py-3 text-gray-700">
//                                 {item?.size || "-"}
//                               </td>
//                               <td className="px-4 py-3 text-right text-gray-700">
//                                 {item?.unit || "-"}
//                               </td>
//                               <td className="px-4 py-3 text-right text-gray-700">
//                                 {item?.rate || 0}
//                               </td>
//                               <td className="px-4 py-3 text-right text-gray-700">
//                                 {item?.discount_amount || 0}
//                               </td>{" "}
//                               <td className="px-4 py-3 text-right text-gray-700">
//                                 {item?.discount_percent || 0}
//                               </td>{" "}
//                               <td className="px-4 py-3 text-right text-gray-700">
//                                 {item?.gst_percent || 0}
//                               </td>{" "}
//                               <td className="px-4 py-3 text-right text-gray-700">
//                                 {item?.gst_amount || 0}
//                               </td>
//                               <td className="px-4 py-3 text-right font-semibold text-blue-600">
//                                 {Number(item?.final_amount || 0).toFixed(2)}
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                       <tfoot className="bg-gray-100 border-t-2  border-gray-300 font-bold">
//                         <tr>
//                           <td
//                             colSpan={9}
//                             className="px-4 py-3 text-right text-gray-800"
//                           >
//                             Transport Amount
//                           </td>
//                           <td className="px-4 py-3 text-right text-lg text-blue-600">
//                             {(
//                               Number(modalData?.items[0]?.items[0].transport) ||
//                               0
//                             ).toFixed(2)}
//                           </td>
//                         </tr>
//                         <tr>
//                           <td
//                             colSpan={9}
//                             className="px-4 py-3 text-right text-gray-800"
//                           >
//                             Bill Total:
//                           </td>
//                           <td className="px-4 py-3 text-right text-lg text-blue-600">
//                             {(
//                               Number(
//                                 modalData?.items[0]?.items[0].total_amount
//                               ) || 0
//                             ).toFixed(2)}
//                           </td>
//                         </tr>

//                         <tr>
//                           <td
//                             colSpan={9}
//                             className="px-4 py-3 text-right text-gray-800"
//                           >
//                             Paid Amount:
//                           </td>
//                           <td className="px-4 py-3 text-right text-lg text-red-600">
//                             {(
//                               Number(
//                                 modalData?.items[0]?.purchaseDetails
//                                   ?.paid_amount
//                               ) || 0
//                             ).toFixed(2)}
//                           </td>
//                         </tr>

//                         <tr>
//                           <td
//                             colSpan={9}
//                             className="px-4 py-3 text-right text-gray-800"
//                           >
//                             Total:
//                           </td>
//                           <td className="px-4 py-3 text-right text-lg text-blue-600">
//                             {(
//                               Number(
//                                 modalData?.items[0]?.items[0].total_amount
//                               ) -
//                                 Number(
//                                   modalData.items?.[0]?.categoryDetails
//                                     ?.paid_amount
//                                 ).toFixed(2) || 0
//                             ).toFixed(2)}
//                           </td>
//                         </tr>
//                       </tfoot>
//                     </table>
//                   </div>
//                 </div>

//                 {/* Modal Footer */}
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

// export default PurchaseBillsTable;

import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx"; // Import xlsx library
import companyAPI from "../../axios/companyAPI.js";
import getAllPurchaseBill from "../../axios/getAllPurchasesBill.js";

const PurchaseBillsTable = () => {
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

  // Function to get current month's start and end dates
  const getCurrentMonthDates = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // First day of current month
    const startDate = new Date(currentYear, currentMonth, 1);
    // Last day of current month
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    // Format as YYYY-MM-DD for input[type="date"]
    const formatDateForInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDateForInput(startDate),
      end: formatDateForInput(endDate),
    };
  };

  const [totalCompanies, setTotalCompanies] = useState([]);
  const [purchaseBills, setPurchaseBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPurchaseGSTAmount, setTotalPurchaseGSTAmount] = useState(0);
  const [exportLoading, setExportLoading] = useState(false); // Loading state for export

  // Filters - Initialize with current month dates
  const currentMonth = getCurrentMonthDates();
  const [search, setSearch] = useState("");
  const [partyType, setPartyType] = useState(""); // 'vendor' | 'farmer' | ''
  const [companyFilter, setCompanyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState(currentMonth.start);
  const [dateTo, setDateTo] = useState(currentMonth.end);
  const [modalData, setModalData] = useState(null);
  // Sorting
  const [sortBy, setSortBy] = useState(""); // 'bill_no'|'bill_date'|'product'|'size'|'rate'|'total'
  const [sortDir, setSortDir] = useState("asc");

  // 1️⃣ Fetch vendor and company data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const companyRes = await companyAPI.getAll();
        setTotalCompanies(companyRes.data || []);
      } catch (error) {
        console.error("Error fetching vendors/companies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2️⃣ Fetch purchase bills for all companies
  useEffect(() => {
    if (Array.isArray(totalCompanies) && totalCompanies.length > 0) {
      const fetchBills = async () => {
        try {
          setLoading(true);
          const res = await getAllPurchaseBill.getAll(totalCompanies);

          const companies = res.data || [];

          const totalPurchasesAmount = companies?.reduce((sum, item) => {
            const totalForEachCompany = item?.purchases?.reduce(
              (secondSum, secondItem) => {
                const eachPurchaseTotal = secondItem?.items.reduce((n, b) => {
                  return n + Number(b?.gst_amount);
                }, 0);
                return secondSum + eachPurchaseTotal;
              },
              0
            );

            return sum + totalForEachCompany;
          }, 0);

          setTotalPurchaseGSTAmount(totalPurchasesAmount);

          // Flatten & sanitize data
          const flattened = (res.data || [])
            .filter((company) => company && company.companyCode)
            .flatMap((company) => {
              const entries = Array.isArray(company.data)
                ? company.data
                : Array.isArray(company.purchases)
                ? company.purchases
                : [];

              return entries.map((entry) => {
                const rawItems = Array.isArray(entry) ? entry.items : [entry];

                const itemsArr = rawItems.map((p) => ({
                  ...p,
                  category_name:
                    p?.category_name ||
                    p?.categoryDetails?.name ||
                    entry?.category_name ||
                    entry?.categoryDetails?.name ||
                    "",
                  hsn_code: p?.hsn_code || p?.hsn || "",
                  size: p?.size || p?.measurement || p?.unit || "",
                  purchase_rate:
                    (p?.purchase_rate ?? p?.rate ?? Number(p?.rate)) || 0,
                  qty: p?.qty ?? p?.quantity ?? p?.qty_sold ?? 0,
                }));

                const totalAmt = itemsArr.reduce(
                  (s, p) =>
                    s + Number(p?.total ?? p?.amount ?? p?.total_amount ?? 0),
                  0
                );

                const vendorName =
                  entry?.vendor_name ||
                  entry?.vendorDetails?.name ||
                  itemsArr[0]?.vendor_name ||
                  itemsArr[0]?.vendorDetails?.name ||
                  "";
                const farmerName =
                  entry?.farmer_name ||
                  entry?.farmerDetails?.name ||
                  itemsArr[0]?.farmer_name ||
                  itemsArr[0]?.farmerDetails?.name ||
                  "";

                return {
                  companyCode: company.companyCode || "N/A",
                  purchase_id: entry?.purchase_id ?? entry?.id ?? "-",
                  bill_no:
                    entry?.bill_no ??
                    entry?.billNo ??
                    itemsArr[0]?.bill_no ??
                    itemsArr[0]?.billNo ??
                    "-",
                  items: itemsArr,
                  total_amount:
                    Number(entry?.total_amount ?? entry?.total ?? totalAmt) ||
                    0,
                  vendor_name: vendorName,
                  farmer_name: farmerName,
                  party_type:
                    entry?.party_type ||
                    entry?.partyType ||
                    (itemsArr[0]?.party_type ?? itemsArr[0]?.partyType) ||
                    "unknown",
                  bill_date:
                    entry?.bill_date ??
                    entry?.created_at ??
                    itemsArr[0]?.bill_date ??
                    null,
                  category_name:
                    entry?.category_name ||
                    entry?.categoryDetails?.name ||
                    itemsArr[0]?.category_name ||
                    "",
                  _raw: entry,
                };
              });
            });

          // Group by companyCode + purchase_id
          const grouped = new Map();
          for (const e of flattened) {
            const key = `${e.companyCode}::${e.purchase_id}`;
            if (!grouped.has(key)) {
              grouped.set(key, { ...e });
            } else {
              const existing = grouped.get(key);
              existing.items = (existing.items || []).concat(e.items || []);
              existing.total_amount =
                (Number(existing.total_amount) || 0) +
                (Number(e.total_amount) || 0);
              existing.vendor_name = existing.vendor_name || e.vendor_name;
              existing.farmer_name = existing.farmer_name || e.farmer_name;
              existing.party_type = existing.party_type || e.party_type;
              existing.category_name =
                existing.category_name || e.category_name;
            }
          }

          const combinedData = Array.from(grouped.values()).map((g) => ({
            ...g,
            total_amount: Number(g.total_amount) || 0,
            items: Array.isArray(g.items) ? g.items : [],
          }));

          setPurchaseBills(combinedData);
        } catch (error) {
          console.error("Error fetching purchase bills:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchBills();
    }
  }, [totalCompanies]);

  // Function to export data to Excel
  const exportToExcel = () => {
    try {
      setExportLoading(true);

      // Prepare data for export
      const exportData = displayedBills.map((bill, index) => {
        const filterData = bill?.items?.[0]?.items;
        const gstTotal = filterData?.reduce((sum, item) => {
          return sum + Number(item?.gst_amount || 0);
        }, 0);

        return {
          "S.No": index + 1,
          "Company Code": bill.companyCode.toUpperCase(),
          "Bill No": bill?.items[0]?.purchaseDetails?.bill_no || "-",
          "Bill Date": bill.items
            ? formatDateDMY(bill.items[0]?.purchaseDetails?.bill_date)
            : "-",
          "Total Amount": (
            Number(bill.items[0]?.purchaseDetails?.total_amount) || 0
          ).toFixed(2),
          "GST Total": gstTotal.toFixed(2),
          "Party Type": bill.items[0]?.purchaseDetails?.party_type || "-",
          "Vendor/Farmer":
            bill.items[0]?.purchaseDetails?.firm_name ||
            bill?.farmer_name ||
            "-",
          "Transport Rate": Number(
            bill.items[0]?.purchaseDetails?.transport || 0
          ).toFixed(2),
          "Paid Amount": Number(
            bill.items[0]?.purchaseDetails?.paid_amount || 0
          ).toFixed(2),
          "Items Count":
            bill?.items?.reduce(
              (total, group) => total + (group.items?.length || 0),
              0
            ) || 0,
        };
      });

      // Add summary rows
      const summaryRow1 = {
        "S.No": "",
        "Company Code": "SUMMARY",
        "Bill No": "",
        "Bill Date": "",
        "Total Amount": totalAmount.toFixed(2),
        "GST Total": totalPurchaseGSTAmount.toFixed(2),
        "Party Type": "",
        "Vendor/Farmer": "",
        "Transport Rate": "",
        "Paid Amount": "",
        "Items Count": "",
      };

      const summaryRow2 = {
        "S.No": "",
        "Company Code": "FILTERS APPLIED",
        "Bill No": "",
        "Bill Date": "",
        "Total Amount": `Date Range: ${formatDateDMY(
          dateFrom
        )} to ${formatDateDMY(dateTo)}`,
        "GST Total": partyType ? `Party Type: ${partyType}` : "",
        "Party Type": companyFilter ? `Company: ${companyFilter}` : "",
        "Vendor/Farmer": search ? `Search: ${search}` : "",
        "Transport Rate": "",
        "Paid Amount": "",
        "Items Count": `Total Records: ${exportData.length}`,
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
        { wch: 15 }, // Total Amount
        { wch: 15 }, // GST Total
        { wch: 12 }, // Party Type
        { wch: 25 }, // Vendor/Farmer
        { wch: 15 }, // Transport Rate
        { wch: 15 }, // Paid Amount
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
      XLSX.utils.book_append_sheet(wb, ws, "Purchase Bills");

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const fileName = `Purchase_Bills_${timestamp}.xlsx`;

      // Write to file and trigger download
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  // derived filtered data and totals - FIXED FILTERING
  const filteredBills = useMemo(() => {
    const toISODate = (d) => {
      if (!d) return null;
      const date = new Date(d);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    };

    let arr = purchaseBills || [];

    if (companyFilter) {
      arr = arr.filter((b) => b?.companyCode === companyFilter);
    }

    if (partyType) {
      arr = arr.filter(
        (b) =>
          (b?.items[0]?.items[0]?.party_type || "").toString().toLowerCase() ===
          partyType.toLowerCase()
      );
    }

    if (dateFrom) {
      const from = toISODate(dateFrom);
      arr = arr.filter((b) => {
        const d = toISODate(b?.items[0]?.items[0]?.bill_date);
        return d && from && d >= from;
      });
    }

    if (dateTo) {
      const to = toISODate(dateTo);
      if (to) to.setUTCHours(23, 59, 59, 999);
      arr = arr.filter((b) => {
        const d = toISODate(b?.items[0]?.items[0]?.bill_date);
        return d && to && d <= to;
      });
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter((b) => {
        const itemMatches = (b.items || []).some(
          (item) =>
            String(item?.items[0]?.product_name || "")
              .toLowerCase()
              .includes(q) ||
            String(item?.items[0]?.hsn_code || "")
              .toLowerCase()
              .includes(q) ||
            String(item?.items[0]?.category_name || "")
              .toLowerCase()
              .includes(q) ||
            String(item?.companyCode || "")
              .toLowerCase()
              .includes(q)
        );
        return (
          itemMatches ||
          String(b?.items[0].items[0]?.firm_name || "")
            .toLowerCase()
            .includes(q) ||
          String(b?.items[0]?.items[0]?.farmer_name || "")
            .toLowerCase()
            .includes(q) ||
          String(b?.items[0]?.items[0]?.bill_no || "")
            .toLowerCase()
            .includes(q) ||
          String(b?.items[0]?.items[0]?.purchase_id || "")
            .toLowerCase()
            .includes(q)
        );
      });
    }

    return arr;
  }, [purchaseBills, companyFilter, partyType, dateFrom, dateTo, search]);

  const totalAmount = useMemo(() => {
    return filteredBills.reduce(
      (s, b) => s + Number(b?.items[0]?.items[0]?.total_amount || 0),
      0
    );
  }, [filteredBills]);

  // Sorting: compute displayed (sorted) bills from filteredBills
  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const displayedBills = useMemo(() => {
    const arr = Array.isArray(filteredBills) ? [...filteredBills] : [];
    if (!sortBy) return arr;

    const getVal = (bill, key) => {
      const first = bill.items?.[0] || {};
      switch (key) {
        case "bill_no":
          return String(bill.bill_no || "").toLowerCase();
        case "bill_date":
          return bill.bill_date ? new Date(bill.bill_date).getTime() : 0;
        case "product":
          return String(first.product_name || "").toLowerCase();
        case "size":
          return Number(first.size) || 0;
        case "rate":
          return Number(first.purchase_rate ?? first.rate ?? 0) || 0;
        case "total":
          return Number(bill.total_amount || 0) || 0;
        default:
          return "";
      }
    };

    arr.sort((a, b) => {
      const va = getVal(a, sortBy);
      const vb = getVal(b, sortBy);

      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }

      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [filteredBills, sortBy, sortDir]);

  const handleExpand = (bill) => {
    setModalData(bill);
  };

  const handleCloseModal = () => {
    setModalData(null);
  };

  // Function to reset dates to current month
  const resetToCurrentMonth = () => {
    const currentMonthDates = getCurrentMonthDates();
    setDateFrom(currentMonthDates.start);
    setDateTo(currentMonthDates.end);
  };

  // 3️⃣ Render
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Purchase Invoices</h1>
        {displayedBills.length > 0 && (
          <button
            onClick={exportToExcel}
            disabled={exportLoading || displayedBills.length === 0}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              exportLoading || displayedBills.length === 0
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
                Export to Excel ({displayedBills.length})
              </>
            )}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-600 py-8">Loading...</div>
      ) : purchaseBills.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          No purchase bills found
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Party Type
                </label>
                <select
                  value={partyType}
                  onChange={(e) => setPartyType(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="farmer">Farmer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Company
                </label>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
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
                  From Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={resetToCurrentMonth}
                    className="px-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs whitespace-nowrap"
                    title="Reset to current month"
                  >
                    Current Month
                  </button>
                </div>
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
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by party type, Company Code, bill no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  setSearch("");
                  setPartyType("");
                  setCompanyFilter("");
                  resetToCurrentMonth();
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-medium text-sm transition"
              >
                Clear Filters
              </button>
            </div>

            {/* Current Month Indicator */}
            <div className="mt-3 text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
              <span className="font-medium">Date Range:</span>{" "}
              {formatDateDMY(dateFrom)} to {formatDateDMY(dateTo)}
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                Current Month Filter
              </span>
            </div>
          </div>

          {/* Table */}
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
                      className="px-4 py-3 text-left whitespace-nowrap font-semibold cursor-pointer select-none"
                    >
                      Bill No{" "}
                      {sortBy === "bill_no"
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                    <th
                      onClick={() => toggleSort("bill_date")}
                      className="px-4 py-3 text-left whitespace-nowrap font-semibold cursor-pointer select-none"
                    >
                      Bill Date{" "}
                      {sortBy === "bill_date"
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>

                    <th
                      onClick={() => toggleSort("total")}
                      className="px-4 py-3 text-right whitespace-nowrap font-semibold cursor-pointer select-none"
                    >
                      Total{" "}
                      {sortBy === "total"
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      GST Total
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Party</th>
                    <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
                      Vendor / Farmer
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Transport Rate
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Paid Amount
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No purchase bills match the current filters
                      </td>
                    </tr>
                  ) : (
                    displayedBills.map((bill, index) => {
                      const filterData = bill?.items?.[0]?.items;

                      const eachRowTotalPurchaseGst = filterData?.reduce(
                        (sum, item) => {
                          return sum + Number(item?.gst_amount);
                        },
                        0
                      );

                      const hasMultiple = bill.items[0]?.items.length > 0;

                      return (
                        <tr
                          key={`${bill.companyCode}::${bill.purchase_id}::${index}`}
                          className="hover:bg-blue-50 transition duration-150"
                        >
                          <td className="px-4 py-3 text-gray-700">
                            {bill.companyCode.toUpperCase()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                            {bill?.items[0].purchaseDetails?.bill_no}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                            {bill.items
                              ? formatDateDMY(
                                  bill.items[0]?.purchaseDetails?.bill_date
                                )
                              : "-"}
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-blue-600">
                            {(
                              Number(
                                bill.items[0]?.purchaseDetails?.total_amount
                              ) || 0
                            ).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-blue-600">
                            {eachRowTotalPurchaseGst.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <span className="capitalize inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                              {bill.items[0]?.purchaseDetails?.party_type ||
                                "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {bill.items[0]?.purchaseDetails?.firm_name ||
                              bill?.farmer_name ||
                              "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <div className="max-w-xs truncate">
                              {Number(
                                bill.items[0]?.purchaseDetails?.transport
                              ).toFixed(2) || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <div className="max-w-xs truncate">
                              {Number(
                                bill.items[0]?.purchaseDetails?.paid_amount
                              ).toFixed(2) || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {hasMultiple ? (
                              <button
                                onClick={() => handleExpand(bill)}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition font-medium"
                              >
                                View All (
                                {bill?.items?.reduce(
                                  (total, group) =>
                                    total + (group.items?.length || 0),
                                  0
                                ) ?? 0}
                                )
                              </button>
                            ) : (
                              <span className="text-gray-300 text-xs">-</span>
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

          {/* Total Summary */}
          <div className="bg-white p-4 rounded-lg shadow flex justify-between">
            <div className="text-right">
              <p className="text-gray-600 text-sm mb-1">
                Total Purchase Amount:
              </p>
              <p className="text-2xl font-bold text-blue-600">
                ₹ {totalAmount.toFixed(2)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-gray-600 text-sm mb-1">
                Total Purchase GST Amount:
              </p>
              <p className="text-2xl font-bold text-red-600">
                ₹ {totalPurchaseGSTAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Modal for expanded bill */}
          {modalData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b border-gray-300 p-6 sticky top-0 bg-white rounded-t-lg">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Bill Details
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Bill No:{" "}
                      <span className="font-semibold">{modalData.bill_no}</span>{" "}
                      | Purchase ID:{" "}
                      <span className="font-semibold">
                        {modalData.purchase_id}
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

                {/* Modal Body - Info & Table */}
                <div className="p-6 space-y-6">
                  {/* Bill Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
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
                        Party Type
                      </p>
                      <p className="text-lg font-semibold text-gray-800 mt-1">
                        <span className="capitalize inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {modalData.items[0]?.items[0]?.party_type}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Bill Date
                      </p>
                      <p className="text-lg font-semibold text-gray-800 mt-1">
                        {modalData.items[0]?.items[0]?.bill_date
                          ? new Date(
                              modalData.items[0]?.items[0]?.bill_date
                            ).toLocaleDateString("en-IN", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                    <div className="sm:col-span-2 md:col-span-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Vendor / Farmer Name
                      </p>
                      <p className="text-lg font-semibold text-gray-800 mt-1">
                        {modalData.items[0]?.items[0]?.firm_name ||
                          modalData.items[0]?.items[0]?.name ||
                          "-"}
                      </p>
                    </div>

                    <div className="sm:col-span-2 md:col-span-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Paid Amount
                      </p>
                      <p className="text-lg font-semibold text-gray-800 mt-1">
                        {Number(
                          modalData?.items[0]?.items[0]?.paid_amount
                        ).toFixed(2) || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="overflow-x-auto border border-gray-300 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">
                            Product Name
                          </th>

                          <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
                            HSN Code
                          </th>
                          <th className="px-4 py-3 text-left whitespace-nowrap font-semibold">
                            Size
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            unit
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            Rate
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            Disc Amount
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            Disc Per
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            GSt Per
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            GST Amount
                          </th>
                          <th className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {modalData.items[0]?.items?.map((item, idx) => {
                          return (
                            <tr
                              key={idx}
                              className="hover:bg-blue-50 transition"
                            >
                              <td className="px-4 py-3 text-gray-800 font-medium">
                                {item?.product_name || "-"}
                              </td>
                              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                {item?.hsn_code || "-"}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {item?.size || "-"}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {item?.unit || "-"}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {item?.rate || 0}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {item?.discount_amount || 0}
                              </td>{" "}
                              <td className="px-4 py-3 text-right text-gray-700">
                                {item?.discount_percent || 0}
                              </td>{" "}
                              <td className="px-4 py-3 text-right text-gray-700">
                                {item?.gst_percent || 0}
                              </td>{" "}
                              <td className="px-4 py-3 text-right text-gray-700">
                                {item?.gst_amount || 0}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-blue-600">
                                {Number(item?.final_amount || 0).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-100 border-t-2  border-gray-300 font-bold">
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-3 text-right text-gray-800"
                          >
                            Transport Amount
                          </td>
                          <td className="px-4 py-3 text-right text-lg text-blue-600">
                            {(
                              Number(modalData?.items[0]?.items[0].transport) ||
                              0
                            ).toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-3 text-right text-gray-800"
                          >
                            Bill Total:
                          </td>
                          <td className="px-4 py-3 text-right text-lg text-blue-600">
                            {(
                              Number(
                                modalData?.items[0]?.items[0].total_amount
                              ) || 0
                            ).toFixed(2)}
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-3 text-right text-gray-800"
                          >
                            Paid Amount:
                          </td>
                          <td className="px-4 py-3 text-right text-lg text-red-600">
                            {(
                              Number(
                                modalData?.items[0]?.purchaseDetails
                                  ?.paid_amount
                              ) || 0
                            ).toFixed(2)}
                          </td>
                        </tr>

                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-3 text-right text-gray-800"
                          >
                            Total:
                          </td>
                          <td className="px-4 py-3 text-right text-lg text-blue-600">
                            {(
                              Number(
                                modalData?.items[0]?.items[0].total_amount
                              ) -
                                Number(
                                  modalData.items?.[0]?.categoryDetails
                                    ?.paid_amount
                                ).toFixed(2) || 0
                            ).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Modal Footer */}
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

export default PurchaseBillsTable;
