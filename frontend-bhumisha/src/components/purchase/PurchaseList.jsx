// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import DataTable from "../DataTable/DataTable";
// import { IconButton } from "@mui/material";
// import EditIcon from "@mui/icons-material/Edit";
// import VisibilityIcon from "@mui/icons-material/Visibility";
// import { fetchPurchases } from "../../features/purchase/purchaseSlice";
// import PurchaseDetailsPanel from "./PurchaseDetailsPanel";

// const fx = (n) => (isNaN(n) ? "0.000" : Number(n).toFixed(3));

// export default function PurchaseList({ reload }) {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { list: purchases = [] } = useSelector(
//     (state) => state.purchases || {}
//   );

//   const [viewPurchaseId, setViewPurchaseId] = useState(null);
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);

//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [filterByDate, setFilterByDate] = useState(false);

//   const PAGE_SIZE = 10;

//   useEffect(() => {
//     dispatch(fetchPurchases());
//   }, [dispatch, reload]);

//   useEffect(() => {
//     if (!viewPurchaseId) return;
//     const onKey = (e) => {
//       if (e.key === "Escape") setViewPurchaseId(null);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [viewPurchaseId]);

//   // 🔍 Filter by search term
//   const searched = useMemo(() => {
//     if (!search) return purchases;
//     const term = search.toLowerCase();
//     return purchases.filter((p) =>
//       [p.bill_no, p.party_name, p.gst_no, p.total_amount]
//         .filter(Boolean)
//         .some((v) => String(v).toLowerCase().includes(term))
//     );
//   }, [purchases, search]);

//   // 📅 Filter by date range
//   const filtered = useMemo(() => {
//     if (!filterByDate || (!fromDate && !toDate)) return searched;
//     const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
//     const to = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

//     return searched.filter((p) => {
//       if (!p.bill_date) return false;
//       const date = new Date(p.bill_date).getTime();
//       if (from && to) return date >= from && date <= to;
//       if (from) return date >= from;
//       if (to) return date <= to;
//       return true;
//     });
//   }, [searched, fromDate, toDate, filterByDate]);

//   const totalPages = useMemo(
//     () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
//     [filtered]
//   );
//   const currentPageRows = useMemo(() => {
//     const start = (page - 1) * PAGE_SIZE;
//     return filtered.slice(start, start + PAGE_SIZE);
//   }, [filtered, page]);

//   const totalPurchases = purchases.length;
//   const totalAmount = purchases.reduce(
//     (s, p) => s + Number(p.total_amount || 0),
//     0
//   );

//   // CHANGED: Vendor -> Party column; optional party_type badge
//   const columns = [
//     {
//       field: "sl_no",
//       headerName: "Sl.No.",
//       width: 80,
//       sortable: false,
//       renderCell: (params) => {
//         const pageStart = (page - 1) * PAGE_SIZE;
//         const rowIndex = currentPageRows.findIndex(
//           (r) => r.id === params.row.id
//         );
//         return pageStart + rowIndex + 1;
//       },
//     },
//     {
//       field: "bill_no",
//       headerName: "Bill No",
//       flex: 1,
//       renderCell: (params) => (
//         <button
//           type="button"
//           onClick={() => setViewPurchaseId(params.row.id)}
//           className="text-blue-600 cursor-pointer underline text-left w-full truncate"
//           title={params.value}
//         >
//           {params.value || "-"}
//         </button>
//       ),
//     },
//     // NEW: Party column using party_name
//     {
//       field: "party_name",
//       headerName: "Party",
//       flex: 1,
//       renderCell: (params) => {
//         const name = params.row.party_name || params.row.vendor_name || "-";
//         const type = params.row.party_type; // 'vendor' | 'farmer' (if provided by API)
//         return (
//           <div className="flex items-center gap-2">
//             <span className="truncate">{name}</span>
//             {type ? (
//               <span
//                 className={`text-[10px] px-2 py-0.5 rounded ${
//                   type === "farmer"
//                     ? "bg-emerald-100 text-emerald-700"
//                     : "bg-blue-100 text-blue-700"
//                 }`}
//               >
//                 {type}
//               </span>
//             ) : null}
//           </div>
//         );
//       },
//     },
//     {
//       field: "bill_date",
//       headerName: "Date",
//       width: 140,
//       renderCell: (params) =>
//         params.value ? new Date(params.value).toLocaleDateString() : "N/A",
//     },
//     {
//       field: "total_amount",
//       headerName: "Total Amount",
//       width: 140,
//       renderCell: (params) => fx(params.value),
//     },
//     {
//       field: "bill_img",
//       headerName: "Bill Image",
//       width: 120,
//       sortable: false,
//       renderCell: (params) =>
//         params.value ? (
//           <button
//             onClick={() => window.open(`${API_BASE}${params.value}`, "_blank")}
//             className="text-blue-600 underline cursor-pointer"
//             title="View Bill Image"
//           >
//             View
//           </button>
//         ) : (
//           <span className="text-gray-500">No Image</span>
//         ),
//     },
//     {
//       field: "actions",
//       headerName: "Actions",
//       width: 120,
//       sortable: false,
//       renderCell: (params) => (
//         <div className="flex gap-2">
//           <IconButton
//             color="primary"
//             onClick={() => setViewPurchaseId(params.row.id)}
//             title="View"
//           >
//             <VisibilityIcon />
//           </IconButton>
//           <IconButton
//             color="secondary"
//             onClick={() => navigate(`/purchases/edit/${params.row.id}`)}
//             title="Edit"
//           >
//             <EditIcon />
//           </IconButton>
//         </div>
//       ),
//     },
//   ];

