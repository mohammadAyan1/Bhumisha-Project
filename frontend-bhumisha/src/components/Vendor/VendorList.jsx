import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setEditingVendor } from "../../features/vendor/vendorSlice";
import {
  deleteVendor,
  fetchVendors,
  updateVendorStatus,
} from "../../features/vendor/vendorThunks.js";
import DataTable from "../DataTable/DataTable";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Building2,
  FileText,
  MapPin,
  Phone,
  CreditCard,
  Landmark,
  FileSignature,
} from "lucide-react";
import vendorsAPI from "../../axios/vendorsAPI.js";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

export default function VendorList() {
  const dispatch = useDispatch();
  const { vendors, loading, error } = useSelector((state) => state.vendors);
  const [bankDetailsVendor, setBankDetailsVendor] = useState(null);
  const [statementVendor, setStatementVendor] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // New state for rows per page in main table
  const [showInactive, setShowInactive] = useState(false);

  const dateCovertedFormat = (tx_datetime) => {
    const d = new Date(tx_datetime);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Statement filters
  const [stFrom, setStFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [stTo, setStTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [stLimit, setStLimit] = useState(50);
  let combineAmount = 0;

  const fetchBalancedRow = (amount, type) => {
    if (type === "Purchase") {
      const total = combineAmount + Number(amount);
      combineAmount = total;
      return total;
    } else {
      const total = combineAmount - Number(amount);
      combineAmount = total;
      return total;
    }
  };

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  // Filter vendors based on showInactive toggle
  const filteredVendors = useMemo(() => {
    // First filter by active/inactive status
    const statusFiltered = showInactive
      ? vendors.filter(
          (v) => (v.status || "").toString().toLowerCase() === "inactive"
        )
      : vendors.filter(
          (v) => (v.status || "").toString().toLowerCase() === "active"
        );

    // Then apply search filter
    if (!search) return statusFiltered;
    const term = search.toLowerCase();
    return statusFiltered.filter((v) =>
      [v.vendor_name, v.firm_name, v.gst_no, v.address, v.contact_number]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(term))
    );
  }, [vendors, search, showInactive]);

  // Calculate total pages for main vendor list
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredVendors.length / rowsPerPage));
  }, [filteredVendors, rowsPerPage]);

  // Get current page vendors for main table
  const currentPageVendors = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredVendors.slice(start, start + rowsPerPage);
  }, [filteredVendors, page, rowsPerPage]);

  // Handle rows per page change for main table
  const handleRowsPerPageChange = (e) => {
    const value = Number(e.target.value);
    setRowsPerPage(value);
    setPage(1); // Reset to first page when changing rows per page
  };

  const handleEdit = (vendor) => {
    dispatch(setEditingVendor(vendor));
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      document.body.scrollTop = 0;
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      dispatch(deleteVendor(id));
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const normalizedCurrentStatus = (currentStatus || "")
      .toString()
      .toLowerCase();
    const newStatus =
      normalizedCurrentStatus === "active" ? "inactive" : "active";
    await dispatch(updateVendorStatus({ id, status: newStatus }));
    dispatch(fetchVendors());
  };

  const handleViewStatement = useCallback(
    async (vendor) => {
      setStatementVendor(vendor);
      setStatementLoading(true);
      try {
        const response = await vendorsAPI.getStatement(vendor.id, {
          from: stFrom,
          to: stTo,
          limit: stLimit,
        });

        setStatementData(response.data);
      } catch (error) {
        toast.error("Failed to load statement");
        console.error("Statement error:", error);
      } finally {
        setStatementLoading(false);
      }
    },
    [stFrom, stTo, stLimit]
  );

  const refreshStatement = useCallback(() => {
    if (statementVendor) {
      handleViewStatement(statementVendor);
    }
  }, [statementVendor, handleViewStatement]);

  // Function to export statement data to Excel
  const exportToExcel = useCallback(() => {
    if (!statementData?.rows || statementData.rows.length === 0) {
      toast.warning("No data to export");
      return;
    }

    try {
      // Prepare data for Excel
      const exportData = statementData.rows.map((row, index) => {
        const balancedRow = fetchBalancedRow(row?.amount, row?.tx_type);

        return {
          "S.No.": index + 1,
          Date: dateCovertedFormat(row.tx_datetime),
          Type: row.tx_type,
          "Reference No": row.ref_no || "",
          Description: row.note || "",
          Amount: Number(Math.abs(row.net_effect) || 0).toFixed(2),
          Effect: row.net_effect > 0 ? "Credit" : "Debit",
          Balance: Number(balancedRow || 0).toFixed(2),
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
          Balance: statementData.totals?.opening_balance || 0,
        },
        {
          Date: "Total Purchase Amount",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: statementData.totals?.total_purchase_amount || 0,
          Effect: "",
          Balance: "",
        },
        {
          Date: "Total Sale Amount",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: statementData.totals?.total_sale_amount || 0,
          Effect: "",
          Balance: "",
        },
        {
          Date: "Total Payments",
          Type: "",
          "Reference No": "",
          Description: "",
          Amount: statementData.totals?.total_payments_to_vendor || 0,
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
          Balance: statementData.totals?.outstanding_balance || 0,
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
      const vendorName =
        statementVendor?.vendor_name || statementVendor?.firm_name || "Vendor";
      const fileName = `${vendorName.replace(
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
  }, [statementData, statementVendor, stFrom, stTo]);

  const openInvoiceDetails = async (invoiceId, type, vendorId) => {
    setInvoiceLoading(true);
    try {
      const res = await vendorsAPI.getInvoiceDetails(vendorId, invoiceId, type);
      setInvoiceDetails(res.data);
    } catch (err) {
      toast.error("Failed to load invoice details");
      console.error(err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const closeInvoiceDetails = () => {
    setInvoiceDetails(null);
  };

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(
    (v) => (v.status || "").toString().toLowerCase() === "active"
  ).length;
  const inactiveVendors = totalVendors - activeVendors;

  const columns = [
    {
      field: "sl_no",
      headerName: "S.No.",
      width: 80,
      sortable: false,
      renderCell: (params) => {
        // Find the index of this row in the current page
        const rowIndex = currentPageVendors.findIndex(
          (vendor) => vendor.id === params.row.id
        );
        // Calculate serial number starting from 1
        const serialNumber = (page - 1) * rowsPerPage + rowIndex + 1;
        return serialNumber;
      },
    },
    {
      field: "vendor_name",
      headerName: "Vendor Firm",
      width: 220,
      renderCell: (params) => (
        <button
          onClick={() => handleViewStatement(params.row)}
          className="text-blue-600 hover:text-blue-800 underline hover:no-underline font-medium text-left"
        >
          {params.value || "—"}
        </button>
      ),
    },
    { field: "firm_name", headerName: "Firm Name", flex: 1 },
    { field: "gst_no", headerName: "GST No", flex: 1 },
    { field: "address", headerName: "Address", flex: 1 },
    { field: "contact_number", headerName: "Contact", flex: 1 },
    {
      field: "balance",
      headerName: "Balance",
      width: 140,
      renderCell: (params) => {
        if (!params || !params.row) return <span>0.00</span>;
        const bal = Number(params.row.balance ?? 0);
        const min = Number(params.row.min_balance ?? 5000);
        const low = bal < min;
        return (
          <span
            className={`${
              low ? "text-gray-800 font-semibold" : "text-red-600 font-semibold"
            }`}
          >
            {bal.toFixed(2)}
          </span>
        );
      },
    },
    {
      field: "min_balance",
      headerName: "Min Balance",
      width: 140,
      renderCell: (params) => {
        if (!params || !params.row) return <span>0.00</span>;
        const min = Number(params.row.min_balance ?? 5000);
        return <span className="text-gray-800">{min.toFixed(2)}</span>;
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
      field: "bank",
      headerName: "Bank",
      sortable: false,
      width: 80,
      renderCell: (params) => (
        <IconButton
          color="info"
          onClick={() => setBankDetailsVendor(params.row)}
          title="View Bank Details"
        >
          <AccountBalanceIcon />
        </IconButton>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      width: 120,
      renderCell: (params) => (
        <div className="flex gap-2">
          <IconButton color="primary" onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Vendors</h2>

      {loading && <p className="text-gray-600">Loading vendors...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-100 via-blue-200 to-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">Total Vendors</p>
            <Building2 size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            {totalVendors}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-100 via-green-200 to-green-50 rounded-lg shadow p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-900">Active</p>
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-900 mt-2">
            {activeVendors}
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-50 rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">Inactive</p>
            <span className="w-3 h-3 rounded-full bg-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {inactiveVendors}
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
            ({filteredVendors.length} vendors)
          </p>
        </div>
      </div>

      {/* Search and Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by firm name, GST, phone, address..."
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
            Show Inactive Vendors
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
              showInactive ? "Show active vendors" : "Show inactive vendors"
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

      {/* Info banner when showing inactive vendors */}
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
              Showing inactive vendors only. To activate a vendor, click on its
              status toggle.
            </p>
          </div>
        </div>
      )}

      {/* DataGrid */}
      <div className="bg-white rounded shadow overflow-x-auto mb-6">
        <DataTable
          rows={currentPageVendors}
          columns={columns}
          pageSize={rowsPerPage}
          title="Vendors List"
          getRowId={(row) => row?.id ?? row?.vendor_id ?? row?._id}
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
        {filteredVendors.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Showing {(page - 1) * rowsPerPage + 1} to{" "}
              {Math.min(page * rowsPerPage, filteredVendors.length)} of{" "}
              {filteredVendors.length} vendors
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

      {/* Bank Details Modal */}
      {bankDetailsVendor && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setBankDetailsVendor(null)}
          />
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Bank details
                    </h2>
                    <p className="text-xs text-gray-500">
                      {bankDetailsVendor?.firm_name || "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBankDetailsVendor(null)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <svg
                    className="w-5 h-5"
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

              <div className="px-6 py-5">
                {(() => {
                  const bank = {
                    pan_number: bankDetailsVendor?.pan_number || "",
                    account_holder_name:
                      bankDetailsVendor?.account_holder_name || "",
                    bank_name: bankDetailsVendor?.bank_name || "",
                    account_number: bankDetailsVendor?.account_number || "",
                    ifsc_code: bankDetailsVendor?.ifsc_code || "",
                    branch_name: bankDetailsVendor?.branch_name || "",
                  };

                  const Item = ({ label, value, icon, isCopy }) => (
                    <div className="group border rounded-xl p-3.5 hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-gray-600">{icon}</span>
                        <p className="text-xs font-medium text-gray-600">
                          {label}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className={`text-sm ${
                            value
                              ? "text-gray-900 font-semibold"
                              : "text-gray-400"
                          }`}
                        >
                          {value || "Not available"}
                        </p>
                        {isCopy && value ? (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(value);
                              } catch {}
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                          >
                            Copy
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Item
                        label="PAN number"
                        value={bank.pan_number}
                        icon={<FileSignature size={16} />}
                        isCopy
                      />
                      <Item
                        label="Account holder"
                        value={bank.account_holder_name}
                        icon={<Building2 size={16} />}
                      />
                      <Item
                        label="Bank name"
                        value={bank.bank_name}
                        icon={<Landmark size={16} />}
                      />
                      <Item
                        label="Account number"
                        value={bank.account_number}
                        icon={<CreditCard size={16} />}
                        isCopy
                      />
                      <Item
                        label="IFSC code"
                        value={bank.ifsc_code}
                        icon={<FileText size={16} />}
                        isCopy
                      />
                      <Item
                        label="Branch name"
                        value={bank.branch_name}
                        icon={<MapPin size={16} />}
                      />
                    </div>
                  );
                })()}
              </div>

              <div className="px-6 py-4 border-t flex justify-end">
                <button
                  onClick={() => setBankDetailsVendor(null)}
                  className="px-5 py-2 rounded-lg bg-gray-900 text-white hover:bg-black transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {statementVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[1000px] max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Statement -{" "}
                  {statementVendor.vendor_name || statementVendor.firm_name}
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
                  onClick={() => {
                    setStatementVendor(null);
                    setStatementData(null);
                  }}
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
                  onChange={(e) => {
                    setStLimit(Number(e.target.value));
                  }}
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
                  onClick={refreshStatement}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>

            {statementData?.totals && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Opening Balance</p>
                  <p className="text-xl font-bold text-blue-900">
                    ₹
                    {Number(statementData.totals.opening_balance || 0).toFixed(
                      2
                    )}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">
                    Total Purchase Transport Amount
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {statementData.totals.total_purchase_transport_amount || 0}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">
                    Total Sales Transport Amount
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {statementData.totals.total_sale_transport_amount || 0}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">
                    Total Payment To Vendor
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {statementData.totals.total_payments_to_vendor || 0}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">
                    Total Payment From Vendor
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {statementData.totals.total_payments_from_vendor || 0}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">
                    Total Purchase Invoices
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {statementData.totals.total_purchase_invoices || 0}
                  </p>
                  <p className="text-sm">
                    Amount: ₹
                    {Number(
                      statementData.totals.total_purchase_amount || 0
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600">Total Sale Invoices</p>
                  <p className="text-xl font-bold text-purple-900">
                    {statementData.totals.total_sale_invoices || 0}
                  </p>
                  <p className="text-sm">
                    Amount: ₹
                    {Number(
                      statementData.totals.total_sale_amount || 0
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">Outstanding Balance</p>
                  <p className="text-xl font-bold text-red-900">
                    ₹
                    {Number(
                      statementData.totals.outstanding_balance || 0
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {statementLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Loading transactions...</span>
              </div>
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
                    {statementData?.rows?.map((row, index) => {
                      const balancedRow = fetchBalancedRow(
                        row?.amount,
                        row?.tx_type
                      );

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border-b">
                            {dateCovertedFormat(row.tx_datetime)}
                          </td>
                          <td className="px-4 py-2 border-b">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                row.tx_type === "Purchase"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : row.tx_type === "Sale"
                                  ? "bg-green-100 text-green-800"
                                  : row.tx_type === "Payment to Vendor"
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
                            ₹{Number(balancedRow || 0).toFixed(2)}
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
                                    statementVendor.id
                                  )
                                }
                                className="text-blue-600 hover:text-blue-800"
                                title="View Invoice Details with Payments"
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
                    {(!statementData?.rows ||
                      statementData.rows.length === 0) && (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No transactions found for this vendor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {statementData?.rows?.length || 0} transactions
              </div>
              <button
                onClick={() => {
                  setStatementVendor(null);
                  setStatementData(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {invoiceDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[800px] max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {invoiceLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Loading invoice details...</span>
              </div>
            ) : invoiceDetails.error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">
                  <svg
                    className="w-12 h-12 mx-auto text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="mt-2 text-lg font-medium">
                    {invoiceDetails.error}
                  </p>
                </div>
                <button
                  onClick={closeInvoiceDetails}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {invoiceDetails.invoice.bill_no ||
                        `Invoice #${invoiceDetails.invoice.id}`}
                    </h2>
                    <p className="text-gray-600">
                      {invoiceDetails.invoice.vendor_name ||
                        invoiceDetails.invoice.firm_name}{" "}
                      • Date:{" "}
                      {dateCovertedFormat(invoiceDetails.invoice.bill_date)}
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
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600">Transport charges</p>
                    <p className="text-xl font-bold text-red-900">
                      ₹
                      {Number(
                        invoiceDetails.invoice.other_amount ||
                          invoiceDetails.invoice.transport ||
                          0
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600">Discount Amount</p>
                    <p className="text-xl font-bold text-red-900">
                      ₹
                      {Number(
                        invoiceDetails.invoice.total_discount_amount ||
                          invoiceDetails?.items?.[0]?.total_discount_amount ||
                          0
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600">GST Amount</p>
                    <p className="text-xl font-bold text-red-900">
                      ₹
                      {Number(
                        invoiceDetails.invoice.total_gst ||
                          invoiceDetails.invoice.gst_amount ||
                          0
                      ).toFixed(2)}
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
                          {invoiceDetails.payments.map((payment, index) => {
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border-b">
                                  {dateCovertedFormat(
                                    payment.payment_date_formatted
                                  ) || dateCovertedFormat(payment.payment_date)}
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
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
