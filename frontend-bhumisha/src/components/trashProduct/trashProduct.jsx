import React, { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "react-toastify";
import productAPI from "../../axios/productAPI.js";
import trashProductAPI from "../../axios/trashProductApi.js";
// import { unix } from "dayjs";

const calculateQtyIngram = (qty, unit) => {
  if (unit == "kg" || unit == "litter") {
    return Number(qty) / 1000;
  } else if (unit == "ton") {
    return Number(qty) / 1000 / 1000;
  } else if (unit == "quantal") {
    return Number(qty) / 1000 / 100;
  } else return qty;
};

function truncate(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.trunc(num * factor) / factor;
}

truncate(9.99999, 2); // 9.99

const ShowWeightInKg = (data) => {
  return data / 1000;
};

const TrashProductManagement = () => {
  // --- Unit conversion helpers ---
  const UNIT_TO_KG = {
    kg: 1,
    litter: 1,
    ton: 1000,
    quantal: 100,
    gram: 0.001,
  };

  const convertToKg = (qty, unit) => {
    const q = Number(qty || 0);
    return q * (UNIT_TO_KG[unit] || 1);
  };

  const [products, setProducts] = useState([]);
  const [isEditingId, setIsEditingId] = useState(null);
  useEffect(() => {
    productAPI.getAll().then((res) => {
      setProducts(res?.data);
    });
  }, []);

  const fetchTrash = () => {
    return trashProductAPI
      .getAll()
      .then((res) => {
        const formattedData = res?.data.map((item) => ({
          id: item.trash_id ?? item.id,
          productId: item.product_id,
          productName: item.product_name,
          trashQuantity: calculateQtyIngram(item?.quantity, item?.trash_unit),
          availableQuantity: item.size,
          purchaseRate: parseFloat(item.value),
          salesRate: parseFloat(item.total),
          remark: item.remark,
          unit: item?.trash_unit || "kg",
          date: new Date(item.trash_updated_at || item.updated_at)
            .toISOString()
            .split("T")[0],
          totalLoss: parseFloat(item.value) * ShowWeightInKg(item.quantity),
        }));
        setTrashProducts(formattedData);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Error while fetching trash product data");
      });
  };

  useEffect(() => {
    fetchTrash().then(() => {
      // toast success can be noisy repeatedly; keep silent here
    });
  }, []);

  const [rows, setRows] = useState([
    {
      id: Date.now(),
      productId: "", // new field
      productName: "",
      availableQuantity: "",
      trashQuantity: "",
      purchaseRate: "",
      salesRate: "",
      remark: "",
      unit: "",
    },
  ]);

  // Table state
  const [trashProducts, setTrashProducts] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState("form");
  const [showDropdown, setShowDropdown] = useState({});
  const [searchTerm, setSearchTerm] = useState({});
  const [selectedIndex, setSelectedIndex] = useState({});
  const [filteredProducts, setFilteredProducts] = useState(products);

  // Table filters
  const [tableSearch, setTableSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  const dropdownRefs = useRef({});
  const inputRefs = useRef({});

  // Auto focus on first product input and open dropdown on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRefs.current["product-0"]) {
        inputRefs.current["product-0"].focus();
        setShowDropdown((prev) => ({ ...prev, 0: true }));
        setFilteredProducts(products);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [products]);

  // Form handlers
  const addNewRow = () => {
    const newRow = {
      id: Date.now(),
      productName: "",
      availableQuantity: "",
      trashQuantity: "",
      purchaseRate: "",
      salesRate: "",
      remark: "",
    };
    setRows([...rows, newRow]);

    setTimeout(() => {
      if (inputRefs.current[`product-${newRow.id}`]) {
        inputRefs.current[`product-${newRow.id}`].focus();
        setShowDropdown((prev) => ({ ...prev, [newRow.id]: true }));
      }
    }, 100);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const handleInputChange = (id, field, value) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id !== id) return row;

        if (field === "unit") {
          const trashQtyKg = convertToKg(row.trashQuantity, value);
          const availableKg = Number(row.availableQuantity || 0);

          if (trashQtyKg > availableKg) {
            toast.error(
              `Trash quantity exceeds available stock (${availableKg} KG)`
            );
            return { ...row, unit: value, trashQuantity: "" };
          }
        }

        // If trash quantity is being entered
        if (field === "trashQuantity") {
          const unit = row.unit || "kg";
          const trashQtyKg = convertToKg(value, unit);
          const availableKg = Number(row.availableQuantity || 0);

          if (trashQtyKg > availableKg) {
            toast.error(
              `Trash quantity exceeds available stock (${availableKg} KG)`
            );
            return row; // ❌ Do not update value
          }
        }

        return { ...row, [field]: value };
      })
    );
  };

  const handleProductSearch = (id, value) => {
    setSearchTerm((prev) => ({ ...prev, [id]: value }));

    const filtered = products.filter((product) =>
      product.product_name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredProducts(filtered);
    setSelectedIndex((prev) => ({ ...prev, [id]: 0 }));
  };

  const handleProductSelect = (id, product) => {
    if (product.quantity === 0) return;

    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id
          ? {
              ...row,
              productId: product.id, // store product id
              productName: product.product_name,
              availableQuantity: product.size / 1000,
              purchaseRate: product.value,
              salesRate: product.total,
            }
          : row
      )
    );

    setShowDropdown((prev) => ({ ...prev, [id]: false }));
    setSearchTerm((prev) => ({ ...prev, [id]: product.product_name }));

    setTimeout(() => {
      if (inputRefs.current[`trash-${id}`]) {
        inputRefs.current[`trash-${id}`].focus();
      }
    }, 100);
  };

  const handleKeyDown = (id, e) => {
    if (!showDropdown[id]) return;

    const currentIndex = selectedIndex[id] || 0;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => ({
          ...prev,
          [id]: Math.min(currentIndex + 1, filteredProducts.length - 1),
        }));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => ({
          ...prev,
          [id]: Math.max(currentIndex - 1, 0),
        }));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredProducts[currentIndex]) {
          handleProductSelect(id, filteredProducts[currentIndex]);
        }
        break;
      case "Escape":
        setShowDropdown((prev) => ({ ...prev, [id]: false }));
        break;
      default:
        break;
    }
  };

  const handleProductFocus = (id) => {
    setShowDropdown((prev) => ({ ...prev, [id]: true }));
    setFilteredProducts(products);
    setSearchTerm((prev) => ({ ...prev, [id]: "" }));
  };

  const handleBlur = (id, e) => {
    if (
      dropdownRefs.current[id] &&
      !dropdownRefs.current[id].contains(e.relatedTarget)
    ) {
      setShowDropdown((prev) => ({ ...prev, [id]: false }));

      const currentRow = rows.find((row) => row.id === id);
      if (currentRow && currentRow.productName) {
        setSearchTerm((prev) => ({ ...prev, [id]: currentRow.productName }));
      }
    }
  };

  const handleTrashQuantityKeyDown = (id, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputRefs.current[`remark-${id}`]) {
        inputRefs.current[`remark-${id}`].focus();
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    for (const row of rows) {
      const trashQtyKg = convertToKg(row.trashQuantity, row.unit);
      const availableKg = Number(row.availableQuantity || 0);

      if (trashQtyKg > availableKg) {
        toast.error(
          `Trash quantity for ${row.productName} exceeds available stock`
        );
        return;
      }
    }

    // Decide between create vs update based on isEditingId
    if (isEditingId) {
      const row = rows[0];
      trashProductAPI
        .update(isEditingId, {
          trashQuantity: Number(row?.trashQuantity),
          remark: row?.remark,
          unit: row?.unit,
        })
        .then(() => {
          toast.success("Trash product updated successfully");
          setIsEditingId(null);
          return fetchTrash();
        })
        .catch(() => {
          toast.error("Error updating trash product");
        });
    } else {
      trashProductAPI
        .create(rows)
        .then(() => {
          toast.success("Trash product created successfully");
          return fetchTrash();
        })
        .catch(() => {
          toast.error("Error creating trash product");
        });
    }

    // Reset form
    setRows([
      {
        id: Date.now(),
        productId: "",
        productName: "",
        availableQuantity: "",
        trashQuantity: "",
        purchaseRate: "",
        salesRate: "",
        remark: "",
        unit: "",
      },
    ]);
  };

  // Table handlers
  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }
    trashProductAPI
      .remove(id)
      .then(() => {
        toast.success("Trash product deleted successfully");
        // refetch to get latest stock-derived fields
        return fetchTrash();
      })
      .catch(() => {
        toast.error("Error deleting trash product");
      });
  };

  const handleEdit = (id) => {
    const product = trashProducts.find((p) => p.id === id);

    if (product) {
      setIsEditingId(id);
      // Populate form with product data for editing
      setRows([
        {
          id: Date.now(),
          productId: product.productId,
          productName: product.productName,
          availableQuantity: product.availableQuantity / 1000,
          trashQuantity: product.trashQuantity,
          purchaseRate: product.purchaseRate,
          salesRate: product.salesRate,
          remark: product.remark,
          unit: product.unit,
        },
      ]);
      setActiveTab("form");
    }
  };

  const clearFilters = () => {
    setTableSearch("");
    setDateFilter({ from: "", to: "" });
    setSortConfig({ key: null, direction: "asc" });
  };

  // Filtered and sorted table data
  const filteredAndSortedData = useMemo(() => {
    let filtered = trashProducts.filter((product) =>
      product.productName.toLowerCase().includes(tableSearch.toLowerCase())
    );

    if (dateFilter.from) {
      filtered = filtered.filter((product) => product.date >= dateFilter.from);
    }
    if (dateFilter.to) {
      filtered = filtered.filter((product) => product.date <= dateFilter.to);
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [trashProducts, tableSearch, sortConfig, dateFilter]);

  // Check if a row should be disabled
  const isRowDisabled = (row) => {
    const product = products.find((p) => p.product_name === row.productName);
    return product && product.size === 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trash Product Management
          </h1>
          <p className="text-gray-600">
            Manage your inventory trash products efficiently
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("form")}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "form"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Add Trash Products
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "table"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            View Trash History
          </button>
        </div>

        {/* Form Section */}
        {activeTab === "form" && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <form onSubmit={handleFormSubmit}>
              {/* Form Header */}
              <div className="grid grid-cols-7 gap-4 mb-4 p-4 bg-gray-800 text-white rounded-lg font-semibold">
                <div>Product Name</div>
                <div>Available Qty(KG)</div>
                <div>Trash Qty(kg)</div>
                <div>Purchase Rate</div>
                <div>Sales Rate</div>
                <div>Remark</div>
                <div>Action</div>
              </div>

              {/* Form Rows */}
              {rows.map((row) => {
                const disabled = isRowDisabled(row);

                return (
                  <div
                    key={row.id}
                    className={`grid grid-cols-7 gap-4 mb-4 p-4 rounded-lg transition-all ${
                      disabled
                        ? "bg-gray-100 opacity-60"
                        : "bg-white hover:shadow-md"
                    }`}
                  >
                    {/* Product Name Dropdown */}
                    <div className="relative">
                      <input
                        ref={(el) =>
                          (inputRefs.current[`product-${row.id}`] = el)
                        }
                        type="text"
                        value={searchTerm[row.id] || row.productName}
                        onChange={(e) =>
                          handleProductSearch(row.id, e.target.value)
                        }
                        onFocus={() => handleProductFocus(row.id)}
                        onBlur={(e) => handleBlur(row.id, e)}
                        onKeyDown={(e) => handleKeyDown(row.id, e)}
                        placeholder="Select product..."
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          disabled
                            ? "bg-gray-200 cursor-not-allowed"
                            : "bg-white"
                        }`}
                        disabled={disabled}
                      />

                      {showDropdown[row.id] && !disabled && (
                        <div
                          ref={(el) => (dropdownRefs.current[row.id] = el)}
                          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                        >
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product, idx) => {
                              const quantityInKg = product?.size / 1000;
                              return (
                                <div
                                  key={product.id}
                                  className={`px-3 py-2 cursor-pointer flex justify-between items-center ${
                                    idx === selectedIndex[row.id]
                                      ? "bg-blue-50"
                                      : ""
                                  } ${
                                    product.size === 0
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "hover:bg-gray-50"
                                  }`}
                                  onMouseDown={() =>
                                    product.size > 0 &&
                                    handleProductSelect(row.id, product)
                                  }
                                >
                                  <span className="font-medium">
                                    {product.product_name}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    Qty: {quantityInKg}
                                    {product.quantity === 0 && (
                                      <span className="text-red-500 ml-1">
                                        (Out of Stock)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-gray-500 text-center">
                              No products found
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Available Quantity */}
                    <div>
                      <input
                        type="number"
                        value={row.availableQuantity}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                        placeholder="Auto-filled"
                      />
                    </div>

                    {/* Trash Quantity */}
                    <div>
                      <input
                        ref={(el) =>
                          (inputRefs.current[`trash-${row.id}`] = el)
                        }
                        type="number"
                        step={0.01}
                        value={row.trashQuantity}
                        onChange={(e) =>
                          handleInputChange(
                            row.id,
                            "trashQuantity",
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => handleTrashQuantityKeyDown(row.id, e)}
                        placeholder="Enter quantity"
                        min="0"
                        max={row.availableQuantity}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          disabled
                            ? "bg-gray-200 cursor-not-allowed"
                            : "bg-white"
                        }`}
                        disabled={disabled}
                      />
                    </div>

                    {/* Purchase Rate */}
                    <div>
                      <input
                        type="number"
                        value={row.purchaseRate}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                        placeholder="Auto-filled"
                      />
                    </div>

                    {/* Sales Rate */}
                    <div>
                      <input
                        type="number"
                        value={row.salesRate}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                        placeholder="Auto-filled"
                      />
                    </div>

                    {/* Sales Rate */}
                    <select
                      name="unit"
                      value={row.unit || ""}
                      required
                      onChange={(e) =>
                        handleInputChange(row.id, "unit", e.target.value)
                      }
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md
    focus:outline-none focus:ring-2 focus:ring-blue-500
    focus:border-transparent ${
      disabled ? "bg-gray-200 cursor-not-allowed" : "bg-white"
    }`}
                      disabled={disabled}
                    >
                      <option value="">Select Unit</option>
                      <option value="kg">Kg</option>
                      <option value="litter">liter</option>
                      <option value="ton">Ton</option>
                      <option value="quantal">quintal</option>
                      <option value="gram">Gram</option>
                    </select>

                    {/* Remark */}
                    <div>
                      <input
                        ref={(el) =>
                          (inputRefs.current[`remark-${row.id}`] = el)
                        }
                        type="text"
                        value={row.remark}
                        onChange={(e) =>
                          handleInputChange(row.id, "remark", e.target.value)
                        }
                        placeholder="Reason for trash"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          disabled
                            ? "bg-gray-200 cursor-not-allowed"
                            : "bg-white"
                        }`}
                        disabled={disabled}
                      />
                    </div>

                    {/* Remove Button */}
                    <div>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="w-full px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        disabled={rows.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Form Actions */}
              <div className="flex space-x-4 mt-6">
                <button
                  type="button"
                  onClick={addNewRow}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Add New Row
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  Submit Form
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table Section */}
        {activeTab === "table" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Table Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by product name..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) =>
                    setDateFilter((prev) => ({ ...prev, from: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="From Date"
                />
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) =>
                    setDateFilter((prev) => ({ ...prev, to: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="To Date"
                />
              </div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th
                      className="p-3 text-left cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort("productName")}
                    >
                      Product Name{" "}
                      {sortConfig.key === "productName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort("trashQuantity")}
                    >
                      Trash Qty{" "}
                      {sortConfig.key === "trashQuantity" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort("availableQuantity")}
                    >
                      Available Qty KG{" "}
                      {sortConfig.key === "availableQuantity" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort("purchaseRate")}
                    >
                      Purchase Rate{" "}
                      {sortConfig.key === "purchaseRate" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort("salesRate")}
                    >
                      Sales Rate{" "}
                      {sortConfig.key === "salesRate" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort("totalLoss")}
                    >
                      Total Loss{" "}
                      {sortConfig.key === "totalLoss" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-3 text-left">Remark</th>
                    <th className="p-3 text-left">Unit</th>
                    <th
                      className="p-3 text-left cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort("date")}
                    >
                      Date{" "}
                      {sortConfig.key === "date" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData.length > 0 ? (
                    filteredAndSortedData.map((product) => {
                      return (
                        <tr
                          key={product.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-3">{product.productName}</td>
                          <td className="p-3">{product.trashQuantity}</td>
                          <td className="p-3">
                            {/* {ShowWeightInKg(product?.availableQuantity)?.toFixed(
                            2
                          )} */}
                            {truncate(
                              ShowWeightInKg(product?.availableQuantity),
                              2
                            )}
                          </td>
                          <td className="p-3">{product.purchaseRate}</td>
                          <td className="p-3">{product.salesRate}</td>
                          <td className="p-3 text-red-600 font-semibold">
                            {Number(product.totalLoss).toFixed(2)}
                          </td>
                          <td className="p-3">{product.remark}</td>
                          <td className="p-3">{product.unit}</td>
                          <td className="p-3">{product.date}</td>
                          <td className="p-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(product.id)}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-gray-500">
                        No trash products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 font-semibold">
                Total Records: {filteredAndSortedData.length}
              </p>
              <p className="text-red-600 font-semibold">
                Total Loss:
                {filteredAndSortedData
                  .reduce(
                    (sum, product) => Number(sum) + Number(product.totalLoss),
                    0
                  )
                  .toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashProductManagement;
