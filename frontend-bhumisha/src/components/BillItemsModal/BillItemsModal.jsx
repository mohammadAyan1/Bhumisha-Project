// import { number } from "framer-motion";
// import React, { useState, useEffect } from "react";
// import {
//   FaTimes,
//   FaBox,
//   FaTag,
//   FaPercent,
//   FaRupeeSign,
//   FaWeight,
//   FaSpinner,
// } from "react-icons/fa";

// const BillItemsModal = ({ bill, billType, onClose }) => {
//   const [loading, setLoading] = useState(false);

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(amount || 0);
//   };

//   const getUnitLabel = (unit) => {
//     const unitMap = {
//       g: "Gram",
//       gram: "Gram",
//       kg: "Kilogram",
//       kilogram: "Kilogram",
//       ton: "Ton",
//       quintal: "Quintal",
//       piece: "Piece",
//       packet: "Packet",
//       box: "Box",
//     };
//     return unitMap[unit?.toLowerCase()] || unit || "Unit";
//   };

//   // Calculate totals
//   const calculateTotals = () => {
//     if (!bill?.items)
//       return {
//         totalQuantity: 0,
//         totalDiscount: 0,
//         totalGST: 0,
//         totalAmount: 0,
//       };

//     return bill.items.reduce(
//       (acc, item) => {
//         acc.totalQuantity += parseFloat(
//           item.quantity || item.qty || item.quantity_in_kg || 0
//         );
//         acc.totalDiscount += parseFloat(item.discount_amount || 0);
//         acc.totalGST += parseFloat(item.gst_amount || 0);
//         acc.totalAmount += parseFloat(
//           item.final_amount || item?.net_total || 0
//         );
//         return acc;
//       },
//       { totalQuantity: 0, totalDiscount: 0, totalGST: 0, totalAmount: 0 }
//     );
//   };

//   const totals = calculateTotals();

//   if (!bill) {
//     return null;
//   }

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
//         {/* Modal Header */}
//         <div className="px-6 py-4 border-b border-gray-200 bg-indigo-600 text-white">
//           <div className="flex justify-between items-center">
//             <div>
//               <h3 className="text-lg font-semibold">
//                 {billType === "sales" ? "Sales" : "Purchases"} Bill Items
//                 Details
//               </h3>
//               <p className="text-sm opacity-90">
//                 Bill No: {bill.bill_no} • Date: {bill.bill_date} •
//                 {bill.party_name && ` Party: ${bill.party_name}`}
//                 {bill.vendor_name && ` Vendor: ${bill.vendor_name}`}
//                 {bill.farmer_name && ` Farmer: ${bill.farmer_name}`}
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="text-white hover:text-gray-200"
//               disabled={loading}
//             >
//               <FaTimes className="w-6 h-6" />
//             </button>
//           </div>
//         </div>

//         {/* Modal Body */}
//         <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
//           <div className="p-6">
//             {loading ? (
//               <div className="flex justify-center items-center py-12">
//                 <FaSpinner className="animate-spin text-4xl text-indigo-600" />
//               </div>
//             ) : (
//               <>
//                 {/* Summary Cards */}
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//                   <div className="bg-blue-50 p-4 rounded-lg">
//                     <div className="flex items-center text-blue-700 mb-1">
//                       <FaWeight className="mr-2" />
//                       <span className="text-sm">Total Quantity</span>
//                     </div>
//                     <div className="text-xl font-bold text-blue-800">
//                       {totals.totalQuantity.toFixed(2)}
//                       {bill.items?.[0]?.unit &&
//                         ` ${getUnitLabel(bill.items[0].unit)}`}
//                     </div>
//                   </div>

//                   <div className="bg-red-50 p-4 rounded-lg">
//                     <div className="flex items-center text-red-700 mb-1">
//                       <FaTag className="mr-2" />
//                       <span className="text-sm">Total Discount</span>
//                     </div>
//                     <div className="text-xl font-bold text-red-800">
//                       {formatCurrency(totals.totalDiscount)}
//                     </div>
//                   </div>

