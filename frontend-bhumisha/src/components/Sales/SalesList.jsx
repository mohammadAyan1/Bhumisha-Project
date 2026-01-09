// // src/pages/sales/SalesList.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { IconButton } from "@mui/material";
// import EditIcon from "@mui/icons-material/Edit";
// import VisibilityIcon from "@mui/icons-material/Visibility";
// import DeleteIcon from "@mui/icons-material/Delete";
// import ReceiptIcon from "@mui/icons-material/Receipt";
// import RefreshIcon from "@mui/icons-material/Refresh";
// import DataTable from "../DataTable/DataTable";
// import salesAPI from "../../axios/salesAPI";
// import { toast } from "react-toastify";
// import { encryptInvoicePayload } from "../../utils/invoiceCrypto";

// const fx = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));
// // const fmtDate = (d) => {
// //   if (!d) return "-";
// //   const dt = typeof d === "string" ? d : String(d);
// //   const t = new Date(dt);
// //   return isNaN(t.getTime()) ? dt : t.toLocaleDateString();
// // };

// export default function SalesList({ onEdit, onCreate, onDetails }) {
//   const formatDateDMY = (dateTime) => {
//     if (!dateTime) return "—";

//     // Convert "2025-12-17 12:00:00" → "2025-12-17T12:00:00"
//     const normalized = dateTime.replace(" ", "T");

//     const d = new Date(normalized);
//     if (isNaN(d)) return "—";

//     const day = String(d.getDate()).padStart(2, "0");
//     const month = String(d.getMonth() + 1).padStart(2, "0");
//     const year = d.getFullYear();

//     return `${day}/${month}/${year}`;
//   };

//   const [companyCodeFromLocalStorage, setCompanyCodeFromLocalStorage] =
//     useState("");

//   useEffect(() => {
//     const company_code = localStorage.getItem("company_code");
//     setCompanyCodeFromLocalStorage(company_code);
//   }, [companyCodeFromLocalStorage]);

//   const navigate = useNavigate();
//   const [rows, setRows] = useState([]);
//   const [q, setQ] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const [partyType, setPartyType] = useState("all"); // all | customer | vendor | farmer
//   const PAGE_SIZE = 10;

//   const load = async () => {
//     setLoading(true);
//     try {
//       const { data } = await salesAPI.getAll();
//       setRows(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error("Failed to load sales", err);
//       toast.error("Failed to load sales");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const filtered = useMemo(() => {
//     const t = q.toLowerCase();
//     return rows
//       .filter((r) =>
//         partyType === "all"
//           ? true
//           : String(r.party_type).toLowerCase() === partyType
//       )
//       .filter((r) =>
//         [r.bill_no, r.party_name, r.payment_status, r.payment_method, r.status]
//           .filter(Boolean)
//           .some((v) => String(v).toLowerCase().includes(t))
//       );
//   }, [rows, q, partyType]);

//   const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
//   const currentPageRows = filtered.slice(
//     (page - 1) * PAGE_SIZE,
//     (page - 1) * PAGE_SIZE + PAGE_SIZE
//   );

//   const totalSales = filtered.length;
//   const totalAmount = filtered.reduce(
//     (s, r) => s + Number(r.total_amount || 0),
//     0
//   );

//   const onDelete = async (id) => {
//     if (!confirm("Delete this sale?")) return;
//     setLoading(true);
//     try {
//       await salesAPI.delete(id);
//       toast.success("Sale deleted");
//       await load();
//     } catch (e) {
//       toast.error(e?.response?.data?.error || "Failed to delete");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onEditClick = async (sale) => {
//     try {
//       const { data } = await salesAPI.getById(sale.id);
//       onEdit?.(data);
//     } catch (e) {
//       console.error("Failed to load sale details", e);
//       toast.error("Failed to load sale details");
//     }
//   };

