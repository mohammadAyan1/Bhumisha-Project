import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFarmers,
  deleteFarmer,
  updateFarmerStatus,
} from "../../features/farmers/farmerSlice";
import DataTable from "../DataTable/DataTable";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import { Building2, Users, UserCheck, UserX } from "lucide-react";
import farmersAPI from "../../axios/farmerAPI";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

export default function FarmerList({ onEdit }) {
  const dispatch = useDispatch();
  const { list: farmers, loading } = useSelector((state) => state.farmers);

  // Statement modal state
  const [showStatement, setShowStatement] = useState(false);
  const [statementRows, setStatementRows] = useState([]);
  const [statementTotals, setStatementTotals] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [activeFarmer, setActiveFarmer] = useState(null);
  const [stFrom, setStFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [stTo, setStTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [stPage, setStPage] = useState(1);
  const [stLimit, setStLimit] = useState(50);
  const [stSort, setStSort] = useState("asc");

  // Invoice details modal state
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Toggle state for active/inactive farmers
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Changed from pageSize to rowsPerPage

  useEffect(() => {
    dispatch(fetchFarmers());
  }, [dispatch]);

  // Filter farmers based on showInactive toggle
  const filteredFarmers = useMemo(() => {
    // First filter by active/inactive status
    const statusFiltered = showInactive
      ? farmers.filter(
          (f) => (f.status || "").toString().toLowerCase() === "inactive"
        )
      : farmers.filter(
          (f) => (f.status || "").toString().toLowerCase() === "active"
        );

    // Then apply search filter
    if (!search) return statusFiltered;
    const term = search.toLowerCase();
    return statusFiltered.filter((f) =>
      [
        f.name,
        f.father_name,
        f.district,
        f.tehsil,
        f.village,
        f.contact_number,
        f.khasara_number,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(term))
    );
  }, [farmers, search, showInactive]);

  // Calculate pagination
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredFarmers.length / rowsPerPage));
  }, [filteredFarmers, rowsPerPage]);

  const currentPageFarmers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredFarmers.slice(start, start + rowsPerPage);
  }, [filteredFarmers, page, rowsPerPage]);

  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    const value = Number(e.target.value);
    setRowsPerPage(value);
    setPage(1); // Reset to first page when changing rows per page
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this farmer?")) {
      dispatch(deleteFarmer(id));
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const normalizedCurrentStatus = (currentStatus || "")
      .toString()
      .toLowerCase();
    const newStatus =
      normalizedCurrentStatus === "active" ? "inactive" : "active";
    await dispatch(updateFarmerStatus({ id, status: newStatus }));
    dispatch(fetchFarmers());
  };

  // Open statement modal
  const openStatement = useCallback(
    async (farmer) => {
      setActiveFarmer(farmer);
      setShowStatement(true);
      setStatementLoading(true);
      try {
        const res = await farmersAPI.getStatement(farmer.id, {
          from: stFrom,
          to: stTo,
          page: stPage,
          limit: stLimit,
          sort: stSort,
        });
        setStatementRows(res.data.rows || []);
        setStatementTotals(res.data.totals || null);
      } catch (err) {
        toast.error("Failed to load statement");
        console.error(err);
      } finally {
        setStatementLoading(false);
      }
    },
    [stFrom, stTo, stPage, stLimit, stSort]
  );

  // Close statement modal
  const closeStatement = useCallback(() => {
    setShowStatement(false);
    setStatementRows([]);
    setStatementTotals(null);
    setActiveFarmer(null);
  }, []);

  // Function to export statement data to Excel
  const exportToExcel = useCallback(() => {
    if (!statementRows || statementRows.length === 0) {
      toast.warning("No data to export");
      return;
    }

    try {
      // Prepare data for Excel - filter out Payment rows as in the UI
      const exportData = statementRows
        .filter(
          (row) =>
            !(
              row.tx_type === "Payment to Farmer" ||
              row.tx_type === "Payment from Farmer"
            )
        )
        .map((row, index) => {
          // Calculate running balance for each row
          const filteredRows = statementRows.filter(
            (r) =>
              !(
                r.tx_type === "Payment to Farmer" ||
                r.tx_type === "Payment from Farmer"
              )
          );
          const currentIndex = filteredRows.findIndex(
            (r) => r.invoice_id === row.invoice_id
          );

          let balance = 0;
          for (let i = 0; i <= currentIndex; i++) {
            const item = filteredRows[i];
            if (item?.tx_type === "Purchase") {
              balance -= Number(item.amount || 0);
            } else {
              balance += Number(item.amount || 0);
            }
          }

          return {
            "S.No.": index + 1,
            Date: new Date(row.tx_datetime).toLocaleDateString(),
            Type: row.tx_type,
            "Reference No": row.ref_no || "",
            Description: row.note || "",
            Amount: Number(Math.abs(row.net_effect) || 0).toFixed(2),
            Effect: row.net_effect > 0 ? "Credit" : "Debit",
            Balance: Number(balance || 0).toFixed(2),
          };
        });

      // Add summary data
      const summaryData = [
        {},
        {
          Date: "SUMMARY",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: "",
          Effect: "",
          Balance: "",
        },
        {
          Date: "Opening Balance",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: "",
          Effect: "",
          Balance: statementTotals?.opening_balance || 0,
        },
        {
          Date: "Total Purchase Amount",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: statementTotals?.total_purchase_amount || 0,
          Effect: "",
          Balance: "",
        },
        {
          Date: "Total Sale Amount",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: statementTotals?.total_sale_amount || 0,
          Effect: "",
          Balance: "",
        },
        {
          Date: "Total Payments to Farmer",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: statementTotals?.total_payments_to_farmer || 0,
          Effect: "",
          Balance: "",
        },
        {
          Date: "Total Payments from Farmer",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: statementTotals?.total_payments_from_farmer || 0,
          Effect: "",
          Balance: "",
        },
        {
          Date: "Total Purchase Transport",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: statementTotals?.total_purchase_transport_amount || 0,
          Effect: "",
          Balance: "",
        },
        {
          Date: "Total Sale Transport",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: statementTotals?.total_sale_transport_amount || 0,
          Effect: "",
          Balance: "",
        },
        {
          Date: "Outstanding Balance",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: "",
          Effect: "",
          Balance: statementTotals?.outstanding_balance || 0,
        },
        {},
        {
          Date: "Export Date",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: new Date().toLocaleDateString(),
          Effect: "",
          Balance: "",
        },
      ];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const wsData = [...exportData, ...summaryData];
      const ws = XLSX.utils.json_to_sheet(wsData, { skipHeader: false });

      // Set column widths
      const wscols = [
        { wch: 8 }, // S.No.
        { wch: 12 }, // Date
        { wch: 15 }, // Type
        { wch: 20 }, // Ref No
        { wch: 30 }, // Description
        { wch: 15 }, // Amount
        { wch: 10 }, // Effect
        { wch: 15 }, // Balance
      ];
      ws["!cols"] = wscols;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Statement");

      // Generate file name
      const farmerName = activeFarmer?.name || "Farmer";
      const fileName = `${farmerName.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_Statement_${stFrom}_to_${stTo}.xlsx`;

      // Save the file
      XLSX.writeFile(wb, fileName);

      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export Excel file");
    }
  }, [statementRows, statementTotals, activeFarmer, stFrom, stTo]);

  // Open invoice details
  const openInvoiceDetails = async (invoiceId, type, farmerId) => {
    setInvoiceLoading(true);
    try {
      const res = await farmersAPI.getInvoiceDetails(farmerId, invoiceId, type);
      setInvoiceDetails(res.data);
      setShowInvoiceDetails(true);
    } catch (err) {
      toast.error("Failed to load invoice details");
      console.error(err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Close invoice details
  const closeInvoiceDetails = () => {
    setShowInvoiceDetails(false);
    setInvoiceDetails(null);
  };

  const totalFarmers = farmers.length;
  const activeFarmers = farmers.filter(
    (f) => (f.status || "").toString().toLowerCase() === "active"
  ).length;
  const inactiveFarmers = totalFarmers - activeFarmers;

  const columns = [
    {
      field: "sl_no",
      headerName: "S.No.",
      width: 80,
      sortable: false,
      renderCell: (params) => {
        const rowIndex = currentPageFarmers.findIndex(
          (farmer) => farmer.id === params.row.id
        );
        const serialNumber = (page - 1) * rowsPerPage + rowIndex + 1;
        return serialNumber;
      },
    },
    {
      field: "name",
      headerName: "Name",
      width: 220,
      renderCell: (params) => (
        <button
          type="button"
          onClick={() => openStatement(params.row)}
          className="text-blue-600 underline hover:text-blue-800"
          title="View statement"
        >
          {params.value}
        </button>
      ),
    },
    { field: "father_name", headerName: "Father Name", flex: 1 },
    { field: "district", headerName: "District", flex: 1 },
    { field: "tehsil", headerName: "Tehsil", flex: 1 },
    { field: "patwari_halka", headerName: "Patwari Halka", flex: 1 },
    { field: "village", headerName: "Village", flex: 1 },
    { field: "contact_number", headerName: "Contact", flex: 1 },
    { field: "khasara_number", headerName: "Khasara No.", flex: 1 },
    {
      field: "balance",
      headerName: "Balance",
      width: 140,
      renderCell: (params) => {
        const bal = Number(params.row.balance ?? 0);
        const min = Number(params.row.min_balance ?? 5000);
        const high = bal > min;
        return (
          <span
            className={high ? "text-red-600 font-semibold" : "text-gray-800"}
          >
            {bal.toFixed(2)}
          </span>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <div
          onClick={() => handleStatusToggle(params.row.id, params.value)}
          className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-all duration-300 shadow-md ${
            (params.value || "").toString().toLowerCase() === "active"
              ? "bg-green-500"
              : "bg-gray-300"
          }`}
          title={`Click to ${
            (params.value || "").toString().toLowerCase() === "active"
              ? "deactivate"
              : "activate"
          }`}
        >
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 shadow-lg border border-gray-200 ${
              (params.value || "").toString().toLowerCase() === "active"
                ? "translate-x-6"
                : "translate-x-1"
            }`}
          />
        </div>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      width: 120,
      renderCell: (params) => (
        <div className="flex gap-2">
          <IconButton color="primary" onClick={() => onEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) return <p>Loading farmers...</p>;

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Farmers</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-100 via-blue-200 to-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">Total Farmers</p>
            <Users size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            {totalFarmers}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-100 via-green-200 to-green-50 rounded-lg shadow p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-900">Active</p>
            <UserCheck size={18} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900 mt-2">
            {activeFarmers}
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-50 rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">Inactive</p>
            <UserX size={18} className="text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {inactiveFarmers}
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
            ({filteredFarmers.length} farmers)
          </p>
        </div>
      </div>

      {/* Search and Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, father name, village, contact..."
            className="border rounded px-3 py-2 w-full max-w-md"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Toggle Button */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            Show Inactive Farmers
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
              showInactive ? "Show active farmers" : "Show inactive farmers"
            }
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                showInactive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Info banner when showing inactive farmers */}
      {showInactive && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
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
              Showing inactive farmers only. To activate a farmer, click on its
              status toggle.
            </p>
          </div>
        </div>
      )}

      {/* DataGrid */}
      <div className="bg-white rounded shadow overflow-x-auto mb-6">
        <DataTable
          rows={currentPageFarmers}
          columns={columns}
          pageSize={rowsPerPage}
          title="Farmers List"
          getRowId={(row) => row?.id ?? row?.farmer_id ?? row?._id}
        />
      </div>

      {/* Pagination and Rows per page selector */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Pagination */}
        {filteredFarmers.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Showing {(page - 1) * rowsPerPage + 1} to{" "}
              {Math.min(page * rowsPerPage, filteredFarmers.length)} of{" "}
              {filteredFarmers.length} farmers
            </span>
            <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>

      {/* Statement Modal */}
      {showStatement && activeFarmer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[1000px] max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Statement - {activeFarmer.name}
                </h2>
                <p className="text-gray-600 text-sm">
                  Period: {stFrom} to {stTo}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Excel Export Button */}
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Export to Excel"
                >
                  <DownloadIcon />
                  Export Excel
                </button>
                <button
                  onClick={closeStatement}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6 flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={stFrom}
                  onChange={(e) => setStFrom(e.target.value)}
                  className="border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={stTo}
                  onChange={(e) => setStTo(e.target.value)}
                  className="border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limit
                </label>
                <select
                  value={stLimit}
                  onChange={(e) => setStLimit(Number(e.target.value))}
                  className="border rounded px-3 py-2"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => openStatement(activeFarmer)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Totals Summary */}
            {statementTotals && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Opening Balance</p>
                  <p className="text-xl font-bold text-blue-900">
                    ₹{Number(statementTotals.opening_balance || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Total Payment to Farmer
                  </p>
                  <p className="text-xl font-bold text-blue-900">
                    ₹
                    {Number(
                      statementTotals.total_payments_to_farmer || 0
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Total Payment From Farmer
                  </p>
                  <p className="text-xl font-bold text-blue-900">
                    ₹
                    {Number(
                      statementTotals.total_payments_from_farmer || 0
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Total Sales Transport Amount
                  </p>
                  <p className="text-xl font-bold text-blue-900">
                    ₹
                    {Number(
                      statementTotals.total_sale_transport_amount || 0
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Total Purchase Transport Amount
                  </p>
                  <p className="text-xl font-bold text-blue-900">
                    ₹
                    {Number(
                      statementTotals.total_purchase_transport_amount || 0
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">
                    Total Purchase Invoices
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {statementTotals.total_purchase_invoices || 0}
                  </p>
                  <p className="text-sm">
                    Amount: ₹
                    {Number(statementTotals.total_purchase_amount || 0).toFixed(
                      2
                    )}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600">Total Sale Invoices</p>
                  <p className="text-xl font-bold text-purple-900">
                    {statementTotals.total_sale_invoices || 0}
                  </p>
                  <p className="text-sm">
                    Amount: ₹
                    {Number(statementTotals.total_sale_amount || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">Outstanding Balance</p>
                  <p className="text-xl font-bold text-red-900">
                    ₹
                    {Number(statementTotals.outstanding_balance || 0).toFixed(
                      2
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            {statementLoading ? (
              <p>Loading transactions...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border-b text-left">Date</th>
                      <th className="px-4 py-2 border-b text-left">Type</th>
                      <th className="px-4 py-2 border-b text-left">Ref No</th>
                      <th className="px-4 py-2 border-b text-left">
                        Description
                      </th>
                      <th className="px-4 py-2 border-b text-right">Amount</th>
                      <th className="px-4 py-2 border-b text-right">Balance</th>
                      <th className="px-4 py-2 border-b text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementRows
                      .filter(
                        (row) =>
                          !(
                            row.tx_type === "Payment to Farmer" ||
                            row.tx_type === "Payment from Farmer"
                          )
                      )
                      .map((row, index, filteredRows) => {
                        // Calculate running balance
                        let balance = 0;
                        for (let i = 0; i <= index; i++) {
                          const item = filteredRows[i];
                          if (item?.tx_type === "Purchase") {
                            balance -= Number(item.amount || 0);
                          } else {
                            balance += Number(item.amount || 0);
                          }
                        }

                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 border-b">
                              {new Date(row.tx_datetime).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 border-b">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  row.tx_type === "Purchase"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : row.tx_type === "Sale"
                                    ? "bg-green-100 text-green-800"
                                    : row.tx_type === "Payment to Farmer"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {row.tx_type}
                              </span>
                            </td>
                            <td className="px-4 py-2 border-b">{row.ref_no}</td>
                            <td className="px-4 py-2 border-b">{row.note}</td>
                            <td
                              className={`px-4 py-2 border-b text-right ${
                                row.net_effect > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {row.net_effect > 0 ? "+" : ""}₹
                              {Number(Math.abs(row.net_effect) || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 border-b text-right">
                              ₹{Number(balance || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 border-b text-center">
                              {row.details_available ? (
                                <button
                                  onClick={() =>
                                    openInvoiceDetails(
                                      row.invoice_id,
                                      row.tx_type === "Purchase"
                                        ? "purchase"
                                        : "sale",
                                      activeFarmer.id
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-800"
                                  title="View Details"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </button>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing{" "}
                {
                  statementRows.filter(
                    (row) =>
                      !(
                        row.tx_type === "Payment to Farmer" ||
                        row.tx_type === "Payment from Farmer"
                      )
                  ).length
                }{" "}
                transactions
              </div>
              <button
                onClick={closeStatement}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showInvoiceDetails && invoiceDetails && !invoiceDetails.error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[800px] max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {invoiceLoading ? (
              <p>Loading invoice details...</p>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {invoiceDetails.invoice.bill_no ||
                        `Invoice #${invoiceDetails.invoice.id}`}
                    </h2>
                    <p className="text-gray-600">
                      {invoiceDetails.invoice.farmer_name} • Date:{" "}
                      {new Date(
                        invoiceDetails.invoice.bill_date
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={closeInvoiceDetails}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Invoice Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Total Amount</p>
                    <p className="text-xl font-bold text-blue-900">
                      ₹
                      {Number(invoiceDetails.summary.total_amount || 0).toFixed(
                        2
                      )}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Total Paid</p>
                    <p className="text-xl font-bold text-green-900">
                      ₹
                      {Number(invoiceDetails.summary.total_paid || 0).toFixed(
                        2
                      )}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600">Balance Due</p>
                    <p className="text-xl font-bold text-red-900">
                      ₹
                      {Number(invoiceDetails.summary.balance_due || 0).toFixed(
                        2
                      )}
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      invoiceDetails.summary.payment_status === "Paid"
                        ? "bg-green-50"
                        : invoiceDetails.summary.payment_status === "Partial"
                        ? "bg-yellow-50"
                        : "bg-red-50"
                    }`}
                  >
                    <p className="text-sm">Payment Status</p>
                    <p
                      className={`text-xl font-bold ${
                        invoiceDetails.summary.payment_status === "Paid"
                          ? "text-green-900"
                          : invoiceDetails.summary.payment_status === "Partial"
                          ? "text-yellow-900"
                          : "text-red-900"
                      }`}
                    >
                      {invoiceDetails.summary.payment_status}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Items</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 border-b text-left">
                            Product
                          </th>
                          <th className="px-4 py-2 border-b text-left">
                            Quantity
                          </th>
                          <th className="px-4 py-2 border-b text-left">Rate</th>
                          <th className="px-4 py-2 border-b text-left">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceDetails.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 border-b">
                              {item.product_name ||
                                `Product #${item.product_id}`}
                            </td>
                            <td className="px-4 py-2 border-b">
                              {Number(item.qty || item.size || 0)}{" "}
                              {item.unit || "units"}
                            </td>
                            <td className="px-4 py-2 border-b">
                              ₹{Number(item.rate || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 border-b">
                              ₹
                              {Number(
                                item.net_total ||
                                  item.final_amount ||
                                  item.total ||
                                  0
                              ).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payments Table */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Payments</h3>
                  {invoiceDetails.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 border-b text-left">
                              Date
                            </th>
                            <th className="px-4 py-2 border-b text-left">
                              Method
                            </th>
                            <th className="px-4 py-2 border-b text-left">
                              Remarks
                            </th>
                            <th className="px-4 py-2 border-b text-right">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceDetails.payments.map((payment, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 border-b">
                                {payment.payment_date_formatted ||
                                  new Date(
                                    payment.payment_date
                                  ).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 border-b">
                                {payment.method}
                              </td>
                              <td className="px-4 py-2 border-b">
                                {payment.remarks || "-"}
                              </td>
                              <td className="px-4 py-2 border-b text-right">
                                ₹{Number(payment.amount || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      No payments recorded for this invoice.
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={closeInvoiceDetails}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