//                   <div className="bg-green-50 p-4 rounded-lg">
//                     <div className="flex items-center text-green-700 mb-1">
//                       <FaPercent className="mr-2" />
//                       <span className="text-sm">Total GST</span>
//                     </div>
//                     <div className="text-xl font-bold text-green-800">
//                       {formatCurrency(totals.totalGST)}
//                     </div>
//                   </div>

//                   <div className="bg-purple-50 p-4 rounded-lg">
//                     <div className="flex items-center text-purple-700 mb-1">
//                       <FaRupeeSign className="mr-2" />
//                       <span className="text-sm">Total Amount</span>
//                     </div>
//                     <div className="text-xl font-bold text-purple-800">
//                       {formatCurrency(totals.totalAmount)}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Items Table */}
//                 {bill.items && bill.items.length > 0 ? (
//                   <>
//                     <div className="overflow-x-auto mb-6">
//                       <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gray-50">
//                           <tr>
//                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                               #
//                             </th>
//                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                               Product
//                             </th>
//                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                               HSN Code
//                             </th>
//                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                               Quantity
//                             </th>
//                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                               Rate
//                             </th>
//                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                               Discount
//                             </th>
//                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                               GST
//                             </th>
//                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                               Total
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                           {bill.items.map((item, index) => (
//                             <tr key={index} className="hover:bg-gray-50">
//                               <td className="px-4 py-3 text-sm text-gray-500">
//                                 {index + 1}
//                               </td>
//                               <td className="px-4 py-3">
//                                 <div className="flex items-center">
//                                   <FaBox className="text-gray-400 mr-2" />
//                                   <span className="text-sm font-medium">
//                                     {item.product_name || "Product"}
//                                   </span>
//                                 </div>
//                               </td>
//                               <td className="px-4 py-3 text-sm text-gray-600">
//                                 {item.product_code || item.hsn_code || "-"}
//                               </td>
//                               <td className="px-4 py-3 text-sm">
//                                 <div className="font-medium">
//                                   {item.quantity ||
//                                     item.qty ||
//                                     item.quantity_in_kg ||
//                                     0}
//                                   <span className="text-gray-500 ml-1">
//                                     {getUnitLabel(item.unit)}
//                                   </span>
//                                 </div>
//                               </td>
//                               <td className="px-4 py-3 text-sm">
//                                 {formatCurrency(item.rate)}
//                               </td>
//                               <td className="px-4 py-3 text-sm">
//                                 <div className="space-y-1">
//                                   <div className="text-red-600">
//                                     {item.discount_percent ||
//                                       item.discount_rate ||
//                                       0}
//                                     %
//                                   </div>
//                                   <div className="text-gray-600">
//                                     {formatCurrency(item.discount_amount || 0)}
//                                   </div>
//                                 </div>
//                               </td>
//                               <td className="px-4 py-3 text-sm">
//                                 <div className="space-y-1">
//                                   <div className="text-green-600">
//                                     {item.gst_percent || 0}%
//                                   </div>
//                                   <div className="text-gray-600">
//                                     {formatCurrency(item.gst_amount || 0)}
//                                   </div>
//                                 </div>
//                               </td>
//                               <td className="px-4 py-3 text-sm font-medium">
//                                 {formatCurrency(
//                                   item.final_amount || item?.net_total || 0
//                                 )}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>

//                     {/* Bill Summary */}
//                     <div className="mt-6 p-4 bg-gray-50 rounded-lg">
//                       <h4 className="font-medium text-gray-700 mb-3">
//                         Bill Summary
//                       </h4>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                           <div className="flex justify-between py-2 border-b border-gray-200">
//                             <span className="text-gray-600">Subtotal:</span>
//                             <span className="font-medium">
//                               {formatCurrency(
//                                 bill?.items?.reduce((sum, item) => {
//                                   return (
//                                     sum + Number(item?.base_amount) ||
//                                     Number(item?.taxable_amount) +
//                                       Number(item?.discount_amount)
//                                   );
//                                 }, 0)
//                               )}
//                             </span>
//                           </div>
//                           <div className="flex justify-between py-2 border-b border-gray-200">
//                             <span className="text-gray-600">
//                               Total Discount:
//                             </span>
//                             <span className="font-medium text-red-600">
//                               -{formatCurrency(totals.totalDiscount)}
//                             </span>
//                           </div>
//                           <div className="flex justify-between py-2 border-b border-gray-200">
//                             <span className="text-gray-600">Total GST:</span>
//                             <span className="font-medium text-green-600">
//                               {formatCurrency(totals.totalGST)}
//                             </span>
//                           </div>
//                           {bill.transport_amount ||
//                           bill.transport ||
//                           bill.other_amount ? (
//                             <div className="flex justify-between py-2 border-b border-gray-200">
//                               <span className="text-gray-600">
//                                 Transport Charges:
//                               </span>
//                               <span className="font-medium">
//                                 {formatCurrency(
//                                   bill.transport_amount ||
//                                     bill.transport ||
//                                     bill.other_amount ||
//                                     0
//                                 )}
//                               </span>
//                             </div>
//                           ) : null}
//                         </div>
//                         <div className="flex items-center justify-center">
//                           <div className="text-center">
//                             <div className="text-sm text-gray-600 mb-1">
//                               Grand Total
//                             </div>
//                             <div className="text-2xl font-bold text-indigo-700">
//                               {formatCurrency(
//                                 bill.total_amount || totals.totalAmount
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Count */}
//                     <div className="mt-4 text-sm text-gray-600">
//                       Showing {bill.items.length} items
//                     </div>
//                   </>
//                 ) : (
//                   <div className="text-center py-12">
//                     <FaBox className="text-gray-300 text-5xl mx-auto mb-4" />
//                     <p className="text-gray-500">
//                       No items found for this bill
//                     </p>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>

//         {/* Modal Footer */}
//         <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
//           <button
//             onClick={onClose}
//             disabled={loading}
//             className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BillItemsModal;

import { number } from "framer-motion";
import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaBox,
  FaTag,
  FaPercent,
  FaRupeeSign,
  FaWeight,
  FaSpinner,
} from "react-icons/fa";

// Date formatting utility function
const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      // Try parsing as dd-mm-yyyy or dd/mm/yyyy
      const parts = dateString.split(/[\/\-]/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];
        return `${day}/${month}/${year}`;
      }
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return dateString;
  }
};

