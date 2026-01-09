// import React, { useEffect, useMemo, useState } from "react";
// import PurchaseAPI from "../../axios/purchaseApi";
// import { toast } from "react-toastify";

// const fx = (n) => (isNaN(n) ? "0.000" : Number(n).toFixed(3));

// export default function PurchaseDetailsPanel({ id, onClose }) {
//   const [purchase, setPurchase] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!id) return;
//     const load = async () => {
//       try {
//         setLoading(true);
//         const res = await PurchaseAPI.getById(id);
//         setPurchase(res.data || null);
//       } catch (err) {
//         console.error(err);
//         toast.error("Failed to load purchase details");
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, [id]);

//   useEffect(() => {
//     const onKey = (e) => {
//       if (e.key === "Escape") onClose?.();
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [onClose]);

//   const totals = useMemo(() => {
//     if (!purchase?.items) return { taxable: 0, gst: 0, net: 0 };
//     return purchase.items.reduce(
//       (acc, it) => {
//         const base = Number(it.size || 0) * Number(it.rate || 0) || 0;
//         const disc =
//           (base * Number(it.d1_percent || it.discount_rate || 0)) / 100;
//         const taxable = base - disc;
//         const gstAmt = (taxable * Number(it.gst_percent || 0)) / 100;
//         const finalAmt = taxable + gstAmt;
//         acc.taxable += taxable;
//         acc.gst += gstAmt;
//         acc.net += finalAmt;
//         return acc;
//       },
//       { taxable: 0, gst: 0, net: 0 }
//     );
//   }, [purchase]);

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-8"
//       role="dialog"
//       aria-modal="true"
//     >
//       <div className="absolute inset-0 bg-black/50" onClick={onClose} />
//       <div
//         className="relative w-full max-w-5xl max-h-[90vh] overflow-auto bg-white shadow-xl rounded-lg z-10"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="flex items-center justify-between p-4 border-b">
//           <h3 className="text-lg font-semibold">Purchase Details</h3>
//           <button className="px-3 py-1 bg-gray-200 rounded" onClick={onClose}>
//             Close
//           </button>
//         </div>

//         <div className="p-6">
//           {loading ? (
//             <div>Loading...</div>
//           ) : !purchase ? (
//             <div>Not found</div>
//           ) : (
//             <>
//               <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
//                 <div>
//                   <div className="text-gray-500">Bill No</div>
//                   <div className="font-semibold">{purchase.bill_no}</div>
//                 </div>
//                 <div>
//                   <div className="text-gray-500">Date</div>
//                   <div className="font-semibold">{purchase.bill_date}</div>
//                 </div>
//                 {/* Party name + badge */}
//                 <div>
//                   <div className="text-gray-500">Party</div>
//                   <div className="flex items-center gap-2">
//                     <div className="font-semibold">
//                       {purchase.party_name || purchase.vendor_name || "-"}
//                     </div>
//                     {purchase.party_type ? (
//                       <span
//                         className={`text-[10px] px-2 py-0.5 rounded ${
//                           purchase.party_type === "farmer"
//                             ? "bg-emerald-100 text-emerald-700"
//                             : "bg-blue-100 text-blue-700"
//                         }`}
//                       >
//                         {purchase.party_type}
//                       </span>
//                     ) : null}
//                   </div>
//                 </div>
//                 <div>
//                   <div className="text-gray-500">GST No</div>
//                   <div className="font-semibold">{purchase.gst_no || "-"}</div>
//                 </div>
//                 <div>
//                   <div className="text-gray-500">Status</div>
//                   <div className="font-semibold">{purchase.status || "-"}</div>
//                 </div>
//                 <div className="md:col-span-3">
//                   <div className="text-gray-500">Remarks</div>
//                   <div className="font-semibold">{purchase.remarks || "-"}</div>
//                 </div>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="min-w-full border">
//                   <thead>
//                     <tr className="bg-gray-100">
//                       <th className="p-2 border">SI</th>
//                       <th className="p-2 border">Item Name</th>
//                       <th className="p-2 border">HSN</th>
//                       <th className="p-2 border">Qty</th>
//                       <th className="p-2 border">Rate</th>
//                       <th className="p-2 border">Disc %</th>
//                       <th className="p-2 border">GST %</th>
//                       <th className="p-2 border">Taxable</th>
//                       <th className="p-2 border">GST Amt</th>
//                       <th className="p-2 border">Final Amt</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {(purchase.items || []).map((it, i) => {
//                       const base =
//                         Number(it.size || 0) * Number(it.rate || 0) || 0;
//                       const discPct = Number(
//                         it.d1_percent || it.discount_rate || 0
//                       );
//                       const discAmt = (base * discPct) / 100;
//                       const taxable = base - discAmt;
//                       const gstAmt =
//                         (taxable * Number(it.gst_percent || 0)) / 100;
//                       const finalAmt = taxable + gstAmt;
//                       return (
//                         <tr
//                           key={it.id || i}
//                           className="odd:bg-white even:bg-gray-50 text-center"
//                         >
//                           <td className="p-2 border">{i + 1}</td>
//                           <td className="p-2 border">
//                             {it.item_name || it.product_name}
//                           </td>
//                           <td className="p-2 border">{it.hsn_code || ""}</td>
//                           <td className="p-2 border">{it.size}</td>
//                           <td className="p-2 border">{fx(it.rate)}</td>
//                           <td className="p-2 border">{fx(discPct)}</td>
//                           <td className="p-2 border">{fx(it.gst_percent)}</td>
//                           <td className="p-2 border">{fx(taxable)}</td>
//                           <td className="p-2 border">{fx(gstAmt)}</td>
//                           <td className="p-2 border">{fx(finalAmt)}</td>
//                         </tr>
//                       );
//                     })}
//                     {!purchase.items?.length && (
//                       <tr>
//                         <td className="p-4 text-center" colSpan={10}>
//                           No items
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="p-3 bg-gray-50 rounded">
//                   Taxable: {fx(totals.taxable)}
//                 </div>
//                 <div className="p-3 bg-gray-50 rounded">
//                   GST Amt: {fx(totals.gst)}
//                 </div>
//                 <div className="p-3 bg-gray-50 rounded">
//                   Total: {fx(totals.net)}
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useMemo, useState } from "react";
// import PurchaseAPI from "../../axios/purchaseApi";
// import { toast } from "react-toastify";
// import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
// import DownloadIcon from "@mui/icons-material/Download";
// import PrintIcon from "@mui/icons-material/Print";
// import ScaleIcon from "@mui/icons-material/Scale";
// import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