//   const columns = [
//     {
//       field: "sl_no",
//       headerName: "SR.No.",
//       width: 80,
//       sortable: false,
//       renderCell: (params) => {
//         const idx = currentPageRows.findIndex((r) => r.id === params.row.id);
//         return (page - 1) * PAGE_SIZE + idx + 1;
//       },
//     },
//     {
//       field: "bill_no",
//       headerName: "Bill No",
//       flex: 1,
//       renderCell: (params) => (
//         <button
//           type="button"
//           onClick={() => onDetails?.(params.row.id)}
//           className="text-blue-600 underline text-left w-full truncate"
//           title={params.value}
//         >
//           {params.value || "-"}
//         </button>
//       ),
//     },
//     {
//       field: "party_name",
//       headerName: "Party",
//       flex: 1.2,
//       renderCell: (params) => {
//         const name = params.row.party_name || params.row.customer_name || "-";
//         const type = params.row.party_type; // 'customer' | 'vendor' | 'farmer'
//         return (
//           <div className="flex items-center gap-2 min-w-0">
//             <span className="truncate">{name}</span>
//             {type ? (
//               <span
//                 className={`text-[10px] px-2 py-0.5 rounded whitespace-nowrap ${
//                   type === "farmer"
//                     ? "bg-emerald-100 text-emerald-700"
//                     : type === "vendor"
//                     ? "bg-blue-100 text-blue-700"
//                     : "bg-purple-100 text-purple-700"
//                 }`}
//                 title={type}
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
//       width: 160,
//       renderCell: (p) => formatDateDMY(p.row?.bill_date || p.row?.created_at),
//     },
//     {
//       field: "total_amount",
//       headerName: "Amount",
//       width: 120,
//       renderCell: (p) => fx(p.value),
//     },
//     {
//       field: "payment_status",
//       headerName: "Payment",
//       width: 120,
//       renderCell: (p) => (
//         <span
//           className={`px-2 py-1 rounded-full text-white ${
//             String(p.value).toLowerCase() === "paid"
//               ? "bg-green-500"
//               : String(p.value).toLowerCase() === "partial"
//               ? "bg-orange-500"
//               : "bg-gray-500"
//           }`}
//         >
//           {p.value}
//         </span>
//       ),
//     },
//     { field: "payment_method", headerName: "Method", width: 120 },
//     { field: "status", headerName: "Status", width: 120 },
//     {
//       field: "actions",
//       headerName: "Actions",
//       width: 200,
//       sortable: false,
//       renderCell: (params) => (
//         <div className="flex gap-1 text-md overflow-x-auto">
//           <IconButton
//             title="View"
//             color="primary"
//             onClick={() => onDetails?.(params.row.id)}
//           >
//             <VisibilityIcon />
//           </IconButton>
//           <IconButton
//             title="Edit"
//             color="secondary"
//             onClick={() => onEditClick(params.row)}
//           >
//             <EditIcon />
//           </IconButton>

//           <IconButton
//             title="Delete"
//             color="error"
//             onClick={() => onDelete(params.row.id)}
//           >
//             <DeleteIcon />
//           </IconButton>

//           {/* <IconButton
//             title="Invoice"
//             color="info"
//             onClick={() => navigate(`/sales-invoice/${params.row.id}`)}
//           >
//             <ReceiptIcon />
//           </IconButton> */}

//           <IconButton
//             title="Invoice"
//             color="info"
//             onClick={() => {
//               const token = encryptInvoicePayload({
//                 id: params?.row?.id,
//                 companyCode: companyCodeFromLocalStorage,
//                 auto: params?.row?.id,
//               });

//               navigate(`/sales-invoice/${token}`);
//             }}
//           >
//             <ReceiptIcon />
//           </IconButton>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="p-6 bg-white rounded-2xl shadow-md ">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-2xl font-bold text-gray-800">Sales</h2>
//         <div className="flex items-center gap-3">
//           <div className="flex items-center gap-2">
//             <select
//               className="border rounded px-2 py-2"
//               value={partyType}
//               onChange={(e) => {
//                 setPartyType(e.target.value);
//                 setPage(1);
//               }}
//               title="Filter by party type"
//             >
//               <option value="all">All</option>
//               <option value="customer">Customer</option>
//               <option value="vendor">Vendor</option>
//               <option value="farmer">Farmer</option>
//             </select>
//             <input
//               className="border rounded px-3 py-2 w-64"
//               placeholder="Search by bill, party, status..."
//               value={q}
//               onChange={(e) => {
//                 setQ(e.target.value);
//                 setPage(1);
//               }}
//             />
//           </div>
//           <button
//             className="px-4 py-2 bg-blue-600 text-white rounded"
//             onClick={onCreate}
//           >
//             Create
//           </button>
//           <button
//             className="px-3 py-2 bg-gray-100 rounded border hover:bg-gray-200"
//             onClick={load}
//             title="Refresh"
//           >
//             <RefreshIcon fontSize="small" />
//           </button>
//         </div>
//       </div>