const BillItemsModal = ({ bill, billType, onClose }) => {
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getUnitLabel = (unit) => {
    const unitMap = {
      g: "Gram",
      gram: "Gram",
      kg: "Kilogram",
      kilogram: "Kilogram",
      ton: "Ton",
      quintal: "Quintal",
      piece: "Piece",
      packet: "Packet",
      box: "Box",
    };
    return unitMap[unit?.toLowerCase()] || unit || "Unit";
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!bill?.items)
      return {
        totalQuantity: 0,
        totalDiscount: 0,
        totalGST: 0,
        totalAmount: 0,
      };

    return bill.items.reduce(
      (acc, item) => {
        acc.totalQuantity += parseFloat(
          item.quantity || item.qty || item.quantity_in_kg || 0
        );
        acc.totalDiscount += parseFloat(item.discount_amount || 0);
        acc.totalGST += parseFloat(item.gst_amount || 0);
        acc.totalAmount += parseFloat(
          item.final_amount || item?.net_total || 0
        );
        return acc;
      },
      { totalQuantity: 0, totalDiscount: 0, totalGST: 0, totalAmount: 0 }
    );
  };

  const totals = calculateTotals();

  if (!bill) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-indigo-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">
                {billType === "sales" ? "Sales" : "Purchases"} Bill Items
                Details
              </h3>
              <p className="text-sm opacity-90">
                Bill No: {bill.bill_no} • Date:{" "}
                {formatDateToDDMMYYYY(bill.bill_date)} •
                {bill.party_name && ` Party: ${bill.party_name}`}
                {bill.vendor_name && ` Vendor: ${bill.vendor_name}`}
                {bill.farmer_name && ` Farmer: ${bill.farmer_name}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
              disabled={loading}
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <FaSpinner className="animate-spin text-4xl text-indigo-600" />
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center text-blue-700 mb-1">
                      <FaWeight className="mr-2" />
                      <span className="text-sm">Total Quantity</span>
                    </div>
                    <div className="text-xl font-bold text-blue-800">
                      {totals.totalQuantity.toFixed(2)}
                      {bill.items?.[0]?.unit &&
                        ` ${getUnitLabel(bill.items[0].unit)}`}
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center text-red-700 mb-1">
                      <FaTag className="mr-2" />
                      <span className="text-sm">Total Discount</span>
                    </div>
                    <div className="text-xl font-bold text-red-800">
                      {formatCurrency(totals.totalDiscount)}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center text-green-700 mb-1">
                      <FaPercent className="mr-2" />
                      <span className="text-sm">Total GST</span>
                    </div>
                    <div className="text-xl font-bold text-green-800">
                      {formatCurrency(totals.totalGST)}
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center text-purple-700 mb-1">
                      <FaRupeeSign className="mr-2" />
                      <span className="text-sm">Total Amount</span>
                    </div>
                    <div className="text-xl font-bold text-purple-800">
                      {formatCurrency(totals.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                {bill.items && bill.items.length > 0 ? (
                  <>
                    <div className="overflow-x-auto mb-6">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Product
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              HSN Code
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Quantity
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Rate
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Discount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              GST
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {bill.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <FaBox className="text-gray-400 mr-2" />
                                  <span className="text-sm font-medium">
                                    {item.product_name || "Product"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.product_code || item.hsn_code || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium">
                                  {item.quantity ||
                                    item.qty ||
                                    item.quantity_in_kg ||
                                    0}
                                  <span className="text-gray-500 ml-1">
                                    {getUnitLabel(item.unit)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {formatCurrency(item.rate)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="space-y-1">
                                  <div className="text-red-600">
                                    {item.discount_percent ||
                                      item.discount_rate ||
                                      0}
                                    %
                                  </div>
                                  <div className="text-gray-600">
                                    {formatCurrency(item.discount_amount || 0)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="space-y-1">
                                  <div className="text-green-600">
                                    {item.gst_percent || 0}%
                                  </div>
                                  <div className="text-gray-600">
                                    {formatCurrency(item.gst_amount || 0)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium">
                                {formatCurrency(
                                  item.final_amount || item?.net_total || 0
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bill Summary */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">
                        Bill Summary
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">
                              {formatCurrency(
                                bill?.items?.reduce((sum, item) => {
                                  return (
                                    sum + Number(item?.base_amount) ||
                                    Number(item?.taxable_amount) +
                                      Number(item?.discount_amount)
                                  );
                                }, 0)
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">
                              Total Discount:
                            </span>
                            <span className="font-medium text-red-600">
                              -{formatCurrency(totals.totalDiscount)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600">Total GST:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(totals.totalGST)}
                            </span>
                          </div>
                          {bill.transport_amount ||
                          bill.transport ||
                          bill.other_amount ? (
                            <div className="flex justify-between py-2 border-b border-gray-200">
                              <span className="text-gray-600">
                                Transport Charges:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(
                                  bill.transport_amount ||
                                    bill.transport ||
                                    bill.other_amount ||
                                    0
                                )}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">
                              Grand Total
                            </div>
                            <div className="text-2xl font-bold text-indigo-700">
                              {formatCurrency(
                                bill.total_amount || totals.totalAmount
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Count */}
                    <div className="mt-4 text-sm text-gray-600">
                      Showing {bill.items.length} items
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FaBox className="text-gray-300 text-5xl mx-auto mb-4" />
                    <p className="text-gray-500">
                      No items found for this bill
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillItemsModal;