// // Unit conversion constants (same as above)
// const UNIT_CONVERSIONS = {
//   kg: 1,
//   kgs: 1,
//   kilogram: 1,
//   kilograms: 1,
//   g: 0.001,
//   gm: 0.001,
//   gram: 0.001,
//   grams: 0.001,
//   ton: 1000,
//   tonne: 1000,
//   tonnes: 1000,
//   quintal: 100,
//   quintals: 100,
//   q: 100,
//   qtl: 100,
//   l: 1,
//   liter: 1,
//   liters: 1,
//   ml: 0.001,
//   milliliter: 0.001,
//   milliliters: 0.001,
//   pcs: 1,
//   pc: 1,
//   piece: 1,
//   pieces: 1,
//   bag: 50,
//   bags: 50,
//   sack: 50,
//   sacks: 50,
//   "": 1,
//   null: 1,
//   undefined: 1,
// };

// // Helper functions
// const fx = (n) => (isNaN(n) ? "0.000" : Number(n).toFixed(3));
// const formatCurrency = (n) => `₹${fx(n)}`;
// const API_BASE = import.meta.env.VITE_IMAGE_URL;

// // Function to convert quantity to kg
// const convertToKg = (quantity, unit) => {
//   if (!quantity && quantity !== 0) return 0;

//   const qty = Number(quantity);
//   const unitKey = (unit || "").toLowerCase().trim();

//   const conversionFactor = UNIT_CONVERSIONS[unitKey] || 1;

//   return qty * conversionFactor;
// };

// // Function to get unit abbreviation for display
// const getUnitDisplay = (unit) => {
//   if (!unit) return "kg";

//   const unitMap = {
//     kg: "kg",
//     kgs: "kg",
//     kilogram: "kg",
//     kilograms: "kg",
//     g: "g",
//     gm: "g",
//     gram: "g",
//     grams: "g",
//     ton: "ton",
//     tonne: "ton",
//     tonnes: "ton",
//     quintal: "qtl",
//     quintals: "qtl",
//     q: "qtl",
//     qtl: "qtl",
//     l: "L",
//     liter: "L",
//     liters: "L",
//     ml: "ml",
//     milliliter: "ml",
//     milliliters: "ml",
//     pcs: "pcs",
//     pc: "pcs",
//     piece: "pcs",
//     pieces: "pcs",
//     bag: "bag",
//     bags: "bag",
//     sack: "sack",
//     sacks: "sack",
//   };

//   return unitMap[unit.toLowerCase()] || unit;
// };

// // Function to format quantity with unit
// const formatQuantityWithUnit = (quantity, unit) => {
//   if (!quantity && quantity !== 0) return "0";
//   const qty = Number(quantity);
//   const unitDisplay = getUnitDisplay(unit);
//   return `${fx(qty)} ${unitDisplay}`.trim();
// };

// // Function to calculate item details with perfect calculations
// const calculateItemDetails = (item) => {
//   const quantity = Number(item.size || item.quantity || 0);
//   const unit = item.unit || "";
//   const ratePerKg = Number(item.rate || 0);

//   // Convert quantity to kg for base calculation
//   const quantityInKg = convertToKg(quantity, unit);

//   // Base amount calculation (quantity in kg * rate per kg)
//   const baseAmount = quantityInKg * ratePerKg;

//   // Discount calculation
//   const discountPercent = Number(
//     item.d1_percent || item.discount_percent || item.discount_rate || 0
//   );
//   const discountAmount = (baseAmount * discountPercent) / 100;

//   // Taxable amount (after discount)
//   const taxableAmount = baseAmount - discountAmount;

//   // GST calculation
//   const gstPercent = Number(item.gst_percent || 0);
//   const gstAmount = (taxableAmount * gstPercent) / 100;

//   // Final amount
//   const finalAmount = taxableAmount + gstAmount;

//   // Rate per unit (original unit, not kg)
//   const ratePerUnit =
//     unit && UNIT_CONVERSIONS[unit.toLowerCase()]
//       ? ratePerKg * UNIT_CONVERSIONS[unit.toLowerCase()]
//       : ratePerKg;

//   return {
//     quantity: quantity,
//     unit: unit,
//     unitDisplay: getUnitDisplay(unit),
//     quantityInKg: quantityInKg,
//     ratePerKg: ratePerKg,
//     ratePerUnit: ratePerUnit,
//     baseAmount: baseAmount,
//     discountPercent: discountPercent,
//     discountAmount: discountAmount,
//     taxableAmount: taxableAmount,
//     gstPercent: gstPercent,
//     gstAmount: gstAmount,
//     finalAmount: finalAmount,
//     itemName: item.item_name || item.product_name || "Unknown Item",
//     hsnCode: item.hsn_code || "-",
//   };
// };

// export default function PurchaseDetailsPanel({ id, onClose }) {
//   const [purchase, setPurchase] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!id) return;
//     const load = async () => {
//       try {
//         setLoading(true);
//         const res = await PurchaseAPI.getById(id);
//         setPurchase(res.data || null);
//       } catch (err) {
//         console.error(err);
//         toast.error("Failed to load purchase details");
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, [id]);

//   useEffect(() => {
//     const onKey = (e) => {
//       if (e.key === "Escape") onClose?.();
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [onClose]);

//   // Calculate overall totals with unit-wise breakdown
//   const { totals, itemDetails, unitSummary } = useMemo(() => {
//     if (!purchase?.items) {
//       return {
//         totals: {
//           base: 0,
//           discount: 0,
//           taxable: 0,
//           gst: 0,
//           net: 0,
//           totalQuantityKg: 0,
//         },
//         itemDetails: [],
//         unitSummary: {},
//       };
//     }

//     const totals = {
//       base: 0,
//       discount: 0,
//       taxable: 0,
//       gst: 0,
//       net: 0,
//       totalQuantityKg: 0,
//     };

//     const unitSummary = {};
//     const itemDetails = purchase.items.map((item, index) => {
//       const details = calculateItemDetails(item);

