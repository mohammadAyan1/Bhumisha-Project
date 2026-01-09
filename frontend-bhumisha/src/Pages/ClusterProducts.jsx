import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchProducts } from "../features/products/productsSlice";
import {
  addClusterProduct,
  fetchGivenClusterProducts,
} from "../features/clusterProduct/clusterProducts";

const ClusterProducts = () => {
  const dispatch = useDispatch();
  // const { list } = useSelector((state) => state?.clusterProducts);
  const [clustorProducts, setClustorProducts] = useState([]);
  const [Products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("add"); // "add" or "view"

  // Single empty row template
  const emptyRow = {
    productId: "",
    name: "",
    rate: "", // per-kg rate
    unit: "kg",
    quantity: "", // what user types (in selected unit)
    calculatedRate: "",
    availableQtyInGrams: 0, // Store available quantity in GRAMS
    isCustomProduct: false,
  };

  const [rows, setRows] = useState([emptyRow]);

  // fetch products once
  useEffect(() => {
    dispatch(fetchProducts())
      .then((res) => {
        setProducts(res.payload?.data || res.payload || []);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchGivenClusterProducts())
      .then((res) => {
        setClustorProducts(res.payload?.data || res.payload || []);
      })
      .catch((err) => {
        console.error("Error fetching given cluster products:", err);
      });
  }, [dispatch]);

  // memo map for fast lookup
  const productMap = useMemo(() => {
    const map = new Map();
    Products.forEach((p) => map.set(String(p.id), p));
    return map;
  }, [Products]);

  // Helpers
  const toNumberSafe = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Convert grams to selected unit for display
  const gramsToUnit = (grams, unit) => {
    grams = toNumberSafe(grams);
    switch (unit) {
      case "ton":
        return grams / 1_000_000;
      case "quintal":
        return grams / 100_000;
      case "kg":
        return grams / 1000;
      case "gram":
        return grams;
      default:
        return grams / 1000; // Default to kg
    }
  };

  // Convert from selected unit to grams
  const unitToGram = (unit, qty) => {
    qty = toNumberSafe(qty);
    switch (unit) {
      case "ton":
        return qty * 1_000_000;
      case "quintal":
        return qty * 100_000;
      case "kg":
        return qty * 1000;
      case "gram":
        return qty;
      default:
        return qty * 1000; // Default to kg
    }
  };

  // Calculate rate for selected unit based on per-kg rate
  const calculateRate = (unit, ratePerKg) => {
    const r = toNumberSafe(ratePerKg);
    switch (unit) {
      case "ton":
        return r * 1000; // 1 ton = 1000 kg, so rate per ton = rate per kg * 1000
      case "quintal":
        return r * 100; // 1 quintal = 100 kg
      case "kg":
        return r;
      case "gram":
        return r / 1000; // rate per gram = rate per kg / 1000
      default:
        return r;
    }
  };

  // Calculate value based on quantity and rate
  const calculateValue = (quantity, ratePerUnit) => {
    const qty = toNumberSafe(quantity);
    const rate = toNumberSafe(ratePerUnit);
    return qty * rate;
  };

  // When a field changes for a row
  const handleRowChange = useCallback(
    (index, name, rawValue) => {
      setRows((prev) => {
        const out = prev.map((r) => ({ ...r })); // shallow clone rows
        const row = out[index];

        if (!row) return prev;

        // PRODUCT SELECT from dropdown
        if (name === "productId") {
          const pid = String(rawValue || "");

          if (!pid) {
            // clearing selection: reset to empty row but keep as custom
            out[index] = {
              ...emptyRow,
              isCustomProduct: true,
              unit: row.unit || "kg",
            };
            return out;
          }

          const product = productMap.get(pid);
          if (!product) {
            // invalid product id
            out[index] = { ...emptyRow };
            return out;
          }

          // Product size is stored in GRAMS
          const availableInGrams = toNumberSafe(product.size);
          const productUnit = product.unit || "kg"; // Product's default unit

          // Check if product quantity is zero
          if (availableInGrams <= 0) {
            window.alert(
              `Product "${product.product_name}" has 0 available quantity — cannot select.`
            );
            return prev;
          }

          const perKgRate = product.total ?? product.rate ?? 0;
          const selectedUnit = row.unit || productUnit;

          out[index] = {
            ...out[index],
            productId: pid,
            name: product.product_name || "",
            rate: String(perKgRate),
            unit: selectedUnit,
            calculatedRate: String(calculateRate(selectedUnit, perKgRate)),
            availableQtyInGrams: availableInGrams, // Store in grams
            quantity: "", // reset quantity for new product
            isCustomProduct: false,
          };

          return out;
        }

        // PRODUCT NAME (for custom product entry)
        if (name === "name") {
          out[index] = {
            ...row,
            name: rawValue,
            productId: "", // Clear product ID for custom product
            isCustomProduct: true,
            availableQtyInGrams: 0, // Custom products have no availability check
          };
          return out;
        }

        // UNIT change
        if (name === "unit") {
          const newUnit = rawValue || "kg";
          const oldUnit = row.unit;

          // Recalculate calculated rate for new unit
          const newCalculatedRate = calculateRate(newUnit, row.rate);

          // For database products, update available quantity display
          if (!row.isCustomProduct && row.availableQtyInGrams > 0) {
            // Convert available grams to new unit
            const availableInNewUnit = gramsToUnit(
              row.availableQtyInGrams,
              newUnit
            );

            // If user has entered quantity, convert it too
            let newQuantity = row.quantity;
            if (row.quantity && toNumberSafe(row.quantity) > 0) {
              const quantityInGrams = unitToGram(oldUnit, row.quantity);
              newQuantity = String(gramsToUnit(quantityInGrams, newUnit));

              // Check if converted quantity exceeds available in new unit
              if (toNumberSafe(newQuantity) > availableInNewUnit) {
                window.alert(
                  `After unit conversion, quantity (${newQuantity} ${newUnit}) exceeds available (${availableInNewUnit} ${newUnit}). Quantity will be set to available.`
                );
                newQuantity = String(availableInNewUnit);
              }
            }

            out[index] = {
              ...row,
              unit: newUnit,
              calculatedRate: String(newCalculatedRate),
              quantity: newQuantity,
            };
          } else {
            // For custom products or no quantity entered
            out[index] = {
              ...row,
              unit: newUnit,
              calculatedRate: String(newCalculatedRate),
            };
          }
          return out;
        }

        // RATE change (per-kg)
        if (name === "rate") {
          const newCalculatedRate = calculateRate(row.unit, rawValue);
          out[index] = {
            ...row,
            rate: rawValue,
            calculatedRate: String(newCalculatedRate),
          };
          return out;
        }

        // QUANTITY change
        if (name === "quantity") {
          const typed = rawValue === "" ? "" : rawValue;

          if (typed === "") {
            out[index] = { ...row, quantity: "" };
            return out;
          }

          const asNum = toNumberSafe(typed);

          // Prevent negative quantities
          if (asNum < 0) {
            out[index] = { ...row, quantity: "0" };
            return out;
          }

          // For custom products, no availability check
          if (row.isCustomProduct) {
            out[index] = { ...row, quantity: typed };
            return out;
          }

          // For products from database, check availability
          if (row.availableQtyInGrams > 0) {
            // Convert entered quantity to grams
            const enteredQuantityInGrams = unitToGram(row.unit, asNum);
            const availableInGrams = row.availableQtyInGrams;

            // Get available in current unit for display
            const availableInCurrentUnit = gramsToUnit(
              availableInGrams,
              row.unit
            );

            if (enteredQuantityInGrams > availableInGrams) {
              window.alert(
                `Entered quantity (${asNum} ${row.unit}) exceeds available quantity (${availableInCurrentUnit} ${row.unit}). Quantity will be set to available.`
              );
              out[index] = { ...row, quantity: String(availableInCurrentUnit) };
              return out;
            }

            if (enteredQuantityInGrams === availableInGrams && asNum > 0) {
              window.alert(
                `You have reached the maximum available quantity (${availableInCurrentUnit} ${row.unit}) for this product.`
              );
              out[index] = { ...row, quantity: typed };
              return out;
            }
          }

          // Normal case
          out[index] = { ...row, quantity: typed };
          return out;
        }

        // any other simple field
        row[name] = rawValue;
        return out;
      });
    },
    [productMap]
  );

  // add new row only when last row has required fields
  const addRow = useCallback(() => {
    setRows((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return [emptyRow];

      // For custom products: require name and quantity
      if (last.isCustomProduct) {
        if (!last.name || last.quantity === "" || Number(last.quantity) <= 0) {
          window.alert(
            "For custom products, please fill Product Name and Quantity in the current row before adding a new row."
          );
          return prev;
        }
      } else {
        // For database products: require productId and quantity
        if (
          !last.productId ||
          last.quantity === "" ||
          Number(last.quantity) <= 0
        ) {
          window.alert(
            "Please fill Product and Quantity in the current row before adding a new row."
          );
          return prev;
        }
      }

      return [...prev, { ...emptyRow }];
    });
  }, []);

  // remove row by index
  const removeRow = useCallback((index) => {
    setRows((prev) => {
      if (prev.length === 1) {
        return [emptyRow];
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Submit: prepares payload with quantities converted to grams
  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault?.();

      // Validate before submit
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];

        if (r.isCustomProduct) {
          // Custom product validation
          if (!r.name || r.name.trim() === "") {
            window.alert(
              `Row ${i + 1}: Please enter a product name for custom product.`
            );
            return;
          }
          if (r.quantity === "" || toNumberSafe(r.quantity) <= 0) {
            window.alert(`Row ${i + 1}: Quantity should be greater than 0.`);
            return;
          }
          if (!r.rate || toNumberSafe(r.rate) <= 0) {
            window.alert(
              `Row ${i + 1}: Please enter a valid rate for custom product.`
            );
            return;
          }
        } else {
          // Database product validation
          if (!r.productId) {
            window.alert(`Row ${i + 1}: Please select a product.`);
            return;
          }
          if (r.quantity === "" || toNumberSafe(r.quantity) <= 0) {
            window.alert(`Row ${i + 1}: Quantity should be greater than 0.`);
            return;
          }

          // Check if selected product still has available quantity
          const product = productMap.get(String(r.productId));
          if (product) {
            const availableInGrams = toNumberSafe(product.size);
            if (availableInGrams <= 0) {
              window.alert(
                `Row ${i + 1}: Selected product "${
                  r.name
                }" is now out of stock. Please remove or change this product.`
              );
              return;
            }
          }
        }
      }

      const payload = rows.map((r) => {
        const quantityInGrams = unitToGram(r.unit, r.quantity);
        const basePayload = {
          name: r.name,
          unit: r.unit,
          rate_per_kg: toNumberSafe(r.rate),
          quantity_in_gram: quantityInGrams,
          is_custom_product: r.isCustomProduct,
          total_value: calculateValue(r.quantity, r.calculatedRate),
        };

        if (r.isCustomProduct) {
          // Custom product payload
          return {
            ...basePayload,
            product_id: null,
          };
        } else {
          // Database product payload
          return {
            ...basePayload,
            product_id: r.productId,
            available_qty_in_grams: r.availableQtyInGrams,
          };
        }
      });

      dispatch(addClusterProduct(payload)).then((res) => {
        // Refresh the data table after successful submission
        dispatch(fetchGivenClusterProducts())
          .then((res) => {
            setClustorProducts(res.payload?.data || res.payload || []);
            // Switch to view tab after successful submission
            setActiveTab("view");
          })
          .catch((err) => {
            console.error("Error refreshing cluster products:", err);
          });
      });

      window.alert(
        `Successfully added ${payload.length} products (${
          payload.filter((p) => p.is_custom_product).length
        } custom)`
      );
    },
    [rows, productMap]
  );

  // Format available quantity with unit
  const formatAvailable = (product) => {
    if (!product) return "0";
    const sizeInGrams = toNumberSafe(product.size);
    const unit = product.unit || "kg";

    // Convert grams to product's unit
    let displayQty;
    switch (unit) {
      case "ton":
        displayQty = sizeInGrams / 1_000_000;
        return `${displayQty.toFixed(3)} ton`;
      case "quintal":
        displayQty = sizeInGrams / 100_000;
        return `${displayQty.toFixed(3)} quintal`;
      case "kg":
        displayQty = sizeInGrams / 1000;
        return `${displayQty.toFixed(3)} kg`;
      case "gram":
        return `${sizeInGrams.toFixed(0)} g`;
      default:
        displayQty = sizeInGrams / 1000;
        return `${displayQty.toFixed(3)} kg`;
    }
  };

  // Get available quantity in current unit for display
  const getAvailableInCurrentUnit = (row) => {
    if (row.isCustomProduct || row.availableQtyInGrams <= 0) return 0;
    return gramsToUnit(row.availableQtyInGrams, row.unit);
  };

  // Check if product is available (quantity > 0)
  const isProductAvailable = (product) => {
    return product && toNumberSafe(product.size) > 0;
  };

  // Calculate total value for the row
  const calculateRowTotal = (row) => {
    if (!row.quantity || !row.calculatedRate) return 0;
    const quantity = toNumberSafe(row.quantity);
    const rate = toNumberSafe(row.calculatedRate);
    return quantity * rate;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate grand total from cluster products
  const calculateGrandTotal = () => {
    return clustorProducts.reduce((total, product) => {
      return total + toNumberSafe(product.total || 0);
    }, 0);
  };

  // Render the Add Products form
  const renderAddForm = () => (
    <form onSubmit={handleSubmit}>
      {/* <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> All product quantities are stored in grams.
          Conversions are done automatically.
          <br />• <strong>1 ton = 1,000,000 grams</strong>
          <br />• <strong>1 quintal = 100,000 grams</strong>
          <br />• <strong>1 kg = 1,000 grams</strong>
        </p>
      </div> */}

      {rows.map((row, idx) => {
        const availableInCurrentUnit = getAvailableInCurrentUnit(row);
        const rowTotal = calculateRowTotal(row);

        return (
          <div
            key={idx}
            className="mb-6 p-4 border rounded-md bg-white shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-lg">Row {idx + 1}</h3>
              <div className="flex gap-2">
                {row.isCustomProduct && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                    Custom Product
                  </span>
                )}
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remove Row
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Product selection mode */}
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium mb-1">
                  Select or Enter Product
                </label>
                <div className="space-y-2">
                  {/* Product dropdown */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Select from database:
                    </label>
                    <select
                      name="productId"
                      value={row.isCustomProduct ? "" : row.productId}
                      onChange={(e) =>
                        handleRowChange(idx, "productId", e.target.value)
                      }
                      className="w-full border rounded p-2"
                      disabled={row.isCustomProduct && row.name !== ""}
                    >
                      <option value="">-- select product --</option>
                      {Products.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={!isProductAvailable(p)}
                          className={
                            !isProductAvailable(p) ? "text-gray-400" : ""
                          }
                        >
                          {p.product_name} — Avail: {formatAvailable(p)}
                          {!isProductAvailable(p) && " (Out of stock)"}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Products with 0 quantity cannot be selected
                    </p>
                  </div>

                  {/* OR separator */}
                  <div className="flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="px-2 text-sm text-gray-500">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>

                  {/* Custom product name */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Enter custom product name:
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={row.name}
                      onChange={(e) =>
                        handleRowChange(idx, "name", e.target.value)
                      }
                      className="w-full border rounded p-2"
                      placeholder="Enter product name for custom product"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Typing here will create a custom product
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity and Available */}
              <div className="space-y-4">
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quantity ({row.unit})
                    {availableInCurrentUnit > 0 && (
                      <span className="text-xs text-gray-600 ml-2">
                        (Max: {availableInCurrentUnit.toFixed(3)})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="quantity"
                    value={row.quantity}
                    onChange={(e) =>
                      handleRowChange(idx, "quantity", e.target.value)
                    }
                    className="w-full border rounded p-2"
                    placeholder="Enter quantity"
                  />
                  {row.quantity &&
                    toNumberSafe(row.quantity) ===
                      toNumberSafe(availableInCurrentUnit) &&
                    availableInCurrentUnit > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠ Maximum available quantity reached
                      </p>
                    )}
                </div>

                {/* Available (only for database products) */}
                {!row.isCustomProduct && row.productId && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Available Quantity
                    </label>
                    <div
                      className={`p-2 border rounded text-sm ${
                        availableInCurrentUnit > 0
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <span
                        className={
                          availableInCurrentUnit > 0
                            ? "text-green-700"
                            : "text-red-700"
                        }
                      >
                        {availableInCurrentUnit.toFixed(3)} {row.unit}
                        {availableInCurrentUnit <= 0 && " (Out of stock)"}
                      </span>
                      <div className="text-xs text-gray-600 mt-1">
                        ({row.availableQtyInGrams.toLocaleString()} grams)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rate and Unit */}
              <div className="space-y-4">
                {/* Rate (per kg) */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Rate (per kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="rate"
                    value={row.rate}
                    onChange={(e) =>
                      handleRowChange(idx, "rate", e.target.value)
                    }
                    className="w-full border rounded p-2"
                    placeholder="Rate per kg"
                    disabled={!row.isCustomProduct && row.productId}
                  />
                  {!row.isCustomProduct && row.productId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Rate is fetched from product database
                    </p>
                  )}
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <select
                    name="unit"
                    value={row.unit}
                    onChange={(e) =>
                      handleRowChange(idx, "unit", e.target.value)
                    }
                    className="w-full border rounded p-2"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="ton">Ton</option>
                    <option value="quintal">Quintal</option>
                    <option value="gram">Gram (g)</option>
                  </select>
                </div>

                {/* Calculated rate */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Rate (per {row.unit})
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={row.calculatedRate}
                    className="w-full border rounded p-2 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Calculated: {row.rate || 0} ₹/kg × conversion factor
                  </p>
                </div>
              </div>
            </div>

            {/* Summary row */}
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-sm font-medium">Product:</p>
                  <p className="text-lg">{row.name || "Not selected"}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Quantity Details:</p>
                  <p className="text-sm">
                    {row.quantity
                      ? `${row.quantity} ${row.unit}`
                      : "Not entered"}
                    {row.quantity && (
                      <span className="text-gray-600 ml-2">
                        ({unitToGram(row.unit, row.quantity).toLocaleString()}
                        g)
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Total Value:</p>
                  <p className="text-lg font-semibold text-green-700">
                    ₹{rowTotal.toFixed(2)}
                  </p>
                </div>
              </div>

              {row.rate && row.unit && (
                <div className="mt-2 text-xs text-gray-600">
                  <p>
                    Calculation: {row.quantity || 0} {row.unit} ×{" "}
                    {row.calculatedRate || 0} ₹/{row.unit} = ₹
                    {rowTotal.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={addRow}
          className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ➕ Add New Row
        </button>

        <button
          type="submit"
          className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          ✅ Submit All Products
        </button>
      </div>
    </form>
  );

  // Render the Data Table
  const renderDataTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Cluster Products Summary
            </h3>
            <p className="text-sm text-gray-600">
              Total {clustorProducts.length} products added
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Grand Total</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{calculateGrandTotal().toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Charges
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Added On
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clustorProducts.length > 0 ? (
              clustorProducts.map((product, index) => (
                <tr
                  key={product.id || index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.id || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.product_name || product.name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.hsn_code
                          ? `HSN: ${product.hsn_code}`
                          : "Custom Product"}
                      </div>
                      {product.size && (
                        <div className="text-xs text-blue-600 mt-1">
                          Size: {product.size} {product.unit || "kg"}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.quantity || "0.000"} {product.unit || "kg"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.packing_weight
                        ? `Pack: ${product.packing_weight}`
                        : "No packing"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₹{parseFloat(product.rate || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Purchase: ₹
                      {parseFloat(product.purchase_rate || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-gray-700">
                        Transport: ₹
                        {parseFloat(product.transport_charge || 0).toFixed(2)}
                      </div>
                      <div className="text-gray-700">
                        Local: ₹
                        {parseFloat(product.local_transport || 0).toFixed(2)}
                      </div>
                      <div className="text-gray-700">
                        Packaging: ₹
                        {parseFloat(product.packaging_cost || 0).toFixed(2)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-semibold text-green-600">
                      ₹{parseFloat(product.total || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === "giver"
                          ? "bg-green-100 text-green-800"
                          : product.status === "taker"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.status || "unknown"}
                    </span>
                    {product.cluster_id ? (
                      <div className="text-xs text-gray-500 mt-1">
                        Cluster ID: {product.cluster_id}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1">
                        No cluster assigned
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(product.created_at)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No products found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding some cluster products.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {clustorProducts.length > 0 && (
            <tfoot className="bg-gray-50">
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-4 text-right text-sm font-medium text-gray-900"
                >
                  Grand Total:
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-green-600">
                  ₹{calculateGrandTotal().toFixed(2)}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Additional Information */}
      {clustorProducts.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Total Products:</span>
              <span className="ml-2 text-gray-600">
                {clustorProducts.length}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Average Rate:</span>
              <span className="ml-2 text-gray-600">
                ₹
                {clustorProducts.length > 0
                  ? (calculateGrandTotal() / clustorProducts.length).toFixed(2)
                  : "0.00"}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Last Updated:</span>
              <span className="ml-2 text-gray-600">
                {clustorProducts.length > 0
                  ? formatDate(clustorProducts[0].created_at)
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Cluster Products Management</h2>
        <button
          onClick={() => {
            dispatch(fetchGivenClusterProducts())
              .then((res) => {
                setClustorProducts(res.payload?.data || res.payload || []);
              })
              .catch((err) => {
                console.error("Error refreshing cluster products:", err);
              });
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
        >
          ↻ Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("add")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "add"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Add Products
            </button>
            <button
              onClick={() => setActiveTab("view")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "view"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              View Products ({clustorProducts.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "add" ? renderAddForm() : renderDataTable()}
      </div>
    </div>
  );
};

export default ClusterProducts;
