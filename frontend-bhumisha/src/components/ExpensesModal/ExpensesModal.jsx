// import React from "react";
// import { FaTimes } from "react-icons/fa";

// const ExpensesModal = ({ data, onClose }) => {
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
//     (acc, expense) => {
//       acc.totalGST += parseFloat(
//         expense.total_gst_amount || expense.total_gst || 0
//       );
//       acc.totalAmount += parseFloat(
//         expense.total_amount || expense.amount || 0
//       );
//       return acc;
//     },
//     { totalGST: 0, totalAmount: 0 }
//   );

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
//         {/* Modal Header */}
//         <div className="px-6 py-4 border-b border-gray-200 bg-red-600 text-white">
//           <div className="flex justify-between items-center">
//             <h3 className="text-lg font-semibold">Expenses Details</h3>
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
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//               <div className="bg-red-50 p-4 rounded-lg">
//                 <div className="text-sm text-red-700">Total GST</div>
//                 <div className="text-2xl font-bold text-red-800">
//                   {formatCurrency(totals.totalGST)}
//                 </div>
//               </div>
//               <div className="bg-green-50 p-4 rounded-lg">
//                 <div className="text-sm text-green-700">Total Amount</div>
//                 <div className="text-2xl font-bold text-green-800">
//                   {formatCurrency(totals.totalAmount)}
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
//                       Expense Type
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Description
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
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {data.map((expense, index) => (
//                     <tr key={index} className="hover:bg-gray-50">
//                       <td className="px-4 py-3 text-sm">
//                         {expense.bill_date || expense.expense_date}
//                       </td>
//                       <td className="px-4 py-3 text-sm capitalize">
//                         {expense.expenses_for || expense.expenses_type || "-"}
//                       </td>
//                       <td className="px-4 py-3 text-sm">
//                         {expense.remark || "-"}
//                       </td>
//                       <td className="px-4 py-3 text-sm font-medium">
//                         {expense.bill_no || "-"}
//                       </td>
//                       <td className="px-4 py-3 text-sm">
//                         {formatCurrency(
//                           expense.total_gst_amount || expense.total_gst || 0
//                         )}
//                       </td>
//                       <td className="px-4 py-3 text-sm font-medium">
//                         {formatCurrency(
//                           expense.total_amount || expense.amount || 0
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Count */}
//             <div className="mt-4 text-sm text-gray-600">
//               Showing {data.length} expenses entries
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

// export default ExpensesModal;

import React from "react";
import { FaTimes } from "react-icons/fa";

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

const ExpensesModal = ({ data, onClose }) => {
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
    (acc, expense) => {
      acc.totalGST += parseFloat(
        expense.total_gst_amount || expense.total_gst || 0
      );
      acc.totalAmount += parseFloat(
        expense.total_amount || expense.amount || 0
      );
      return acc;
    },
    { totalGST: 0, totalAmount: 0 }
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-red-600 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Expenses Details</h3>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-700">Total GST</div>
                <div className="text-2xl font-bold text-red-800">
                  {formatCurrency(totals.totalGST)}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-700">Total Amount</div>
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrency(totals.totalAmount)}
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
                      Expense Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((expense, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {formatDateToDDMMYYYY(
                          expense.bill_date || expense.expense_date
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {expense.expenses_for || expense.expenses_type || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {expense.remark || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {expense.bill_no || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatCurrency(
                          expense.total_gst_amount || expense.total_gst || 0
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatCurrency(
                          expense.total_amount || expense.amount || 0
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {data.length} expenses entries
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

export default ExpensesModal;