//       {/* Stat cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//         <div className="bg-gradient-to-br from-blue-100 via-blue-200 to-blue-50 rounded-lg shadow p-4 border border-blue-200">
//           <p className="text-sm font-medium text-blue-900">Filtered Sales</p>
//           <p className="text-2xl font-bold text-blue-900 mt-2">{totalSales}</p>
//         </div>
//         <div className="bg-gradient-to-br from-green-100 via-green-200 to-green-50 rounded-lg shadow p-4 border border-green-200">
//           <p className="text-sm font-medium text-green-900">Total Amount</p>
//           <p className="text-2xl font-bold text-green-900 mt-2">
//             {fx(totalAmount)}
//           </p>
//         </div>
//         <div className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-50 rounded-lg shadow p-4 border border-gray-200">
//           <p className="text-sm font-medium text-gray-900">All Records</p>
//           <p className="text-2xl font-bold text-gray-900 mt-2">{rows.length}</p>
//         </div>
//       </div>

//       <div className="bg-white rounded shadow overflow-x-auto mb-6">
//         {loading ? (
//           <div className="p-6 text-center text-gray-600">Loading sales...</div>
//         ) : (
//           <DataTable
//             rows={currentPageRows}
//             columns={columns}
//             pageSize={PAGE_SIZE}
//             checkboxSelection={false}
//             title="Sales List"
//             getRowId={(r) => r?.id}
//           />
//         )}
//       </div>

//       {/* Pagination (fallback) */}
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
//     </div>
//   );
// }

// src/pages/sales/SalesList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptIcon from "@mui/icons-material/Receipt";
import RefreshIcon from "@mui/icons-material/Refresh";
import DataTable from "../DataTable/DataTable";
import salesAPI from "../../axios/salesAPI";
import { toast } from "react-toastify";
import { encryptInvoicePayload } from "../../utils/invoiceCrypto";

const fx = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));