//       // Add to totals
//       totals.base += details.baseAmount;
//       totals.discount += details.discountAmount;
//       totals.taxable += details.taxableAmount;
//       totals.gst += details.gstAmount;
//       totals.net += details.finalAmount;
//       totals.totalQuantityKg += details.quantityInKg;

//       // Update unit summary
//       const unitKey = details.unitDisplay;
//       if (!unitSummary[unitKey]) {
//         unitSummary[unitKey] = {
//           quantity: 0,
//           quantityInKg: 0,
//           amount: 0,
//         };
//       }
//       unitSummary[unitKey].quantity += details.quantity;
//       unitSummary[unitKey].quantityInKg += details.quantityInKg;
//       unitSummary[unitKey].amount += details.finalAmount;

//       return {
//         ...details,
//         index: index + 1,
//         originalItem: item,
//       };
//     });

//     return { totals, itemDetails, unitSummary };
//   }, [purchase]);

//   // Function to print purchase details
//   const handlePrint = () => {
//     window.print();
//   };

//   // Function to download bill
//   const handleDownloadBill = () => {
//     if (purchase?.bill_img) {
//       const link = document.createElement("a");
//       link.href = `${API_BASE}${purchase.bill_img}`;
//       link.download = `Purchase_Bill_${purchase.bill_no || purchase.id}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     }
//   };

//   // Function to calculate weight breakdown
//   const getWeightBreakdown = () => {
//     const weights = {
//       tons: 0,
//       kgs: 0,
//       grams: 0,
//     };

//     let remainingWeight = totals.totalQuantityKg;

//     // Convert to tons
//     weights.tons = Math.floor(remainingWeight / 1000);
//     remainingWeight %= 1000;

//     // Remaining kgs
//     weights.kgs = Math.floor(remainingWeight);
//     remainingWeight %= 1;

//     // Convert to grams
//     weights.grams = Math.round(remainingWeight * 1000);

//     return weights;
//   };

//   const weightBreakdown = getWeightBreakdown();

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-8 print:p-0"
//       role="dialog"
//       aria-modal="true"
//     >
//       <div
//         className="absolute inset-0 bg-black/50 print:hidden"
//         onClick={onClose}
//       />
//       <div
//         className="relative w-full max-w-6xl max-h-[90vh] overflow-auto bg-white shadow-xl rounded-lg z-10 print:shadow-none print:max-h-none print:max-w-none"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="flex items-center justify-between p-4 border-b print:hidden">
//           <h3 className="text-lg font-semibold">Purchase Details</h3>
//           <div className="flex items-center gap-2">
//             {/* <button
//               className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1 hover:bg-blue-200 transition"
//               onClick={handlePrint}
//               title="Print"
//             >
//               <PrintIcon fontSize="small" /> Print
//             </button> */}
//             {purchase?.bill_img && (
//               <button
//                 className="px-3 py-1 bg-green-100 text-green-700 rounded-lg flex items-center gap-1 hover:bg-green-200 transition"
//                 onClick={handleDownloadBill}
//                 title="Download Bill"
//               >
//                 <DownloadIcon fontSize="small" /> Bill
//               </button>
//             )}
//             <button
//               className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
//               onClick={onClose}
//             >
//               Close
//             </button>
//           </div>
//         </div>

//         <div className="p-6 print:p-8">
//           {loading ? (
//             <div className="flex justify-center items-center h-64">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//             </div>
//           ) : !purchase ? (
//             <div className="text-center py-12 text-gray-500">
//               Purchase not found
//             </div>
//           ) : (
//             <>
//               {/* Header Information */}
//               <div className="mb-8 print:mb-6">
//                 <div className="flex justify-between items-start mb-6">
//                   <div>
//                     <h1 className="text-2xl font-bold text-gray-800">
//                       PURCHASE BILL
//                     </h1>
//                     <p className="text-gray-600">Purchase Details</p>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-sm text-gray-500">Bill Number</div>
//                     <div className="text-xl font-bold text-blue-700">
//                       {purchase.bill_no || "N/A"}
//                     </div>
//                     <div className="text-sm text-gray-500 mt-1">
//                       Date:{" "}
//                       {purchase.bill_date
//                         ? new Date(purchase.bill_date).toLocaleDateString(
//                             "en-IN"
//                           )
//                         : "N/A"}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//                   {/* Party Information */}
//                   <div className="bg-gray-50 p-4 rounded-lg">
//                     <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
//                       <svg
//                         className="w-5 h-5"
//                         fill="currentColor"
//                         viewBox="0 0 20 20"
//                       >
//                         <path
//                           fillRule="evenodd"
//                           d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
//                           clipRule="evenodd"
//                         />
//                       </svg>
//                       PARTY DETAILS
//                     </h3>
//                     <div className="space-y-3">
//                       <div>
//                         <div className="text-sm text-gray-500">Party Name</div>
//                         <div className="font-medium text-lg">
//                           {purchase.party_name || purchase.vendor_name || "-"}
//                         </div>
//                         {purchase.party_type && (
//                           <span
//                             className={`text-xs px-3 py-1 rounded-full mt-2 inline-block ${
//                               purchase.party_type === "farmer"
//                                 ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
//                                 : "bg-blue-100 text-blue-700 border border-blue-200"
//                             }`}
//                           >
//                             {purchase.party_type.toUpperCase()}
//                           </span>
//                         )}
//                       </div>
//                       {purchase.gst_no && (
//                         <div>
//                           <div className="text-sm text-gray-500">
//                             GST Number
//                           </div>
//                           <div className="font-medium">{purchase.gst_no}</div>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Bill Information */}
//                   <div className="bg-gray-50 p-4 rounded-lg">
//                     <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
//                       <svg
//                         className="w-5 h-5"
//                         fill="currentColor"
//                         viewBox="0 0 20 20"
//                       >
//                         <path
//                           fillRule="evenodd"
//                           d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
//                           clipRule="evenodd"
//                         />
//                       </svg>
//                       BILL INFORMATION
//                     </h3>
//                     <div className="space-y-3">
//                       <div>
//                         <div className="text-sm text-gray-500">Bill Date</div>
//                         <div className="font-medium">
//                           {purchase.bill_date
//                             ? new Date(purchase.bill_date).toLocaleDateString(
//                                 "en-IN",
//                                 {
//                                   day: "2-digit",
//                                   month: "short",
//                                   year: "numeric",
//                                 }
//                               )
//                             : "-"}
//                         </div>
//                       </div>
//                       <div>
//                         <div className="text-sm text-gray-500">Status</div>
//                         <div className="font-medium">
//                           <span
//                             className={`px-3 py-1 rounded-full text-xs ${
//                               purchase.status === "completed"
//                                 ? "bg-green-100 text-green-700 border border-green-200"
//                                 : purchase.status === "pending"
//                                 ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
//                                 : "bg-gray-100 text-gray-700 border border-gray-200"
//                             }`}
//                           >
//                             {purchase.status || "N/A"}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Transport Information */}
//                   <div className="bg-gray-50 p-4 rounded-lg">
//                     <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
//                       <svg
//                         className="w-5 h-5"
//                         fill="currentColor"
//                         viewBox="0 0 20 20"
//                       >
//                         <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
//                         <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h4v1a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H20a1 1 0 001-1v-4a1 1 0 00-.293-.707l-4-4A1 1 0 0016 5h-2a1 1 0 00-1 1v4a1 1 0 001 1h3v2h-3a1 1 0 00-1 1v1H6.05a2.5 2.5 0 00-4.9 0H3V5a1 1 0 00-1-1zm12 0h2l3 3h-3a1 1 0 01-1-1V4z" />
//                       </svg>
//                       TRANSPORT DETAILS
//                     </h3>
//                     <div className="space-y-3">
//                       {purchase.transport_name ? (
//                         <>
//                           <div>
//                             <div className="text-sm text-gray-500">
//                               Transport Name
//                             </div>
//                             <div className="font-medium">
//                               {purchase.transport_name}
//                             </div>
//                           </div>
//                           {purchase.vehicle_no && (
//                             <div>
//                               <div className="text-sm text-gray-500">
//                                 Vehicle Number
//                               </div>
//                               <div className="font-medium">
//                                 {purchase.vehicle_no}
//                               </div>
//                             </div>
//                           )}
//                         </>
//                       ) : (
//                         <div className="text-gray-500 italic">
//                           No transport details
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Remarks */}
//                 {purchase.remarks && (
//                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//                     <div className="flex items-center gap-2 text-yellow-800 font-medium mb-1">
//                       <svg
//                         className="w-5 h-5"
//                         fill="currentColor"
//                         viewBox="0 0 20 20"
//                       >
//                         <path
//                           fillRule="evenodd"
//                           d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
//                           clipRule="evenodd"
//                         />
//                       </svg>
//                       Remarks
//                     </div>
//                     <div className="text-gray-700 pl-7">{purchase.remarks}</div>
//                   </div>
//                 )}
//               </div>

