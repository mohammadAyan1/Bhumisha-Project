// import React, { useState } from "react";
// import { FaTimes, FaEye } from "react-icons/fa";

// const SalesModal = ({ data, onClose, onViewItems }) => {
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(amount || 0);
//   };

//   // Calculate totals
//   const totals = data.reduce(
//     (acc, sale) => {
//       acc.totalGST += parseFloat(sale.total_gst || 0);
//       acc.totalAmount += parseFloat(sale.total_amount || 0);
//       acc.totalTransport += parseFloat(
//         sale.other_amount || sale.transport_amount || 0
//       );
//       return acc;
//     },
//     { totalGST: 0, totalAmount: 0, totalTransport: 0 }
//   );

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
//         {/* Modal Header */}
//         <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 text-white">
//           <div className="flex justify-between items-center">
//             <h3 className="text-lg font-semibold">Sales Details</h3>
//             <button
//               onClick={onClose}
//               className="text-white hover:text-gray-200"
//             >
//               <FaTimes className="w-6 h-6" />
//             </button>
//           </div>
//         </div>

//         {/* Modal Body */}
//         <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
//           <div className="p-6">
//             {/* Summary */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//               <div className="bg-blue-50 p-4 rounded-lg">
//                 <div className="text-sm text-blue-700">Total GST</div>
//                 <div className="text-2xl font-bold text-blue-800">
//                   {formatCurrency(totals.totalGST)}
//                 </div>
//               </div>
//               <div className="bg-green-50 p-4 rounded-lg">
//                 <div className="text-sm text-green-700">Total Amount</div>
//                 <div className="text-2xl font-bold text-green-800">
//                   {formatCurrency(totals.totalAmount)}
//                 </div>
//               </div>
//               <div className="bg-orange-50 p-4 rounded-lg">
//                 <div className="text-sm text-orange-700">Total Transport</div>
//                 <div className="text-2xl font-bold text-orange-800">
//                   {formatCurrency(totals.totalTransport)}
//                 </div>
//               </div>
//             </div>

//             {/* Table */}
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Date
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Party Type
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Party Name
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Bill No
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       GST Amount
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Total Amount
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Transport
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Items
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {data.map((sale, index) => {
//                     return (
//                       <tr key={index} className="hover:bg-gray-50">
//                         <td className="px-4 py-3 text-sm">{sale.bill_date}</td>
//                         <td className="px-4 py-3 text-sm capitalize">
//                           {sale.party_type}
//                         </td>
//                         <td className="px-4 py-3 text-sm">
//                           {sale.party_name || "-"}
//                         </td>
//                         <td className="px-4 py-3 text-sm font-medium">
//                           {sale.bill_no}
//                         </td>
//                         <td className="px-4 py-3 text-sm">
//                           {formatCurrency(sale.total_gst)}
//                         </td>
//                         <td className="px-4 py-3 text-sm font-medium">
//                           {formatCurrency(sale.total_amount)}
//                         </td>
//                         <td className="px-4 py-3 text-sm">
//                           {formatCurrency(
//                             sale.other_amount || sale.transport_amount || 0
//                           )}
//                         </td>
//                         <td className="px-4 py-3">
//                           <button
//                             onClick={() => onViewItems(sale, "sales")}
//                             className="text-blue-600 hover:text-blue-800 flex items-center"
//                           >
//                             <FaEye className="mr-1" />
//                             View Items
//                           </button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>

//             {/* Count */}
//             <div className="mt-4 text-sm text-gray-600">
//               Showing {data.length} sales entries
//             </div>
//           </div>
//         </div>

//         {/* Modal Footer */}
//         <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SalesModal;

import React, { useState } from "react";
import { FaTimes, FaEye } from "react-icons/fa";

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

const SalesModal = ({ data, onClose, onViewItems }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Calculate totals
  const totals = data.reduce(
    (acc, sale) => {
      acc.totalGST += parseFloat(sale.total_gst || 0);
      acc.totalAmount += parseFloat(sale.total_amount || 0);
      acc.totalTransport += parseFloat(
        sale.other_amount || sale.transport_amount || 0
      );
      return acc;
    },
    { totalGST: 0, totalAmount: 0, totalTransport: 0 }
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Sales Details</h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-700">Total GST</div>
                <div className="text-2xl font-bold text-blue-800">
                  {formatCurrency(totals.totalGST)}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-700">Total Amount</div>
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrency(totals.totalAmount)}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-orange-700">Total Transport</div>
                <div className="text-2xl font-bold text-orange-800">
                  {formatCurrency(totals.totalTransport)}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Party Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Party Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bill No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      GST Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Transport
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Items
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((sale, index) => {
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {formatDateToDDMMYYYY(sale.bill_date)}
                        </td>
                        <td className="px-4 py-3 text-sm capitalize">
                          {sale.party_type}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {sale.party_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {sale.bill_no}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatCurrency(sale.total_gst)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {formatCurrency(sale.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatCurrency(
                            sale.other_amount || sale.transport_amount || 0
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onViewItems(sale, "sales")}
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <FaEye className="mr-1" />
                            View Items
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {data.length} sales entries
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesModal;