export default function SalesList({ onEdit, onCreate, onDetails }) {
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

  const [companyCodeFromLocalStorage, setCompanyCodeFromLocalStorage] =
    useState("");

  useEffect(() => {
    const company_code = localStorage.getItem("company_code");
    setCompanyCodeFromLocalStorage(company_code);
  }, [companyCodeFromLocalStorage]);

  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Changed from constant to state
  const [partyType, setPartyType] = useState("all"); // all | customer | vendor | farmer

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await salesAPI.getAll();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load sales", err);
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return rows
      .filter((r) =>
        partyType === "all"
          ? true
          : String(r.party_type).toLowerCase() === partyType
      )
      .filter((r) =>
        [r.bill_no, r.party_name, r.payment_status, r.payment_method, r.status]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(t))
      );
  }, [rows, q, partyType]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  // Ensure current page is valid when pageSize changes
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, pageSize]);

  const currentPageRows = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalSales = filtered.length;
  const totalAmount = filtered.reduce(
    (s, r) => s + Number(r.total_amount || 0),
    0
  );

  const onDelete = async (id) => {
    if (!confirm("Delete this sale?")) return;
    setLoading(true);
    try {
      await salesAPI.delete(id);
      toast.success("Sale deleted");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const onEditClick = async (sale) => {
    try {
      const { data } = await salesAPI.getById(sale.id);
      onEdit?.(data);
    } catch (e) {
      console.error("Failed to load sale details", e);
      toast.error("Failed to load sale details");
    }
  };

  const columns = [
    {
      field: "sl_no",
      headerName: "SR.No.",
      width: 10,
      sortable: false,
      renderCell: (params) => {
        const idx = filtered.findIndex((r) => r.id === params.row.id);
        return idx + 1; // Global index instead of page index
      },
    },
    {
      field: "bill_no",
      headerName: "Bill No",
      // flex: 1,
      width:120,
      renderCell: (params) => (
        <button
          type="button"
          onClick={() => onDetails?.(params.row.id)}
          className="text-blue-600 underline text-left w-full truncate"
          title={params.value}
        >
          {params.value || "-"}
        </button>
      ),
    },
    {
      field: "party_name",
      headerName: "Party",
      // flex: 1.2,
      width: 200,
      renderCell: (params) => {
        const name = params.row.party_name || params.row.customer_name || "-";
        const type = params.row.party_type; // 'customer' | 'vendor' | 'farmer'
        return (
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate">{name}</span>
            {type ? (
              <span
                className={`text-[10px] px-2 py-0.5 rounded whitespace-nowrap ${
                  type === "farmer"
                    ? "bg-emerald-100 text-emerald-700"
                    : type === "vendor"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
                title={type}
              >
                {type}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      field: "bill_date",
      headerName: "Date",
      width: 160,
      renderCell: (p) => formatDateDMY(p.row?.bill_date || p.row?.created_at),
    },
    {
      field: "total_amount",
      headerName: "Amount",
      width: 120,
      renderCell: (p) => fx(p.value),
    },
    {
      field: "payment_status",
      headerName: "Payment",
      width: 120,
      renderCell: (p) => (
        <span
          className={`px-2 py-1 rounded-full text-white ${
            String(p.value).toLowerCase() === "paid"
              ? "bg-green-500"
              : String(p.value).toLowerCase() === "partial"
              ? "bg-orange-500"
              : "bg-gray-500"
          }`}
        >
          {p.value}
        </span>
      ),
    },
    { field: "payment_method", headerName: "Method", width: 120 },
    { field: "status", headerName: "Status", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <div className="flex gap-1 text-md overflow-x-auto">
          <IconButton
            title="View"
            color="primary"
            onClick={() => onDetails?.(params.row.id)}
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            title="Edit"
            color="secondary"
            onClick={() => onEditClick(params.row)}
          >
            <EditIcon />
          </IconButton>

          <IconButton
            title="Delete"
            color="error"
            onClick={() => onDelete(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>

          <IconButton
            title="Invoice"
            color="info"
            onClick={() => {
              const token = encryptInvoicePayload({
                id: params?.row?.id,
                companyCode: companyCodeFromLocalStorage,
                auto: params?.row?.id,
              });

              navigate(`/sales-invoice/${token}`);
            }}
          >
            <ReceiptIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  // Handler for page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  // Handler for page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md ">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Sales</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-2 py-2"
              value={partyType}
              onChange={(e) => {
                setPartyType(e.target.value);
                setPage(1);
              }}
              title="Filter by party type"
            >
              <option value="all">All</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="farmer">Farmer</option>
            </select>
            <input
              className="border rounded px-3 py-2 w-64"
              placeholder="Search by bill, party, status..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={onCreate}
          >
            Create
          </button>
          <button
            className="px-3 py-2 bg-gray-100 rounded border hover:bg-gray-200"
            onClick={load}
            title="Refresh"
          >
            <RefreshIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-100 via-blue-200 to-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <p className="text-sm font-medium text-blue-900">Filtered Sales</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">{totalSales}</p>
        </div>
        <div className="bg-gradient-to-br from-green-100 via-green-200 to-green-50 rounded-lg shadow p-4 border border-green-200">
          <p className="text-sm font-medium text-green-900">Total Amount</p>
          <p className="text-2xl font-bold text-green-900 mt-2">
            {fx(totalAmount)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-50 rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-900">All Records</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{rows.length}</p>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto mb-6">
        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading sales...</div>
        ) : (
          <DataTable
            rows={currentPageRows}
            columns={columns}
            pageSize={pageSize}
            checkboxSelection={false}
            title="Sales List"
            getRowId={(r) => r?.id}
            // If your DataTable component supports pagination props, add them:
            // page={page - 1} // MUI DataTable uses 0-based indexing
            // onPageChange={(newPage) => handlePageChange(newPage + 1)}
            // onPageSizeChange={handlePageSizeChange}
            // rowCount={totalRows}
          />
        )}
      </div>

      {/* Enhanced Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            {[5, 10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, totalRows)} of {totalRows} entries
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {(() => {
              const buttons = [];
              const maxVisible = 5;
              let start = Math.max(1, page - Math.floor(maxVisible / 2));
              let end = Math.min(totalPages, start + maxVisible - 1);

              // Adjust start if we're near the end
              if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
              }

              // Show first page button if needed
              if (start > 1) {
                buttons.push(
                  <button
                    key={1}
                    className={`px-3 py-1.5 rounded text-sm ${
                      1 === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
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
                    className={`px-3 py-1.5 rounded text-sm ${
                      i === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
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
                    className={`px-3 py-1.5 rounded text-sm ${
                      totalPages === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
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
            className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