//   const API_BASE = import.meta.env.VITE_IMAGE_URL;

//   return (
//     <div className="p-6 bg-white rounded-2xl shadow-md">
//       <h2 className="text-2xl font-bold mb-6 text-gray-800">Purchases</h2>

//       {/* 📅 Date Filter */}
//       <div className="flex flex-wrap items-end gap-3 mb-6">
//         <div>
//           <label className="block text-sm text-gray-700 mb-1">From Date</label>
//           <input
//             type="date"
//             value={fromDate}
//             onChange={(e) => setFromDate(e.target.value)}
//             className="border rounded-lg p-2"
//           />
//         </div>
//         <div>
//           <label className="block text-sm text-gray-700 mb-1">To Date</label>
//           <input
//             type="date"
//             value={toDate}
//             onChange={(e) => setToDate(e.target.value)}
//             className="border rounded-lg p-2"
//           />
//         </div>
//         <button
//           onClick={() => setFilterByDate(true)}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
//         >
//           Filter
//         </button>
//         <button
//           onClick={() => {
//             setFromDate("");
//             setToDate("");
//             setFilterByDate(false);
//           }}
//           className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
//         >
//           Clear
//         </button>
//       </div>

//       {/* Stat cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//         <div className="bg-gradient-to-br from-blue-100 via-blue-200 to-blue-50 rounded-lg shadow p-4 border border-blue-200">
//           <div className="flex items-center justify-between">
//             <p className="text-sm font-medium text-blue-900">Total Purchases</p>
//             <p className="text-sm text-blue-600">#</p>
//           </div>
//           <p className="text-2xl font-bold text-blue-900 mt-2">
//             {totalPurchases}
//           </p>
//         </div>
//         <div className="bg-gradient-to-br from-green-100 via-green-200 to-green-50 rounded-lg shadow p-4 border border-green-200">
//           <div className="flex items-center justify-between">
//             <p className="text-sm font-medium text-green-900">Total Amount</p>
//             <p className="text-sm text-green-600">₹</p>
//           </div>
//           <p className="text-2xl font-bold text-green-900 mt-2">
//             {fx(totalAmount)}
//           </p>
//         </div>
//         <div className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-50 rounded-lg shadow p-4 border border-gray-200">
//           <div className="flex items-center justify-between">
//             <p className="text-sm font-medium text-gray-900">Records</p>
//             <p className="text-sm text-gray-600">{filtered.length}</p>
//           </div>
//           <p className="text-2xl font-bold text-gray-900 mt-2">
//             Page {page}/{totalPages}
//           </p>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded shadow overflow-x-auto mb-6">
//         <DataTable
//           rows={filtered}
//           columns={columns}
//           pageSize={10}
//           checkboxSelection={false}
//           title="Purchases List"
//           getRowId={(row) => row?.id}
//         />
//       </div>

//       {/* Pagination */}
//       <div className="flex justify-center items-center gap-2 mt-6">
//         <button
//           className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
//           disabled={page === 1}
//           onClick={() => setPage((p) => Math.max(1, p - 1))}
//         >
//           Prev
//         </button>
//         <span>
//           Page {page} of {totalPages}
//         </span>
//         <button
//           className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
//           disabled={page === totalPages}
//           onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//         >
//           Next
//         </button>
//       </div>

