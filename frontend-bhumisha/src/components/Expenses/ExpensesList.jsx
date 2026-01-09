import React, { useEffect, useState, useMemo } from "react";
import expensesAPI from "../../axios/ExpensesAPI.js";

// React Icons for better UI
import {
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFileAlt,
  FaTimes,
  FaBuilding,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ExpensesList = ({ onchangeEdit, switchTable }) => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [gstBillExpenses, setGstBillExpenses] = useState([]);
  const [loadingGstBills, setLoadingGstBills] = useState(false);

  const [openSecondTable, setOpenSecondTable] = useState(false);

  useEffect(() => {
    if (!switchTable) {
      return;
    }
    setOpenSecondTable(switchTable);
  }, [switchTable]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    expenses_for: "",
    expenses_type: "",
    company: "",
    date_range: {
      start: "",
      end: "",
    },
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  // Get unique values for filters
  const uniqueExpensesFor = useMemo(() => {
    const values = [...new Set(expenses.map((exp) => exp.expenses_for))];
    return values.filter(Boolean).sort();
  }, [expenses]);

  const uniqueExpensesTypes = useMemo(() => {
    // If a specific expense_for is selected, filter types accordingly
    const filteredExpenses = filters.expenses_for
      ? expenses.filter((exp) => exp.expenses_for === filters.expenses_for)
      : expenses;

    const values = [
      ...new Set(filteredExpenses.map((exp) => exp.expenses_type)),
    ];
    return values.filter(Boolean).sort();
  }, [expenses, filters.expenses_for]);

  const handleChangeTable = () => {
    setOpenSecondTable((prev) => !prev);
  };

  // Get unique companies
  const uniqueCompanies = useMemo(() => {
    const companiesMap = {};
    expenses.forEach((exp) => {
      if (exp.code && exp.name) {
        const key = `${exp.code}-${exp.name}`;
        if (!companiesMap[key]) {
          companiesMap[key] = {
            code: exp.code,
            name: exp.name,
            display: `${exp.code} - ${exp.name}`,
          };
        }
      }
    });
    return Object.values(companiesMap).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [expenses]);

  // Function to parse the document URL from the string
  const getDocumentUrl = (documents) => {
    if (!documents) return null;

    try {
      if (documents.startsWith("[") && documents.endsWith("]")) {
        const parsed = JSON.parse(documents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      }
      return documents;
    } catch (error) {
      console.error("Error parsing documents:", error);
      return documents.replace(/[\[\]"]/g, "");
    }
  };

  const fetchAllExpenses = async () => {
    try {
      const res = await expensesAPI.getAll();
      setExpenses(res?.data?.data || []);
      setFilteredExpenses(res?.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let result = [...expenses];

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (exp) =>
          exp.expenses_for?.toLowerCase().includes(term) ||
          exp.expenses_type?.toLowerCase().includes(term) ||
          exp.master_name?.toLowerCase().includes(term) ||
          exp.remark?.toLowerCase().includes(term) ||
          exp.name?.toLowerCase().includes(term) ||
          exp.code?.includes(term)
      );
    }

    // Apply expense_for filter
    if (filters.expenses_for) {
      result = result.filter(
        (exp) => exp.expenses_for === filters.expenses_for
      );
    }

    // Apply expense_type filter
    if (filters.expenses_type) {
      result = result.filter(
        (exp) => exp.expenses_type === filters.expenses_type
      );
    }

    // Apply company filter
    if (filters.company) {
      const [code, name] = filters.company.split("-|-");
      result = result.filter((exp) => exp.code === code && exp.name === name);
    }

    // Apply date range filter
    if (filters.date_range.start || filters.date_range.end) {
      result = result.filter((exp) => {
        const expenseDate = new Date(exp.expense_date);

        if (filters.date_range.start && filters.date_range.end) {
          const startDate = new Date(filters.date_range.start);
          const endDate = new Date(filters.date_range.end);
          return expenseDate >= startDate && expenseDate <= endDate;
        }

        if (filters.date_range.start) {
          const startDate = new Date(filters.date_range.start);
          return expenseDate >= startDate;
        }

        if (filters.date_range.end) {
          const endDate = new Date(filters.date_range.end);
          return expenseDate <= endDate;
        }

        return true;
      });
    }

    setFilteredExpenses(result);
  }, [expenses, searchTerm, filters]);

  // Handle sorting
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (
      sortConfig.key === key &&
      sortConfig.direction === "descending"
    ) {
      direction = null;
    }

    if (direction) {
      const sorted = [...filteredExpenses].sort((a, b) => {
        if (a[key] < b[key]) return direction === "ascending" ? -1 : 1;
        if (a[key] > b[key]) return direction === "ascending" ? 1 : -1;
        return 0;
      });
      setFilteredExpenses(sorted);
    } else {
      // Reset to filtered order (remove sorting)
      const result = [...expenses];
      // Reapply filters
      if (
        searchTerm ||
        filters.expenses_for ||
        filters.expenses_type ||
        filters.company ||
        filters.date_range.start ||
        filters.date_range.end
      ) {
        // We'll let the useEffect handle this
        setFilteredExpenses(
          result.filter(() => {
            // This is a simplified version - the actual filtering happens in useEffect
            return true;
          })
        );
      }
    }

    setSortConfig({ key: direction ? key : null, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="ml-1 opacity-50" />;
    if (sortConfig.direction === "ascending")
      return <FaSortUp className="ml-1" />;
    return <FaSortDown className="ml-1" />;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      expenses_for: "",
      expenses_type: "",
      company: "",
      date_range: {
        start: "",
        end: "",
      },
    });
    setSortConfig({ key: null, direction: "ascending" });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    fetchAllExpenses();
  }, []);

  const fetchGstBillExpenses = async () => {
    try {
      setLoadingGstBills(true);
      const res = await expensesAPI.getAllExpensesBill();

      // Check the actual structure of the response
      if (res?.data?.data) {
        setGstBillExpenses(res.data.data);
      } else if (Array.isArray(res?.data)) {
        setGstBillExpenses(res.data);
      } else if (Array.isArray(res)) {
        setGstBillExpenses(res);
      } else {
        console.error("Unexpected API response structure:", res);
        setGstBillExpenses([]);
      }
    } catch (err) {
      console.error("Error fetching GST bill expenses:", err);
      setGstBillExpenses([]);
    } finally {
      setLoadingGstBills(false);
    }
  };

  useEffect(() => {
    fetchGstBillExpenses();
  }, []);

  const handleSortTable = (data) => {
    const sortedData = [...gstBillExpenses].sort((a, b) => {
      // Convert to numbers for numeric comparison
      const valueA = parseFloat(a[data]) || 0;
      const valueB = parseFloat(b[data]) || 0;

      return valueA - valueB;
    });

    // Update your state with sorted data
    setGstBillExpenses(sortedData);
  };

  const handleEditExpense = (data, type) => {
    openSecondTable
      ? onchangeEdit(data, data?.expenses_for)
      : onchangeEdit(data, type);
  };

  const handleDelete = (id) => {
    if (openSecondTable) {
      expensesAPI.expensesUpdateStatus(id).then((res) => {
        toast("Expenses Deleted Successfull");
        fetchAllExpenses();
      });
    } else {
      expensesAPI.expensesGstBillStatusChange(id).then((res) => {
        toast("Gst bill Expenses deleted Successfully");
        fetchGstBillExpenses();
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Expenses List
              </h2>
              <p className="text-gray-600 mt-1">
                {openSecondTable
                  ? `${filteredExpenses.length} expense${
                      filteredExpenses.length !== 1 ? "s" : ""
                    } found`
                  : `${gstBillExpenses.length} GST bill expense${
                      gstBillExpenses.length !== 1 ? "s" : ""
                    } found`}
              </p>
            </div>

            <div>
              <button
                onClick={handleChangeTable}
                className="mt-4 md:mt-0 px-4 py-2 text-sm font-medium rounded-lg transition flex items-center bg-black text-white hover:bg-gray-800"
              >
                Switch To See{" "}
                {openSecondTable ? "the Bill Expenses" : "Regular Expenses"}
              </button>
            </div>

            <button
              onClick={clearFilters}
              className="mt-4 md:mt-0 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition flex items-center"
            >
              <FaTimes className="mr-2" />
              Clear All Filters
            </button>
          </div>

          {/* Search Bar - Only show for regular expenses */}
          {openSecondTable && (
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by master, remark, company, or any field..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Filter Controls - Only show for regular expenses */}
          {openSecondTable && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Expense For Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaFilter className="inline mr-2" />
                  Expense For
                </label>
                <select
                  value={filters.expenses_for}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      expenses_for: e.target.value,
                      expenses_type: "", // Reset type when category changes
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {uniqueExpensesFor.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expense Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaFilter className="inline mr-2" />
                  Expense Type
                </label>
                <select
                  value={filters.expenses_type}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      expenses_type: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!filters.expenses_for}
                >
                  <option value="">All Types</option>
                  {uniqueExpensesTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {!filters.expenses_for && (
                  <p className="text-xs text-gray-500 mt-1">
                    Select an Expense Category first
                  </p>
                )}
              </div>

              {/* Company Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaBuilding className="inline mr-2" />
                  Company
                </label>
                <select
                  value={filters.company}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, company: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Companies</option>
                  {uniqueCompanies.map((company) => (
                    <option
                      key={company.display}
                      value={`${company.code}-|-${company.name}`}
                    >
                      {company.display}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarAlt className="inline mr-2" />
                  Date Range
                </label>
                <div className="flex flex-col gap-3 lg:flex-row">
                  <input
                    type="date"
                    value={filters.date_range.start}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        date_range: {
                          ...prev.date_range,
                          start: e.target.value,
                        },
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={filters.date_range.end}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        date_range: { ...prev.date_range, end: e.target.value },
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="End Date"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display - Only for regular expenses */}
          {openSecondTable &&
            (filters.expenses_for ||
              filters.expenses_type ||
              filters.company ||
              filters.date_range.start ||
              filters.date_range.end) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.expenses_for && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    Category: {filters.expenses_for}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, expenses_for: "" }))
                      }
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.expenses_type && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    Type: {filters.expenses_type}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, expenses_type: "" }))
                      }
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.company && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                    Company:{" "}
                    {
                      uniqueCompanies.find(
                        (c) => `${c.code}-|-${c.name}` === filters.company
                      )?.display
                    }
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, company: "" }))
                      }
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {(filters.date_range.start || filters.date_range.end) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    Date: {filters.date_range.start || "Start"} to{" "}
                    {filters.date_range.end || "End"}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          date_range: { start: "", end: "" },
                        }))
                      }
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
        </div>

        {/* GST Bill Expenses Table */}
        {!openSecondTable ? (
          <>
            {loadingGstBills ? (
              <div className="bg-white shadow-md rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  Loading GST bill expenses...
                </p>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Firm Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GST Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bill No.
                        </th>
                        <th
                          onClick={() => handleSortTable("total_amount")}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total GST Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Number Of Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bill Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bill Image
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remark
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {gstBillExpenses?.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <FaFileAlt className="text-4xl text-gray-300 mb-4" />
                              <p className="text-gray-500 text-lg mb-2">
                                No GST bill expenses found
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        gstBillExpenses?.map((item, index) => {
                          const documentUrl = getDocumentUrl(item.bill_image);

                          return (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 transition duration-150 ease-in-out"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item?.vendor_name || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {item?.firm_name || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {item?.gst_number || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                {item?.address || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {item?.contact || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {item?.bill_no || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                ₹
                                {parseFloat(
                                  item?.total_amount || 0
                                ).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                ₹
                                {parseFloat(
                                  item?.total_gst_amount || 0
                                ).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {item?.number_of_item || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {formatDate(item?.bill_date)}
                              </td>
                              <td className="px-6 py-4">
                                {item?.bill_image ? (
                                  <a
                                    href={`${
                                      import.meta.env.VITE_API_BASE_URL
                                    }/${documentUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  >
                                    View Bill
                                  </a>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {item?.remark || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 flex justify-center items-center gap-2 hover:cursor-pointer ">
                                <span
                                  className="border p-2 hover:bg-blue-500"
                                  onClick={() =>
                                    handleEditExpense(item, "gst_billing")
                                  }
                                >
                                  ✏️
                                </span>
                                <span
                                  onClick={() => handleDelete(item?.id)}
                                  className="border p-2 hover:bg-blue-500 "
                                >
                                  🗑️
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* GST Bill Summary */}
            {gstBillExpenses?.length > 0 && !loadingGstBills && (
              <div className="mt-6 bg-white shadow-sm rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">
                      {gstBillExpenses.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Bills</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ₹
                      {gstBillExpenses
                        .reduce(
                          (sum, bill) =>
                            sum + parseFloat(bill?.total_amount || 0),
                          0
                        )
                        .toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </div>
                    <div className="text-sm text-gray-600">Total Amount</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ₹
                      {gstBillExpenses
                        .reduce(
                          (sum, bill) =>
                            sum + parseFloat(bill?.total_gst_amount || 0),
                          0
                        )
                        .toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </div>
                    <div className="text-sm text-gray-600">Total GST</div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Regular Expenses Table
          <>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        onClick={() => requestSort("expenses_for")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          Expense For
                          {getSortIcon("expenses_for")}
                        </div>
                      </th>
                      <th
                        onClick={() => requestSort("expenses_type")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          Type
                          {getSortIcon("expenses_type")}
                        </div>
                      </th>
                      <th
                        onClick={() => requestSort("master_name")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          Master
                          {getSortIcon("master_name")}
                        </div>
                      </th>
                      <th
                        onClick={() => requestSort("amount")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          Amount
                          {getSortIcon("amount")}
                        </div>
                      </th>
                      <th
                        onClick={() => requestSort("remark")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          Remark
                          {getSortIcon("remark")}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents
                      </th>
                      <th
                        onClick={() => requestSort("code")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          Company
                          {getSortIcon("code")}
                        </div>
                      </th>
                      <th
                        onClick={() => requestSort("expense_date")}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          Date
                          {getSortIcon("expense_date")}
                        </div>
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                        <div className="flex items-center">Actions</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FaFileAlt className="text-4xl text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg mb-2">
                              No expenses found
                            </p>
                            <p className="text-gray-400 text-sm">
                              Try adjusting your search or filters
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((data, index) => {
                        const documentUrl = getDocumentUrl(data.documents);

                        return (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition duration-150 ease-in-out"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {data.expenses_for}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {data.expenses_type || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 font-medium">
                                {data.master_name || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-gray-900">
                                ₹
                                {parseFloat(data.amount).toLocaleString(
                                  "en-IN",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                                {data.expenses_type === "salary" &&
                                  data.incentive !== "0.00" &&
                                  data.incentive && (
                                    <div className="text-xs text-green-600 mt-1">
                                      + ₹
                                      {parseFloat(
                                        data.incentive
                                      ).toLocaleString("en-IN")}{" "}
                                      incentive
                                    </div>
                                  )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div
                                className="text-sm text-gray-900 max-w-xs truncate"
                                title={data.remark}
                              >
                                {data.remark || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {documentUrl ? (
                                <a
                                  href={`${
                                    import.meta.env.VITE_API_BASE_URL
                                  }/${documentUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  View Doc
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {data.code ? (
                                  <>
                                    <div className="font-medium">
                                      {data.code.toUpperCase()}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                      {data.name}
                                    </div>
                                  </>
                                ) : (
                                  "-"
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {formatDate(data.expense_date)}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 flex justify-center items-center gap-2">
                                <span
                                  onClick={() =>
                                    handleEditExpense(data, "regular")
                                  }
                                  className="border p-2 hover:bg-blue-600"
                                >
                                  ✏️
                                </span>
                                <span
                                  onClick={() => handleDelete(data?.id)}
                                  className="border p-2 hover:bg-blue-600"
                                >
                                  🗑️
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredExpenses.length > 0 && (
              <div className="mt-6 bg-white shadow-sm rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">
                      {filteredExpenses.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Expenses</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ₹
                      {filteredExpenses
                        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
                        .toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </div>
                    <div className="text-sm text-gray-600">Total Amount</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ₹
                      {filteredExpenses
                        .filter(
                          (exp) =>
                            exp.expenses_type === "salary" &&
                            exp.incentive !== "0.00"
                        )
                        .reduce(
                          (sum, exp) => sum + parseFloat(exp.incentive),
                          0
                        )
                        .toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </div>
                    <div className="text-sm text-gray-600">Total Incentive</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">
                      {
                        [
                          ...new Set(
                            filteredExpenses
                              .map((exp) => exp.code)
                              .filter(Boolean)
                          ),
                        ].length
                      }
                    </div>
                    <div className="text-sm text-gray-600">Companies</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExpensesList;