//               {/* Quantity Summary by Unit */}
//               <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
//                 <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
//                   <ScaleIcon /> QUANTITY SUMMARY BY UNIT
//                 </h3>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                   {Object.entries(unitSummary).map(([unit, data], index) => (
//                     <div key={index} className="bg-white p-3 rounded border">
//                       <div className="text-sm text-gray-500">
//                         Quantity in {unit}
//                       </div>
//                       <div className="text-xl font-bold text-gray-800">
//                         {fx(data.quantity)}
//                       </div>
//                       <div className="text-sm text-gray-600">
//                         = {fx(data.quantityInKg)} kg
//                       </div>
//                     </div>
//                   ))}

//                   {/* Total in kg with breakdown */}
//                   <div className="bg-white p-3 rounded border col-span-2 md:col-span-4">
//                     <div className="text-sm text-gray-500">
//                       Total Weight (Equivalent)
//                     </div>
//                     <div className="text-xl font-bold text-gray-800">
//                       {fx(totals.totalQuantityKg)} kg
//                     </div>
//                     <div className="text-sm text-gray-600 mt-1">
//                       Breakdown:
//                       {weightBreakdown.tons > 0 &&
//                         ` ${weightBreakdown.tons} ton`}
//                       {weightBreakdown.kgs > 0 && ` ${weightBreakdown.kgs} kg`}
//                       {weightBreakdown.grams > 0 &&
//                         ` ${weightBreakdown.grams} g`}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Items Table */}
//               <div className="overflow-x-auto mb-8 print:mb-6">
//                 <table className="min-w-full border border-gray-300 print:border-2">
//                   <thead>
//                     <tr className="bg-gray-100 print:bg-gray-200">
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         SI
//                       </th>
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         Item Name
//                       </th>
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         HSN
//                       </th>
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         Quantity
//                       </th>
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         Unit
//                       </th>
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         Rate/kg (₹)
//                       </th>
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         Base Amt (₹)
//                       </th>
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         Disc %
//                       </th>
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         Disc Amt (₹)
//                       </th>
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         Taxable (₹)
//                       </th>
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         GST %
//                       </th>
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         GST Amt (₹)
//                       </th>
//                       <th className="p-3 border text-left font-semibold text-gray-700">
//                         Total (₹)
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {itemDetails.map((item) => (
//                       <tr
//                         key={item.originalItem.id || item.index}
//                         className="hover:bg-gray-50"
//                       >
//                         <td className="p-3 border text-center font-medium">
//                           {item.index}
//                         </td>
//                         <td className="p-3 border font-medium">
//                           {item.itemName}
//                         </td>
//                         <td className="p-3 border text-center">
//                           {item.hsnCode}
//                         </td>
//                         <td className="p-3 border text-center">
//                           <div className="font-bold">{fx(item.quantity)}</div>
//                           <div className="text-xs text-gray-500">
//                             = {fx(item.quantityInKg)} kg
//                           </div>
//                         </td>
//                         <td className="p-3 border text-center">
//                           <span className="bg-gray-100 px-2 py-1 rounded text-sm">
//                             {item.unitDisplay}
//                           </span>
//                         </td>
//                         <td className="p-3 border text-right">
//                           <div className="font-semibold">
//                             ₹{fx(item.ratePerKg)}
//                           </div>
//                           <div className="text-xs text-gray-500">
//                             ₹{fx(item.ratePerUnit)}/{item.unitDisplay}
//                           </div>
//                         </td>
//                         <td className="p-3 border text-right font-medium">
//                           ₹{fx(item.baseAmount)}
//                         </td>
//                         <td className="p-3 border text-right">
//                           {fx(item.discountPercent)}%
//                         </td>
//                         <td className="p-3 border text-right text-red-600">
//                           -₹{fx(item.discountAmount)}
//                         </td>
//                         <td className="p-3 border text-right font-medium">
//                           ₹{fx(item.taxableAmount)}
//                         </td>
//                         <td className="p-3 border text-right">
//                           {fx(item.gstPercent)}%
//                         </td>
//                         <td className="p-3 border text-right text-blue-600">
//                           ₹{fx(item.gstAmount)}
//                         </td>
//                         <td className="p-3 border text-right font-bold text-green-700">
//                           ₹{fx(item.finalAmount)}
//                         </td>
//                       </tr>
//                     ))}

//                     {itemDetails.length === 0 && (
//                       <tr>
//                         <td
//                           className="p-4 text-center text-gray-500"
//                           colSpan={13}
//                         >
//                           No items found in this purchase
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Amount Summary */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//                 <div className="bg-gray-50 p-5 rounded-xl border">
//                   <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                     <ScaleIcon /> QUANTITY SUMMARY
//                   </h3>
//                   <div className="space-y-3">
//                     <div className="flex justify-between items-center">
//                       <span className="text-gray-600">Total Items:</span>
//                       <span className="font-bold text-lg">
//                         {itemDetails.length}
//                       </span>
//                     </div>
//                     <div className="flex justify-between items-center">
//                       <span className="text-gray-600">Total Weight:</span>
//                       <div className="text-right">
//                         <div className="font-bold text-lg">
//                           {fx(totals.totalQuantityKg)} kg
//                         </div>
//                         <div className="text-sm text-gray-500">
//                           {weightBreakdown.tons > 0 &&
//                             `${weightBreakdown.tons} ton `}
//                           {weightBreakdown.kgs > 0 &&
//                             `${weightBreakdown.kgs} kg `}
//                           {weightBreakdown.grams > 0 &&
//                             `${weightBreakdown.grams} g`}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="pt-3 border-t">
//                       <div className="text-sm text-gray-500 mb-2">By Unit:</div>
//                       {Object.entries(unitSummary).map(([unit, data], idx) => (
//                         <div
//                           key={idx}
//                           className="flex justify-between text-sm mb-1"
//                         >
//                           <span>{unit}:</span>
//                           <span className="font-medium">
//                             {fx(data.quantity)} {unit}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-gray-50 p-5 rounded-xl border">
//                   <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                     <AttachMoneyIcon /> AMOUNT SUMMARY
//                   </h3>
//                   <div className="space-y-3">
//                     <div className="flex justify-between items-center">
//                       <span className="text-gray-600">Base Amount:</span>
//                       <span className="font-bold">₹{fx(totals.base)}</span>
//                     </div>
//                     <div className="flex justify-between items-center text-red-600">
//                       <span>Total Discount:</span>
//                       <span className="font-bold">-₹{fx(totals.discount)}</span>
//                     </div>
//                     <div className="flex justify-between items-center pt-2 border-t">
//                       <span className="font-medium">Taxable Amount:</span>
//                       <span className="font-bold">₹{fx(totals.taxable)}</span>
//                     </div>
//                     <div className="flex justify-between items-center text-blue-600">
//                       <span>Total GST:</span>
//                       <span className="font-bold">₹{fx(totals.gst)}</span>
//                     </div>
//                     <div className="flex justify-between items-center pt-4 border-t">
//                       <span className="text-xl font-bold text-gray-800">
//                         GRAND TOTAL:
//                       </span>
//                       <span className="text-2xl font-bold text-green-700">
//                         ₹{fx(totals.net)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Bill Image */}
//               {purchase.bill_img && (
//                 <div className="mb-8 print:mb-6 p-5 bg-gray-50 rounded-xl border">
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="font-semibold text-gray-700 flex items-center gap-2">
//                       <PictureAsPdfIcon /> BILL ATTACHMENT
//                     </h3>
//                     <a
//                       href={`${API_BASE}${purchase.bill_img}`}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="flex items-center gap-2 text-blue-600 hover:text-blue-800 print:hidden px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100"
//                     >
//                       <PictureAsPdfIcon /> View Full Bill
//                     </a>
//                   </div>
//                   <div className="text-center">
//                     <div className="inline-block p-4 bg-white rounded-lg border">
//                       <div className="text-sm text-gray-500 mb-2">
//                         Bill Image Preview
//                       </div>
//                       <div className="text-xs text-gray-400">
//                         [Bill image would be displayed here]
//                       </div>
//                       <div className="text-xs text-gray-500 mt-2">
//                         File: {purchase.bill_img.split("/").pop()}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Footer */}
//               <div className="pt-6 border-t text-center text-sm text-gray-500 print:mt-8">
//                 <p>
//                   This is a system generated purchase bill. For any queries,
//                   please contact accounts department.
//                 </p>
//                 <p className="mt-2">
//                   Printed on:{" "}
//                   {new Date().toLocaleDateString("en-IN", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   })}{" "}
//                   at{" "}
//                   {new Date().toLocaleTimeString("en-IN", {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })}
//                 </p>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import PurchaseAPI from "../../axios/purchaseApi";
import { toast } from "react-toastify";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import ScaleIcon from "@mui/icons-material/Scale";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

// Unit conversion constants
const UNIT_CONVERSIONS = {
  kg: 1,
  kgs: 1,
  kilogram: 1,
  kilograms: 1,
  g: 0.001,
  gm: 0.001,
  gram: 0.001,
  grams: 0.001,
  ton: 1000,
  tonne: 1000,
  tonnes: 1000,
  quintal: 100,
  quintals: 100,
  quantal: 100,
  q: 100,
  qtl: 100,
  l: 1,
  liter: 1,
  liters: 1,
  ml: 0.001,
  milliliter: 0.001,
  milliliters: 0.001,
  pcs: 1,
  pc: 1,
  piece: 1,
  pieces: 1,
  bag: 50,
  bags: 50,
  sack: 50,
  sacks: 50,
  "": 1,
  null: 1,
  undefined: 1,
};

// Helper functions
const fx = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));
const formatCurrency = (n) => `₹${fx(n)}`;
const API_BASE = import.meta.env.VITE_IMAGE_URL;

// Function to convert quantity to kg
const convertToKg = (quantity, unit) => {
  if (!quantity && quantity !== 0) return 0;

  const qty = Number(quantity);
  const unitKey = (unit || "").toLowerCase().trim();

  const conversionFactor = UNIT_CONVERSIONS[unitKey] || 1;

  return qty * conversionFactor;
};

// Function to get unit abbreviation for display
const getUnitDisplay = (unit) => {
  if (!unit) return "kg";

  const unitMap = {
    kg: "kg",
    kgs: "kg",
    kilogram: "kg",
    kilograms: "kg",
    g: "g",
    gm: "g",
    gram: "g",
    grams: "g",
    ton: "ton",
    tonne: "ton",
    tonnes: "ton",
    quintal: "qtl",
    quintals: "qtl",
    q: "qtl",
    qtl: "qtl",
    quantal: "qtl",
    l: "L",
    liter: "L",
    liters: "L",
    ml: "ml",
    milliliter: "ml",
    milliliters: "ml",
    pcs: "pcs",
    pc: "pcs",
    piece: "pcs",
    pieces: "pcs",
    bag: "bag",
    bags: "bag",
    sack: "sack",
    sacks: "sack",
  };

  return unitMap[unit.toLowerCase()] || unit;
};

// Function to format quantity with unit
const formatQuantityWithUnit = (quantity, unit) => {
  if (!quantity && quantity !== 0) return "0";
  const qty = Number(quantity);
  const unitDisplay = getUnitDisplay(unit);
  return `${fx(qty)} ${unitDisplay}`.trim();
};

// Function to calculate item details with perfect calculations
const calculateItemDetails = (item) => {
  const quantity = Number(item.size || item.quantity || 0);
  const unit = item.unit || "";
  const ratePerKg = Number(item.rate || 0);

  // Convert quantity to kg for base calculation
  const quantityInKg = convertToKg(quantity, unit);

  // Base amount calculation (quantity in kg * rate per kg)
  const baseAmount = quantityInKg * ratePerKg;

  // Discount calculation
  const discountPercent = Number(
    item.d1_percent || item.discount_percent || item.discount_rate || 0
  );
  const discountAmount = (baseAmount * discountPercent) / 100;

  // Taxable amount (after discount)
  const taxableAmount = baseAmount - discountAmount;

  // GST calculation
  const gstPercent = Number(item.gst_percent || 0);
  const gstAmount = (taxableAmount * gstPercent) / 100;

  // Final amount
  const finalAmount = taxableAmount + gstAmount;

  // Rate per unit (original unit, not kg)
  const ratePerUnit =
    unit && UNIT_CONVERSIONS[unit.toLowerCase()]
      ? ratePerKg * UNIT_CONVERSIONS[unit.toLowerCase()]
      : ratePerKg;

  return {
    quantity: quantity,
    unit: unit,
    unitDisplay: getUnitDisplay(unit),
    quantityInKg: quantityInKg,
    ratePerKg: ratePerKg,
    ratePerUnit: ratePerUnit,
    baseAmount: baseAmount,
    discountPercent: discountPercent,
    discountAmount: discountAmount,
    taxableAmount: taxableAmount,
    gstPercent: gstPercent,
    gstAmount: gstAmount,
    finalAmount: finalAmount,
    itemName: item.item_name || item.product_name || "Unknown Item",
    hsnCode: item.hsn_code || "-",
  };
};

export default function PurchaseDetailsPanel({ id, onClose }) {
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalDiscount, setTotalDiscount] = useState(0);
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await PurchaseAPI.getById(id);
        setPurchase(res.data || null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load purchase details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Calculate overall totals with unit-wise breakdown
  const { totals, itemDetails, unitSummary, paymentInfo } = useMemo(() => {
    if (!purchase) {
      return {
        totals: {
          base: 0,
          discount: 0,
          taxable: 0,
          gst: 0,
          net: 0,
          totalQuantityKg: 0,
          paid: 0,
          balance: 0,
        },
        itemDetails: [],
        unitSummary: {},
        paymentInfo: {
          paidAmount: 0,
          balanceDue: 0,
          paymentMethod: "",
          paymentNote: "",
          paymentStatus: "",
        },
      };
    }

    // Extract payment info from purchase
    const totalAmount = Number(purchase.total_amount || 0);
    const paidAmount = Number(purchase.paid_amount || 0);
    const balanceDue = totalAmount - paidAmount;
    const paymentMethod = purchase.payment_method || "Cash";
    const paymentNote = purchase.payment_note || "";
    const paymentStatus =
      balanceDue <= 0
        ? "Paid"
        : balanceDue === totalAmount
        ? "Unpaid"
        : "Partial";

    const totals = {
      base: Number(purchase.base_amount || 0),
      discount: Number(purchase.discount_amount || 0), // Overall discount
      taxable: Number(purchase.taxable_amount || 0),
      gst: Number(purchase.gst_amount || 0),
      net: totalAmount,
      totalQuantityKg: 0,
      paid: paidAmount,
      balance: balanceDue,
    };

    const unitSummary = {};
    let itemDetails = [];

    if (purchase.items && purchase.items.length > 0) {
      // Calculate totals from items if needed
      let itemTotalBase = 0;
      let itemTotalDiscount = 0;
      let itemTotalTaxable = 0;
      let itemTotalGst = 0;
      let itemTotalNet = 0;

      itemDetails = purchase.items.map((item, index) => {
        const details = calculateItemDetails(item);

        // Add to item totals
        itemTotalBase += details.baseAmount;
        itemTotalDiscount += details.discountAmount;
        itemTotalTaxable += details.taxableAmount;
        itemTotalGst += details.gstAmount;
        itemTotalNet += details.finalAmount;
        totals.totalQuantityKg += details.quantityInKg;

        // Update unit summary
        const unitKey = details.unitDisplay;
        if (!unitSummary[unitKey]) {
          unitSummary[unitKey] = {
            quantity: 0,
            quantityInKg: 0,
            amount: 0,
          };
        }
        unitSummary[unitKey].quantity += details.quantity;
        unitSummary[unitKey].quantityInKg += details.quantityInKg;
        unitSummary[unitKey].amount += details.finalAmount;

        return {
          ...details,
          index: index + 1,
          originalItem: item,
        };
      });

      // If totals from purchase don't match, use item totals (for backward compatibility)
      if (totals.base === 0 && itemTotalBase > 0) {
        totals.base = itemTotalBase;
        totals.taxable = itemTotalTaxable;
        totals.gst = itemTotalGst;
        totals.net = itemTotalNet;
      }
    }

    return {
      totals,
      itemDetails,
      unitSummary,
      paymentInfo: {
        paidAmount,
        balanceDue,
        paymentMethod,
        paymentNote,
        paymentStatus,
      },
    };
  }, [purchase]);

  // Function to print purchase details
  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const total =
      itemDetails?.reduce(
        (sum, item) => sum + Number(item?.discountAmount || 0),
        0
      ) || 0;

    setTotalDiscount(total);
  }, [itemDetails, totalDiscount]);

  // Function to download bill
  const handleDownloadBill = () => {
    if (purchase?.bill_img) {
      const link = document.createElement("a");
      link.href = `${API_BASE}${purchase.bill_img}`;
      link.download = `Purchase_Bill_${purchase.bill_no || purchase.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Function to calculate weight breakdown
  const getWeightBreakdown = () => {
    const weights = {
      tons: 0,
      kgs: 0,
      grams: 0,
    };

    let remainingWeight = totals.totalQuantityKg;

    // Convert to tons
    weights.tons = Math.floor(remainingWeight / 1000);
    remainingWeight %= 1000;

    // Remaining kgs
    weights.kgs = Math.floor(remainingWeight);
    remainingWeight %= 1;

    // Convert to grams
    weights.grams = Math.round(remainingWeight * 1000);

    return weights;
  };

  const weightBreakdown = getWeightBreakdown();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-8 print:p-0"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 print:hidden"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-6xl max-h-[90vh] overflow-auto bg-white shadow-xl rounded-lg z-10 print:shadow-none print:max-h-none print:max-w-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b print:hidden">
          <h3 className="text-lg font-semibold">Purchase Details</h3>
          <div className="flex items-center gap-2">
            {purchase?.bill_img && (
              <button
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg flex items-center gap-1 hover:bg-green-200 transition"
                onClick={handleDownloadBill}
                title="Download Bill"
              >
                <DownloadIcon fontSize="small" /> Bill
              </button>
            )}
            <button
              className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 print:p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !purchase ? (
            <div className="text-center py-12 text-gray-500">
              Purchase not found
            </div>
          ) : (
            <>
              {/* Header Information */}
              <div className="mb-8 print:mb-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      PURCHASE BILL
                    </h1>
                    <p className="text-gray-600">Purchase Details</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Bill Number</div>
                    <div className="text-xl font-bold text-blue-700">
                      {purchase.bill_no || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Date:{" "}
                      {purchase.bill_date
                        ? new Date(purchase.bill_date).toLocaleDateString(
                            "en-IN"
                          )
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Party Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      PARTY DETAILS
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-500">Party Name</div>
                        <div className="font-medium text-lg">
                          {purchase.farmer_name || purchase.vendor_name || "-"}
                        </div>
                        {purchase.party_type && (
                          <span
                            className={`text-xs px-3 py-1 rounded-full mt-2 inline-block ${
                              purchase.party_type === "farmer"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {purchase.party_type.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {purchase.gst_no && (
                        <div>
                          <div className="text-sm text-gray-500">
                            GST Number
                          </div>
                          <div className="font-medium">{purchase.gst_no}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bill Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      BILL INFORMATION
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-500">Bill Date</div>
                        <div className="font-medium">
                          {purchase.bill_date
                            ? new Date(purchase.bill_date).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <div className="font-medium">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              purchase.status === "completed"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : purchase.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {purchase.status || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <PaymentIcon fontSize="small" />
                      PAYMENT INFORMATION
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-500">
                          Payment Method
                        </div>
                        <div className="font-medium">
                          {paymentInfo.paymentMethod}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Payment Status
                        </div>
                        <div className="font-medium">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              paymentInfo.paymentStatus === "Paid"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : paymentInfo.paymentStatus === "Partial"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                            }`}
                          >
                            {paymentInfo.paymentStatus}
                          </span>
                        </div>
                      </div>
                      {paymentInfo.paymentNote && (
                        <div>
                          <div className="text-sm text-gray-500">
                            Payment Note
                          </div>
                          <div className="font-medium text-sm">
                            {paymentInfo.paymentNote}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <PaymentIcon fontSize="small" />
                      Transport Charges
                    </h3>
                    <div>{Number(purchase?.transport).toFixed(2)}</div>
                  </div>
                </div>

                {/* Remarks */}
                {purchase.terms_condition && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-800 font-medium mb-1">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Terms & Conditions
                    </div>
                    <div className="text-gray-700 pl-7">
                      {purchase.terms_condition}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Summary by Unit */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <ScaleIcon /> QUANTITY SUMMARY BY UNIT
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(unitSummary).map(([unit, data], index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-500">
                        Quantity in {unit}
                      </div>
                      <div className="text-xl font-bold text-gray-800">
                        {fx(data.quantity)}
                      </div>
                      <div className="text-sm text-gray-600">
                        = {fx(data.quantityInKg)} kg
                      </div>
                    </div>
                  ))}

                  {/* Total in kg with breakdown */}
                  <div className="bg-white p-3 rounded border col-span-2 md:col-span-4">
                    <div className="text-sm text-gray-500">
                      Total Weight (Equivalent)
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                      {fx(totals.totalQuantityKg)} kg
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Breakdown:
                      {weightBreakdown.tons > 0 &&
                        ` ${weightBreakdown.tons} ton`}
                      {weightBreakdown.kgs > 0 && ` ${weightBreakdown.kgs} kg`}
                      {weightBreakdown.grams > 0 &&
                        ` ${weightBreakdown.grams} g`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto mb-8 print:mb-6">
                <table className="min-w-full border border-gray-300 print:border-2">
                  <thead>
                    <tr className="bg-gray-100 print:bg-gray-200">
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        SI
                      </th>
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        Item Name
                      </th>
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        HSN
                      </th>
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        Quantity
                      </th>
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        Unit
                      </th>
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        Rate/kg (₹)
                      </th>
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        Base Amt (₹)
                      </th>
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        Disc %
                      </th>
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        Disc Amt (₹)
                      </th>
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        Taxable (₹)
                      </th>
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        GST %
                      </th>
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        GST Amt (₹)
                      </th>
                      <th className="p-3 border text-left font-semibold text-gray-700">
                        Total (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemDetails.map((item) => (
                      <tr
                        key={item.originalItem.id || item.index}
                        className="hover:bg-gray-50"
                      >
                        <td className="p-3 border text-center font-medium">
                          {item.index}
                        </td>
                        <td className="p-3 border font-medium">
                          {item.itemName}
                        </td>
                        <td className="p-3 border text-center">
                          {item.hsnCode}
                        </td>
                        <td className="p-3 border text-center">
                          <div className="font-bold">{fx(item.quantity)}</div>
                          <div className="text-xs text-gray-500">
                            = {fx(item.quantityInKg)} kg
                          </div>
                        </td>
                        <td className="p-3 border text-center">
                          <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {item.unitDisplay}
                          </span>
                        </td>
                        <td className="p-3 border text-right">
                          <div className="font-semibold">
                            ₹{fx(item.ratePerKg)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ₹{fx(item.ratePerUnit)}/{item.unitDisplay}
                          </div>
                        </td>
                        <td className="p-3 border text-right font-medium">
                          ₹{fx(item.baseAmount)}
                        </td>
                        <td className="p-3 border text-right">
                          {fx(item.discountPercent)}%
                        </td>
                        <td className="p-3 border text-right text-red-600">
                          -₹{fx(item.discountAmount)}
                        </td>
                        <td className="p-3 border text-right font-medium">
                          ₹{fx(item.taxableAmount)}
                        </td>
                        <td className="p-3 border text-right">
                          {fx(item.gstPercent)}%
                        </td>
                        <td className="p-3 border text-right text-blue-600">
                          ₹{fx(item.gstAmount)}
                        </td>
                        <td className="p-3 border text-right font-bold text-green-700">
                          ₹{fx(item.finalAmount)}
                        </td>
                      </tr>
                    ))}

                    {itemDetails.length === 0 && (
                      <tr>
                        <td
                          className="p-4 text-center text-gray-500"
                          colSpan={13}
                        >
                          No items found in this purchase
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Amount and Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Quantity Summary */}
                <div className="bg-gray-50 p-5 rounded-xl border">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <ScaleIcon /> QUANTITY SUMMARY
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-bold text-lg">
                        {itemDetails.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Weight:</span>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {fx(totals.totalQuantityKg)} kg
                        </div>
                        <div className="text-sm text-gray-500">
                          {weightBreakdown.tons > 0 &&
                            `${weightBreakdown.tons} ton `}
                          {weightBreakdown.kgs > 0 &&
                            `${weightBreakdown.kgs} kg `}
                          {weightBreakdown.grams > 0 &&
                            `${weightBreakdown.grams} g`}
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="text-sm text-gray-500 mb-2">By Unit:</div>
                      {Object.entries(unitSummary).map(([unit, data], idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm mb-1"
                        >
                          <span>{unit}:</span>
                          <span className="font-medium">
                            {fx(data.quantity)} {unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="bg-gray-50 p-5 rounded-xl border">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <AttachMoneyIcon /> AMOUNT SUMMARY
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Base Amount:</span>
                      <span className="font-bold">₹{fx(totals.base)}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span>Total Discount:</span>
                      <span className="font-bold">-₹{fx(totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">Taxable Amount:</span>
                      <span className="font-bold">₹{fx(totals.taxable)}</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-600">
                      <span>Total GST:</span>
                      <span className="font-bold">₹{fx(totals.gst)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-xl font-bold text-gray-800">
                        GRAND TOTAL:
                      </span>
                      <span className="text-2xl font-bold text-green-700">
                        ₹{fx(totals.net)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 p-5 rounded-xl border">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <AccountBalanceWalletIcon /> PAYMENT SUMMARY
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Bill Amount:</span>
                      <span className="font-bold">₹{fx(totals.net)}</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600">
                      <span>Paid Amount:</span>
                      <span className="font-bold">₹{fx(totals.paid)}</span>
                    </div>
                    <div className="flex justify-between items-center text-orange-600">
                      <span>Balance Due:</span>
                      <span className="font-bold">₹{fx(totals.balance)}</span>
                    </div>

                    {/* Payment Progress Bar */}
                    <div className="pt-4">
                      <div className="text-sm text-gray-500 mb-2">
                        Payment Progress
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            paymentInfo.paymentStatus === "Paid"
                              ? "bg-green-600"
                              : paymentInfo.paymentStatus === "Partial"
                              ? "bg-yellow-500"
                              : "bg-red-600"
                          }`}
                          style={{
                            width: `${
                              totals.net > 0
                                ? Math.min(
                                    100,
                                    (totals.paid / totals.net) * 100
                                  )
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>
                          {Math.round((totals.paid / totals.net) * 100)}% Paid
                        </span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="pt-3 border-t">
                      <div className="text-sm text-gray-500">
                        Payment Status
                      </div>
                      <div
                        className={`text-lg font-bold mt-1 ${
                          paymentInfo.paymentStatus === "Paid"
                            ? "text-green-600"
                            : paymentInfo.paymentStatus === "Partial"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {paymentInfo.paymentStatus}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill Image */}
              {purchase.bill_img && (
                <div className="mb-8 print:mb-6 p-5 bg-gray-50 rounded-xl border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <PictureAsPdfIcon /> BILL ATTACHMENT
                    </h3>
                    <a
                      href={`${API_BASE}${purchase.bill_img}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 print:hidden px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      <PictureAsPdfIcon /> View Full Bill
                    </a>
                  </div>
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white rounded-lg border">
                      <div className="text-sm text-gray-500 mb-2">
                        Bill Image Preview
                      </div>
                      <div className="text-xs text-gray-400">
                        [Bill image would be displayed here]
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        File: {purchase.bill_img.split("/").pop()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-6 border-t text-center text-sm text-gray-500 print:mt-8">
                <p>
                  This is a system generated purchase bill. For any queries,
                  please contact accounts department.
                </p>
                <p className="mt-2">
                  Printed on:{" "}
                  {new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  at{" "}
                  {new Date().toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