//       {viewPurchaseId && (
//         <PurchaseDetailsPanel
//           id={viewPurchaseId}
//           onClose={() => setViewPurchaseId(null)}
//         />
//       )}
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../DataTable/DataTable";
import { IconButton, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ScaleIcon from "@mui/icons-material/Scale";
import { fetchPurchases } from "../../features/purchase/purchaseSlice";
import PurchaseDetailsPanel from "./PurchaseDetailsPanel";

// Unit conversion constants (all rates are per kg)
const UNIT_CONVERSIONS = {
  // Weight units (to kg)
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
  q: 100,
  qtl: 100,

  // Volume units (assumed density for conversion - can be customized)
  l: 1, // liter (assuming 1:1 for water/density=1)
  litter: 1,
  liters: 1,
  ml: 0.001,
  milliliter: 0.001,
  milliliters: 0.001,

  // Count units
  pcs: 1, // pieces
  pc: 1,
  piece: 1,
  pieces: 1,
  bag: 50, // assuming 50kg per bag
  bags: 50,
  sack: 50, // assuming 50kg per sack
  sacks: 50,

  // Default fallback
  "": 1, // if no unit specified, treat as kg
  null: 1,
  undefined: 1,
};

// Helper functions
const fx = (n) => (isNaN(n) ? "0.000" : Number(n).toFixed(3));
const formatCurrency = (n) => `₹${fx(n)}`;
const API_BASE = import.meta.env.VITE_IMAGE_URL;

// Function to convert quantity to kg
const convertToKg = (quantity, unit) => {
  if (!quantity && quantity !== 0) return 0;

  const qty = Number(quantity);
  const unitKey = (unit || "").toLowerCase().trim();

  // Get conversion factor (default to 1 if unit not found)
  const conversionFactor = UNIT_CONVERSIONS[unitKey] || 1;

  return qty * conversionFactor;
};

// Function to format quantity with unit
const formatQuantityWithUnit = (quantity, unit) => {
  if (!quantity && quantity !== 0) return "0";
  const qty = Number(quantity);
  const unitStr = unit ? unit.trim() : "";

  // If no unit specified but we have quantity, show as kg
  if (!unitStr && qty !== 0) {
    return `${fx(qty)} kg`;
  }

  return `${fx(qty)} ${unitStr}`.trim();
};

// Function to calculate item value in base kg rate
const calculateItemValue = (quantity, unit, ratePerKg) => {
  const quantityInKg = convertToKg(quantity, unit);
  return quantityInKg * Number(ratePerKg || 0);
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
    l: "L",
    litter: "L",
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

export default function PurchaseList({ reload }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: purchases = [] } = useSelector(
    (state) => state.purchases || {}
  );

  const [viewPurchaseId, setViewPurchaseId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Changed from constant to state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterByDate, setFilterByDate] = useState(false);

  useEffect(() => {
    dispatch(fetchPurchases());
  }, [dispatch, reload]);

  useEffect(() => {
    if (!viewPurchaseId) return;
    const onKey = (e) => {
      if (e.key === "Escape") setViewPurchaseId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewPurchaseId]);

  // 🔍 Filter by search term
  const searched = useMemo(() => {
    if (!search) return purchases;
    const term = search.toLowerCase();
    return purchases.filter((p) =>
      [p.bill_no, p.party_name, p.gst_no, p.total_amount, p.transport_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [purchases, search]);

  // 📅 Filter by date range
  const filtered = useMemo(() => {
    if (!filterByDate || (!fromDate && !toDate)) return searched;
    const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const to = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

    return searched.filter((p) => {
      if (!p.bill_date) return false;
      const date = new Date(p.bill_date).getTime();
      if (from && to) return date >= from && date <= to;
      if (from) return date >= from;
      if (to) return date <= to;
      return true;
    });
  }, [searched, fromDate, toDate, filterByDate]);

  const totalRows = filtered.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalRows / pageSize)),
    [totalRows, pageSize]
  );

  // Ensure current page is valid when pageSize changes
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    } else if (page < 1 && totalPages > 0) {
      setPage(1);
    }
  }, [totalPages, pageSize]);

  const currentPageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Calculate totals with unit conversion
  const {
    totalPurchases,
    totalAmount,
    totalQuantityKg,
    totalQuantityOriginal,
  } = useMemo(() => {
    return purchases.reduce(
      (acc, purchase) => {
        acc.totalPurchases += 1;
        acc.totalAmount += Number(purchase.total_amount || 0);

        // Sum quantities from items with unit conversion
        if (purchase.items && Array.isArray(purchase.items)) {
          purchase.items.forEach((item) => {
            const quantity = Number(item.size || item.quantity || 0);
            const unit = item.unit || "";
            const unitDisplay = getUnitDisplay(unit);

            // Convert to kg for unified calculation
            const quantityInKg = convertToKg(quantity, unit);
            acc.totalQuantityKg += quantityInKg;

            // Store original quantity with unit for display
            if (quantity > 0) {
              acc.totalQuantityOriginal.push({
                quantity: quantity,
                unit: unitDisplay,
                quantityInKg: quantityInKg,
              });
            }
          });
        }

        return acc;
      },
      {
        totalPurchases: 0,
        totalAmount: 0,
        totalQuantityKg: 0,
        totalQuantityOriginal: [],
      }
    );
  }, [purchases]);

  // Group quantities by unit for display
  const quantitySummary = useMemo(() => {
    const summary = {};

    totalQuantityOriginal.forEach((item) => {
      const unit = item.unit || "kg";
      if (!summary[unit]) {
        summary[unit] = {
          total: 0,
          inKg: 0,
        };
      }
      summary[unit].total += item.quantity;
      summary[unit].inKg += item.quantityInKg;
    });

    return summary;
  }, [totalQuantityOriginal]);

  const columns = [
    {
      field: "sl_no",
      headerName: "Sl.No.",
      width: 80,
      sortable: false,
      renderCell: (params) => {
        const idx = filtered.findIndex((r) => r.id === params.row.id);
        return idx + 1; // Global index instead of page index
      },
    },
    {
      field: "bill_no",
      headerName: "Bill No",
      flex: 1,
      renderCell: (params) => (
        <button
          type="button"
          onClick={() => setViewPurchaseId(params.row.id)}
          className="text-blue-600 cursor-pointer underline text-left w-full truncate"
          title={params.value}
        >
          {params.value || "-"}
        </button>
      ),
    },
    {
      field: "party",
      headerName: "Party Details",
      flex: 1.2,
      renderCell: (params) => {
        const partyName = params.row.firm_name || params.row.farmer_name || "-";
        const partyType = params.row.party_type;
        const gstNo = params.row.gst_no;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{partyName}</span>
              {partyType && (
                <Chip
                  label={partyType}
                  size="small"
                  className={`text-xs ${
                    partyType === "farmer"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                />
              )}
            </div>
            {gstNo && (
              <span className="text-xs text-gray-500 truncate">
                GST: {gstNo}
              </span>
            )}
          </div>
        );
      },
    },
    {
      field: "bill_date",
      headerName: "Date",
      width: 120,
      renderCell: (params) =>
        params.value
          ? new Date(params.value).toLocaleDateString("en-IN")
          : "N/A",
    },
    {
      field: "quantity",
      headerName: "Items",
      width: 140,
      renderCell: (params) => {
        const itemCount = params.row.items?.length || 0;

        return <span className="font-medium">{itemCount}</span>;
      },
    },

    {
      field: "total_amount",
      headerName: "Total",
      width: 130,
      align: "right",
      renderCell: (params) => (
        <div className="text-right w-full">
          <div className="font-bold text-green-700">₹{fx(params.value)}</div>
          <div className="text-xs text-gray-500">Bill Total</div>
        </div>
      ),
    },
    {
      field: "bill_img",
      headerName: "Bill",
      width: 80,
      sortable: false,
      renderCell: (params) =>
        params.value ? (
          <button
            onClick={() => window.open(`${API_BASE}${params.value}`, "_blank")}
            className="text-blue-600 underline cursor-pointer text-sm px-2 py-1 bg-blue-50 rounded hover:bg-blue-100"
            title="View Bill Image"
          >
            View
          </button>
        ) : (
          <span className="text-gray-400 text-sm px-2 py-1">No Bill</span>
        ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <div className="flex gap-2">
          <IconButton
            color="primary"
            size="small"
            onClick={() => setViewPurchaseId(params.row.id)}
            title="View Details"
            className="bg-blue-50 hover:bg-blue-100"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="secondary"
            size="small"
            onClick={() => navigate(`/purchases/edit/${params.row.id}`)}
            title="Edit Purchase"
            className="bg-gray-50 hover:bg-gray-100"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },
  ];

  // Handler for page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(Number(newPageSize));
    setPage(1); // Reset to first page when changing page size
  };

  // Handler for page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Calculate pagination range
  const getPaginationRange = () => {
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return { start, end };
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Purchases</h2>
          <p className="text-gray-600 mt-1">Manage all purchase transactions</p>
        </div>

        {/* Search Box */}
        <div className="mt-4 md:mt-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by Bill No, Party, GST..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-80 border rounded-lg pl-10 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 📅 Date Filter */}
      <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="filterByDate"
            checked={filterByDate}
            onChange={(e) => setFilterByDate(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="filterByDate"
            className="text-sm font-medium text-gray-700"
          >
            Filter by Date Range
          </label>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded-lg p-2 w-full"
            disabled={!filterByDate}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded-lg p-2 w-full"
            disabled={!filterByDate}
          />
        </div>
        <button
          onClick={() => {
            setPage(1);
            setFilterByDate(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
          disabled={!filterByDate}
        >
          Apply Filter
        </button>
        <button
          onClick={() => {
            setFromDate("");
            setToDate("");
            setFilterByDate(false);
            setPage(1);
          }}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-100 via-blue-200 to-blue-50 rounded-xl shadow p-5 border border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">Total Purchases</p>
            <div className="text-blue-600 bg-blue-100 p-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-3">
            {totalPurchases}
          </p>
          <p className="text-sm text-blue-700 mt-1">Purchase transactions</p>
        </div>

        <div className="bg-gradient-to-br from-green-100 via-green-200 to-green-50 rounded-xl shadow p-5 border border-green-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-900">Total Quantity</p>
            <div className="text-green-600 bg-green-100 p-2 rounded-full">
              <ScaleIcon />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-3">
            {fx(totalQuantityKg)} kg
          </p>
          <div className="text-sm text-green-700 mt-1">
            {Object.entries(quantitySummary).map(([unit, data], idx) => (
              <div key={idx} className="flex justify-between">
                <span>{unit}:</span>
                <span className="font-medium">{fx(data.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-100 via-purple-200 to-purple-50 rounded-xl shadow p-5 border border-purple-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-purple-900">Total Amount</p>
            <div className="text-purple-600 bg-purple-100 p-2 rounded-full font-bold">
              ₹
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-3">
            ₹{fx(totalAmount)}
          </p>
          <p className="text-sm text-purple-700 mt-1">Total purchase value</p>
        </div>

        <div className="bg-gradient-to-br from-amber-100 via-amber-200 to-amber-50 rounded-xl shadow p-5 border border-amber-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-900">
              Showing Records
            </p>
            <div className="text-amber-600 bg-amber-100 p-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zm0 4a1 1 0 000 2h5a1 1 0 000-2H3zm0 4a1 1 0 100 2h5a1 1 0 100-2H3zm0 4a1 1 0 100 2h11a1 1 0 100-2H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-3">
            {filtered.length}
          </p>
          <p className="text-sm text-amber-700 mt-1">
            Page {page} of {totalPages}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-800">Purchases List</h3>
            <p className="text-sm text-gray-600 mt-1">
              Showing {currentPageRows.length} purchases on this page
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
            >
              {[5, 10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DataTable
          rows={currentPageRows}
          columns={columns}
          pageSize={pageSize}
          checkboxSelection={false}
          getRowId={(row) => row?.id}
          // If your DataTable supports pagination props:
          // onPageChange={(params) => handlePageChange(params.page + 1)}
          // page={page - 1}
          // rowCount={filtered.length}
          className="min-h-[400px]"
        />
      </div>

      {/* Enhanced Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(page * pageSize, filtered.length)}
            </span>{" "}
            of <span className="font-medium">{filtered.length}</span> entries
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {(() => {
                const buttons = [];
                const { start, end } = getPaginationRange();

                // Show first page button if needed
                if (start > 1) {
                  buttons.push(
                    <button
                      key={1}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        1 === page
                          ? "bg-blue-600 text-white font-medium"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </button>
                  );
                  if (start > 2) {
                    buttons.push(
                      <span key="ellipsis1" className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                }

                // Page number buttons
                for (let i = start; i <= end; i++) {
                  buttons.push(
                    <button
                      key={i}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        i === page
                          ? "bg-blue-600 text-white font-medium"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                      onClick={() => handlePageChange(i)}
                    >
                      {i}
                    </button>
                  );
                }

                // Show last page button if needed
                if (end < totalPages) {
                  if (end < totalPages - 1) {
                    buttons.push(
                      <span key="ellipsis2" className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  buttons.push(
                    <button
                      key={totalPages}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        totalPages === page
                          ? "bg-blue-600 text-white font-medium"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  );
                }

                return buttons;
              })()}
            </div>

            <button
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              disabled={page === totalPages || totalPages === 0}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{page}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </div>
        </div>
      </div>

      {viewPurchaseId && (
        <PurchaseDetailsPanel
          id={viewPurchaseId}
          onClose={() => setViewPurchaseId(null)}
        />
      )}
    </div>
  );
}

// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import DataTable from "../DataTable/DataTable";
// import { IconButton, Chip } from "@mui/material";
// import EditIcon from "@mui/icons-material/Edit";
// import VisibilityIcon from "@mui/icons-material/Visibility";
// import LocalShippingIcon from "@mui/icons-material/LocalShipping";
// import ScaleIcon from "@mui/icons-material/Scale";
// import { fetchPurchases } from "../../features/purchase/purchaseSlice";
// import PurchaseDetailsPanel from "./PurchaseDetailsPanel";

// // Unit conversion constants (all rates are per kg)
// const UNIT_CONVERSIONS = {
//   // Weight units (to kg)
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

//   // Volume units (assumed density for conversion - can be customized)
//   l: 1, // liter (assuming 1:1 for water/density=1)
//   liter: 1,
//   liters: 1,
//   ml: 0.001,
//   milliliter: 0.001,
//   milliliters: 0.001,

//   // Count units
//   pcs: 1, // pieces
//   pc: 1,
//   piece: 1,
//   pieces: 1,
//   bag: 50, // assuming 50kg per bag
//   bags: 50,
//   sack: 50, // assuming 50kg per sack
//   sacks: 50,

//   // Default fallback
//   "": 1, // if no unit specified, treat as kg
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

//   // Get conversion factor (default to 1 if unit not found)
//   const conversionFactor = UNIT_CONVERSIONS[unitKey] || 1;

//   return qty * conversionFactor;
// };

// // Function to format quantity with unit
// const formatQuantityWithUnit = (quantity, unit) => {
//   if (!quantity && quantity !== 0) return "0";
//   const qty = Number(quantity);
//   const unitStr = unit ? unit.trim() : "";

//   // If no unit specified but we have quantity, show as kg
//   if (!unitStr && qty !== 0) {
//     return `${fx(qty)} kg`;
//   }

//   return `${fx(qty)} ${unitStr}`.trim();
// };

// // Function to calculate item value in base kg rate
// const calculateItemValue = (quantity, unit, ratePerKg) => {
//   const quantityInKg = convertToKg(quantity, unit);
//   return quantityInKg * Number(ratePerKg || 0);
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

// export default function PurchaseList({ reload }) {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { list: purchases = [] } = useSelector(
//     (state) => state.purchases || {}
//   );

//   const [viewPurchaseId, setViewPurchaseId] = useState(null);
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [filterByDate, setFilterByDate] = useState(false);

//   const PAGE_SIZE = 10;

//   useEffect(() => {
//     dispatch(fetchPurchases());
//   }, [dispatch, reload]);

//   useEffect(() => {
//     if (!viewPurchaseId) return;
//     const onKey = (e) => {
//       if (e.key === "Escape") setViewPurchaseId(null);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [viewPurchaseId]);

//   // 🔍 Filter by search term
//   const searched = useMemo(() => {
//     if (!search) return purchases;
//     const term = search.toLowerCase();
//     return purchases.filter((p) =>
//       [p.bill_no, p.party_name, p.gst_no, p.total_amount, p.transport_name]
//         .filter(Boolean)
//         .some((v) => String(v).toLowerCase().includes(term))
//     );
//   }, [purchases, search]);

//   // 📅 Filter by date range
//   const filtered = useMemo(() => {
//     if (!filterByDate || (!fromDate && !toDate)) return searched;
//     const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
//     const to = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

//     return searched.filter((p) => {
//       if (!p.bill_date) return false;
//       const date = new Date(p.bill_date).getTime();
//       if (from && to) return date >= from && date <= to;
//       if (from) return date >= from;
//       if (to) return date <= to;
//       return true;
//     });
//   }, [searched, fromDate, toDate, filterByDate]);

//   const totalPages = useMemo(
//     () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
//     [filtered]
//   );

//   const currentPageRows = useMemo(() => {
//     const start = (page - 1) * PAGE_SIZE;
//     return filtered.slice(start, start + PAGE_SIZE);
//   }, [filtered, page]);

//   // Calculate totals with unit conversion
//   const {
//     totalPurchases,
//     totalAmount,
//     totalQuantityKg,
//     totalQuantityOriginal,
//   } = useMemo(() => {
//     return purchases.reduce(
//       (acc, purchase) => {
//         acc.totalPurchases += 1;
//         acc.totalAmount += Number(purchase.total_amount || 0);

//         // Sum quantities from items with unit conversion
//         if (purchase.items && Array.isArray(purchase.items)) {
//           purchase.items.forEach((item) => {
//             const quantity = Number(item.size || item.quantity || 0);
//             const unit = item.unit || "";
//             const unitDisplay = getUnitDisplay(unit);

//             // Convert to kg for unified calculation
//             const quantityInKg = convertToKg(quantity, unit);
//             acc.totalQuantityKg += quantityInKg;

//             // Store original quantity with unit for display
//             if (quantity > 0) {
//               acc.totalQuantityOriginal.push({
//                 quantity: quantity,
//                 unit: unitDisplay,
//                 quantityInKg: quantityInKg,
//               });
//             }
//           });
//         }

//         return acc;
//       },
//       {
//         totalPurchases: 0,
//         totalAmount: 0,
//         totalQuantityKg: 0,
//         totalQuantityOriginal: [],
//       }
//     );
//   }, [purchases]);

//   // Group quantities by unit for display
//   const quantitySummary = useMemo(() => {
//     const summary = {};

//     totalQuantityOriginal.forEach((item) => {
//       const unit = item.unit || "kg";
//       if (!summary[unit]) {
//         summary[unit] = {
//           total: 0,
//           inKg: 0,
//         };
//       }
//       summary[unit].total += item.quantity;
//       summary[unit].inKg += item.quantityInKg;
//     });

//     return summary;
//   }, [totalQuantityOriginal]);

//   const columns = [
//     {
//       field: "sl_no",
//       headerName: "Sl.No.",
//       width: 80,
//       sortable: false,
//       renderCell: (params) => {
//         const pageStart = (page - 1) * PAGE_SIZE;
//         const rowIndex = currentPageRows.findIndex(
//           (r) => r.id === params.row.id
//         );
//         return pageStart + rowIndex + 1;
//       },
//     },
//     {
//       field: "bill_no",
//       headerName: "Bill No",
//       flex: 1,
//       renderCell: (params) => (
//         <button
//           type="button"
//           onClick={() => setViewPurchaseId(params.row.id)}
//           className="text-blue-600 cursor-pointer underline text-left w-full truncate"
//           title={params.value}
//         >
//           {params.value || "-"}
//         </button>
//       ),
//     },
//     {
//       field: "party",
//       headerName: "Party Details",
//       flex: 1.2,
//       renderCell: (params) => {
//         const partyName = params.row.firm_name || params.row.farmer_name || "-";
//         const partyType = params.row.party_type;
//         const gstNo = params.row.gst_no;

//         return (
//           <div className="flex flex-col gap-1">
//             <div className="flex items-center gap-2">
//               <span className="truncate font-medium">{partyName}</span>
//               {partyType && (
//                 <Chip
//                   label={partyType}
//                   size="small"
//                   className={`text-xs ${
//                     partyType === "farmer"
//                       ? "bg-emerald-100 text-emerald-700"
//                       : "bg-blue-100 text-blue-700"
//                   }`}
//                 />
//               )}
//             </div>
//             {gstNo && (
//               <span className="text-xs text-gray-500 truncate">
//                 GST: {gstNo}
//               </span>
//             )}
//           </div>
//         );
//       },
//     },
//     {
//       field: "bill_date",
//       headerName: "Date",
//       width: 120,
//       renderCell: (params) =>
//         params.value
//           ? new Date(params.value).toLocaleDateString("en-IN")
//           : "N/A",
//     },
//     {
//       field: "quantity",
//       headerName: "Items",
//       width: 140,
//       renderCell: (params) => {
//         const itemCount = params.row.items?.length || 0;

//         return <span className="font-medium">{itemCount}</span>;
//       },
//     },

//     {
//       field: "total_amount",
//       headerName: "Total",
//       width: 130,
//       align: "right",
//       renderCell: (params) => (
//         <div className="text-right w-full">
//           <div className="font-bold text-green-700">₹{fx(params.value)}</div>
//           <div className="text-xs text-gray-500">Bill Total</div>
//         </div>
//       ),
//     },
//     {
//       field: "bill_img",
//       headerName: "Bill",
//       width: 80,
//       sortable: false,
//       renderCell: (params) =>
//         params.value ? (
//           <button
//             onClick={() => window.open(`${API_BASE}${params.value}`, "_blank")}
//             className="text-blue-600 underline cursor-pointer text-sm px-2 py-1 bg-blue-50 rounded hover:bg-blue-100"
//             title="View Bill Image"
//           >
//             View
//           </button>
//         ) : (
//           <span className="text-gray-400 text-sm px-2 py-1">No Bill</span>
//         ),
//     },
//     {
//       field: "actions",
//       headerName: "Actions",
//       width: 120,
//       sortable: false,
//       renderCell: (params) => (
//         <div className="flex gap-2">
//           <IconButton
//             color="primary"
//             size="small"
//             onClick={() => setViewPurchaseId(params.row.id)}
//             title="View Details"
//             className="bg-blue-50 hover:bg-blue-100"
//           >
//             <VisibilityIcon fontSize="small" />
//           </IconButton>
//           <IconButton
//             color="secondary"
//             size="small"
//             onClick={() => navigate(`/purchases/edit/${params.row.id}`)}
//             title="Edit Purchase"
//             className="bg-gray-50 hover:bg-gray-100"
//           >
//             <EditIcon fontSize="small" />
//           </IconButton>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="p-6 bg-white rounded-2xl shadow-md">
//       <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-800">Purchases</h2>
//           <p className="text-gray-600 mt-1">Manage all purchase transactions</p>
//         </div>

//         {/* Search Box */}
//         <div className="mt-4 md:mt-0">
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <svg
//                 className="h-5 w-5 text-gray-400"
//                 fill="currentColor"
//                 viewBox="0 0 20 20"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//             </div>
//             <input
//               type="text"
//               placeholder="Search by Bill No, Party, GST..."
//               value={search}
//               onChange={(e) => {
//                 setSearch(e.target.value);
//                 setPage(1);
//               }}
//               className="w-full md:w-80 border rounded-lg pl-10 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>
//         </div>
//       </div>

//       {/* 📅 Date Filter */}
//       <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
//         <div className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             id="filterByDate"
//             checked={filterByDate}
//             onChange={(e) => setFilterByDate(e.target.checked)}
//             className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//           />
//           <label
//             htmlFor="filterByDate"
//             className="text-sm font-medium text-gray-700"
//           >
//             Filter by Date Range
//           </label>
//         </div>

//         <div>
//           <label className="block text-sm text-gray-700 mb-1">From Date</label>
//           <input
//             type="date"
//             value={fromDate}
//             onChange={(e) => setFromDate(e.target.value)}
//             className="border rounded-lg p-2 w-full"
//             disabled={!filterByDate}
//           />
//         </div>
//         <div>
//           <label className="block text-sm text-gray-700 mb-1">To Date</label>
//           <input
//             type="date"
//             value={toDate}
//             onChange={(e) => setToDate(e.target.value)}
//             className="border rounded-lg p-2 w-full"
//             disabled={!filterByDate}
//           />
//         </div>
//         <button
//           onClick={() => {
//             setPage(1);
//             setFilterByDate(true);
//           }}
//           className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
//           disabled={!filterByDate}
//         >
//           Apply Filter
//         </button>
//         <button
//           onClick={() => {
//             setFromDate("");
//             setToDate("");
//             setFilterByDate(false);
//             setPage(1);
//           }}
//           className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
//         >
//           Clear All
//         </button>
//       </div>

//       {/* Stat cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//         <div className="bg-gradient-to-br from-blue-100 via-blue-200 to-blue-50 rounded-xl shadow p-5 border border-blue-200">
//           <div className="flex items-center justify-between">
//             <p className="text-sm font-medium text-blue-900">Total Purchases</p>
//             <div className="text-blue-600 bg-blue-100 p-2 rounded-full">
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
//               </svg>
//             </div>
//           </div>
//           <p className="text-2xl font-bold text-blue-900 mt-3">
//             {totalPurchases}
//           </p>
//           <p className="text-sm text-blue-700 mt-1">Purchase transactions</p>
//         </div>

//         <div className="bg-gradient-to-br from-green-100 via-green-200 to-green-50 rounded-xl shadow p-5 border border-green-200">
//           <div className="flex items-center justify-between">
//             <p className="text-sm font-medium text-green-900">Total Quantity</p>
//             <div className="text-green-600 bg-green-100 p-2 rounded-full">
//               <ScaleIcon />
//             </div>
//           </div>
//           <p className="text-2xl font-bold text-green-900 mt-3">
//             {fx(totalQuantityKg)} kg
//           </p>
//           <div className="text-sm text-green-700 mt-1">
//             {Object.entries(quantitySummary).map(([unit, data], idx) => (
//               <div key={idx} className="flex justify-between">
//                 <span>{unit}:</span>
//                 <span className="font-medium">{fx(data.total)}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="bg-gradient-to-br from-purple-100 via-purple-200 to-purple-50 rounded-xl shadow p-5 border border-purple-200">
//           <div className="flex items-center justify-between">
//             <p className="text-sm font-medium text-purple-900">Total Amount</p>
//             <div className="text-purple-600 bg-purple-100 p-2 rounded-full font-bold">
//               ₹
//             </div>
//           </div>
//           <p className="text-2xl font-bold text-purple-900 mt-3">
//             ₹{fx(totalAmount)}
//           </p>
//           <p className="text-sm text-purple-700 mt-1">Total purchase value</p>
//         </div>

//         <div className="bg-gradient-to-br from-amber-100 via-amber-200 to-amber-50 rounded-xl shadow p-5 border border-amber-200">
//           <div className="flex items-center justify-between">
//             <p className="text-sm font-medium text-amber-900">
//               Showing Records
//             </p>
//             <div className="text-amber-600 bg-amber-100 p-2 rounded-full">
//               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                 <path
//                   fillRule="evenodd"
//                   d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zm0 4a1 1 0 000 2h5a1 1 0 000-2H3zm0 4a1 1 0 100 2h5a1 1 0 100-2H3zm0 4a1 1 0 100 2h11a1 1 0 100-2H3z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//             </div>
//           </div>
//           <p className="text-2xl font-bold text-amber-900 mt-3">
//             {filtered.length}
//           </p>
//           <p className="text-sm text-amber-700 mt-1">
//             Page {page} of {totalPages}
//           </p>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-xl shadow border overflow-hidden mb-6">
//         <div className="p-4 border-b bg-gray-50">
//           <h3 className="font-semibold text-gray-800">Purchases List</h3>
//           <p className="text-sm text-gray-600 mt-1">
//             Showing {currentPageRows.length} purchases on this page
//           </p>
//         </div>
//         <DataTable
//           rows={currentPageRows}
//           columns={columns}
//           pageSize={PAGE_SIZE}
//           checkboxSelection={false}
//           getRowId={(row) => row?.id}
//           onPageChange={(newPage) => setPage(newPage + 1)}
//           page={page - 1}
//           rowCount={filtered.length}
//           className="min-h-[400px]"
//         />
//       </div>

//       {/* Pagination */}
//       <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 p-4 bg-gray-50 rounded-xl">
//         <div className="text-sm text-gray-600">
//           Showing{" "}
//           <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
//           <span className="font-medium">
//             {Math.min(page * PAGE_SIZE, filtered.length)}
//           </span>{" "}
//           of <span className="font-medium">{filtered.length}</span> entries
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
//             disabled={page === 1}
//             onClick={() => setPage((p) => Math.max(1, p - 1))}
//           >
//             Previous
//           </button>

//           <div className="flex items-center gap-1">
//             {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//               let pageNum;
//               if (totalPages <= 5) {
//                 pageNum = i + 1;
//               } else if (page <= 3) {
//                 pageNum = i + 1;
//               } else if (page > totalPages - 2) {
//                 pageNum = totalPages - 4 + i;
//               } else {
//                 pageNum = page - 2 + i;
//               }

//               return (
//                 <button
//                   key={pageNum}
//                   className={`px-3 py-1 rounded-lg transition ${
//                     page === pageNum
//                       ? "bg-blue-600 text-white font-medium"
//                       : "bg-gray-200 hover:bg-gray-300"
//                   }`}
//                   onClick={() => setPage(pageNum)}
//                 >
//                   {pageNum}
//                 </button>
//               );
//             })}
//           </div>

//           <button
//             className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
//             disabled={page === totalPages}
//             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//           >
//             Next
//           </button>
//         </div>
//       </div>

//       {viewPurchaseId && (
//         <PurchaseDetailsPanel
//           id={viewPurchaseId}
//           onClose={() => setViewPurchaseId(null)}
//         />
//       )}
//     </div>
//   );
// }
