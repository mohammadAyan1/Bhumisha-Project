// src/components/Products.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../../features/products/productsSlice";
import { fetchCategories } from "../../features/Categories/categoiresSlice";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useNavigate } from "react-router-dom";

// Display helper
const fx = (n) => (isNaN(n) ? 0 : Number(n));

const getDiscountsFromValue = (value) => ({
  discount_30: (value * 30) / 100,
  discount_25: (value * 25) / 100,
});

// Helper function to convert size to grams
const convertToGrams = (size, unit) => {
  const numericValue = Number(size || 0);

  if (numericValue <= 0) return numericValue;

  switch (unit) {
    case "ton":
      return numericValue * 1000 * 1000; // 1 ton = 1,000,000 gram
    case "quantal":
      return numericValue * 100 * 1000; // 1 quantal = 100 kg = 100,000 gram
    case "kg":
      return numericValue * 1000; // 1 kg = 1000 gram
    case "litter":
      return numericValue * 1000; // 1 kg = 1000 gram
    case "gram":
    default:
      return numericValue;
  }
};

// Helper function to convert grams back to display unit
const convertFromGrams = (grams, unit) => {
  const numericValue = Number(grams || 0);

  if (numericValue <= 0) return numericValue;

  switch (unit) {
    case "ton":
      return numericValue / (1000 * 1000);
    case "quantal":
      return numericValue / (100 * 1000);
    case "kg":
      return numericValue / 1000;
    case "litter":
      return numericValue / 1000;
    case "gram":
    default:
      return numericValue;
  }
};

export default function Products({ open, hide }) {
  const dispatch = useDispatch();
  const { list: products, loading } = useSelector((state) => state.products);
  const { list: categories } = useSelector((state) => state.categories);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [openoPiecesFields, setOpenPiecesFields] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  const initialForm = {
    category_id: "",
    product_name: "",
    size: "",
    unit: "",
    pieces: "",
    purchase_rate: "",
    transport_charge: 10,
    local_transport: 5,
    packaging_cost: 1.5,
    hsn_code: "",
    value: "",
    discount_30: 0,
    discount_25: 0,
    total: "",
    gst: "",
    gstAmount: 0,
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Auto Calculation (VALUE-BASED)
  useEffect(() => {
    const purchase = fx(formData.purchase_rate);
    const transport = fx(formData.transport_charge);
    const local = fx(formData.local_transport);
    const packaging = fx(formData.packaging_cost);

    // Value from all landed costs
    const value = purchase + transport + local + packaging;

    // Discounts/Margins derived from Value
    const { discount_30, discount_25 } = getDiscountsFromValue(value);

    // Total Sales Rate baseline (no GST here)
    const salesRate = value * 1.5;

    setFormData((prev) => ({
      ...prev,
      value,
      discount_30,
      discount_25,
      total: salesRate,
      gstAmount: prev.gstAmount ?? 0, // do not auto-calc gstAmount here
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.purchase_rate,
    formData.transport_charge,
    formData.local_transport,
    formData.packaging_cost,
    // gst intentionally excluded
  ]);

  useEffect(() => {
    if (formData?.unit == "box") {
      setOpenPiecesFields(true);
    } else {
      setOpenPiecesFields(false);
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleAdd = async () => {
    // Unit required before conversion
    if (!formData.unit) {
      alert("Please select the Unit first");
      return;
    }

    // Convert size to grams based on unit
    const gramWeight = convertToGrams(formData.size, formData.unit);

    // Add converted size into a clean request object
    const finalPayload = {
      ...formData,
      size: gramWeight.toString(), // Ensure it's stored as string
    };

    // Now send converted data to API
    const resultAction = await dispatch(addProduct(finalPayload));

    if (addProduct.fulfilled.match(resultAction)) {
      dispatch(fetchProducts());
    }

    setFormData(initialForm);
    setOpenForm(false);
  };

  // Update Product
  const handleUpdate = () => {
    if (!editProduct?.id) return;

    // Unit required before conversion
    if (!formData.unit) {
      alert("Please select the Unit first");
      return;
    }

    // Convert size to grams based on unit (same as in handleAdd)
    const gramWeight = convertToGrams(formData.size, formData.unit);

    const finalPayload = {
      ...formData,
      size: gramWeight.toString(), // Ensure it's stored as string
    };

    dispatch(updateProduct({ id: editProduct.id, data: finalPayload }));
    setEditProduct(null);
    setFormData(initialForm);
    setOpenForm(false);
  };

  // Delete Product (with confirmation)
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      dispatch(deleteProduct(id));
    }
  };

  const startEdit = (p) => {
    setEditProduct(p);

    // Convert stored grams back to display unit
    const displaySize = convertFromGrams(p.size, p.unit);

    setFormData({
      category_id: p.category_id ?? "",
      product_name: p.product_name ?? "",
      size: displaySize, // Show converted size for editing
      purchase_rate: p.purchase_rate ?? "",
      transport_charge: p.transport_charge ?? 10,
      local_transport: p.local_transport ?? 5,
      packaging_cost: p.packaging_cost ?? 1.5,
      hsn_code: p.hsn_code ?? "",
      value: p.value ?? "",
      discount_30: p.discount_30 ?? 0,
      discount_25: p.discount_25 ?? 0,
      total: p.total ?? "",
      gst: p.gst ?? "",
      gstAmount: p.gstAmount ?? 0,
      unit: p?.unit || "",
      pieces: p?.pieces || "",
    });
    setOpenForm(true);
  };

  // Filters
  const filteredProducts = products.filter((p) => {
    const categoryMatch = filterCategory
      ? p.category_id === filterCategory
      : true;
    const q = filterProduct.toLowerCase();
    const productMatch = filterProduct
      ? p.product_name?.toLowerCase().includes(q) ||
        String(p.size ?? "")
          .toLowerCase()
          .includes(q)
      : true;
    return categoryMatch && productMatch;
  });

  const groupedProducts = categories.map((cat) => ({
    ...cat,
    products: filteredProducts.filter((p) => p.category_id === cat.id),
  }));

  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex bg-white shadow-lg rounded justify-between items-center mb-4 px-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          📦 Product Management
        </h1>

        <div>
          <div className="my-4 flex gap-4 items-center">
            {/* Search Product */}
            <input
              type="text"
              placeholder="Search Product..."
              className="border p-2 rounded-lg bg-gray-50 flex-1"
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
            />

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(Number(e.target.value))}
              className="border p-2 rounded-lg bg-gray-50"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Add Product Button */}
            <button
              onClick={() => {
                setEditProduct(null);
                setFormData(initialForm);
                setOpenForm(true);
              }}
              className="px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition"
            >
              ➕ Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {(openForm || open) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100 w-11/12 max-w-5xl max-h-[100vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-700 flex items-center gap-2">
              {editProduct ? "✏️ Edit Product" : "🛒 Add New Product"}
            </h2>

            {/* Single Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  Category
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Name */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  Product Name
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name || ""}
                  onChange={handleChange}
                  className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select unit</option>
                  <option value="ton">Ton</option>
                  <option value="litter">Liter</option>
                  <option value="quantal">Quintal</option>
                  <option value="kg">KG</option>
                  <option value="gram">Gram</option>
                  <option value="box">Box</option>
                </select>
              </div>

              {/* Size */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  Quantity (
                  {formData.unit
                    ? `in ${formData.unit}`
                    : "e.g., 5KG, 10KG, 1L"}
                  )
                </label>
                <input
                  type="number"
                  name="size"
                  value={formData.size || ""}
                  onChange={handleChange}
                  placeholder={
                    formData.unit
                      ? `Enter quantity in ${formData.unit}`
                      : "Select unit first"
                  }
                  className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  required
                  step="0.01"
                />
                <small className="text-gray-500 mt-1">
                  This will be converted to grams for storage
                </small>
              </div>

              {openoPiecesFields && (
                <div className="flex flex-col">
                  <label className="mb-2 text-sm font-semibold text-gray-600">
                    Pieces in Box
                  </label>
                  <input
                    type="number"
                    name="pieces"
                    value={formData.pieces}
                    onChange={handleChange}
                    placeholder="Number of pieces in box"
                    className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              {/* Purchase Rate */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  Purchase Rate
                </label>
                <input
                  type="number"
                  name="purchase_rate"
                  value={formData.purchase_rate || ""}
                  onChange={handleChange}
                  className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  required
                  step="0.01"
                />
              </div>

              {/* Transport */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  Transport
                </label>
                <input
                  type="number"
                  name="transport_charge"
                  value={formData.transport_charge || 10}
                  onChange={handleChange}
                  className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  required
                  step="0.01"
                />
              </div>

              {/* Local Transport */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  Local Transport
                </label>
                <input
                  type="number"
                  name="local_transport"
                  value={formData.local_transport || 5}
                  onChange={handleChange}
                  className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  required
                  step="0.01"
                />
              </div>

              {/* Packaging */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  Packaging Cost
                </label>
                <input
                  type="number"
                  name="packaging_cost"
                  value={formData.packaging_cost || 1.5}
                  onChange={handleChange}
                  className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  required
                  step="0.01"
                />
              </div>

              {/* HSN Code */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  HSN Code
                </label>
                <input
                  type="text"
                  name="hsn_code"
                  value={formData.hsn_code || ""}
                  onChange={handleChange}
                  className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* GST */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  GST %
                </label>
                <input
                  type="number"
                  name="gst"
                  value={formData.gst || ""}
                  onChange={handleChange}
                  className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  required
                  step="0.01"
                />
              </div>

              {/* ReadOnly Fields */}
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  Value (Landed Cost)
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value || ""}
                  readOnly
                  className="border p-3 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  5KG 30% / Margin
                </label>
                <input
                  type="number"
                  value={formData.discount_30 || ""}
                  readOnly
                  className="border p-3 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  10KG 25% / Margin
                </label>
                <input
                  type="number"
                  value={formData.discount_25 || ""}
                  readOnly
                  className="border p-3 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div className="flex flex-col md:col-span-3">
                <label className="mb-2 text-sm font-semibold text-gray-600">
                  Total Sales Rate (Value × 1.5)
                </label>
                <input
                  type="number"
                  value={formData.total || ""}
                  readOnly
                  className="border p-3 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setOpenForm(false);
                  hide(false);
                  setEditProduct(null);
                  setFormData(initialForm);
                }}
                className="px-6 cursor-pointer py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                ❌ Cancel
              </button>
              {editProduct ? (
                <button
                  onClick={handleUpdate}
                  className="px-6 py-2 cursor-pointer bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  ✅ Update Product
                </button>
              ) : (
                <button
                  onClick={handleAdd}
                  className="px-6 py-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  ➕ Add Product
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-xl rounded-2xl border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-sm text-black sticky top-0 shadow-md">
              <tr>
                <th className="p-3">S/No.</th>
                <th className="p-3">HSN Code</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Unit</th>
                {/* <th className="p-3">Pieces</th> */}
                <th className="p-3">Sales Rate</th>
                <th className="p-3 text-center">Details</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedProducts.map((cat) => {
                return (
                  <React.Fragment key={cat.id}>
                    {/* Category Row */}
                    <tr className="bg-yellow-200">
                      <td
                        colSpan="9"
                        className="p-3 font-bold text-gray-800 text-lg"
                      >
                        {cat.name}
                      </td>
                    </tr>
                    {cat.products.map((p, index) => {
                      // Convert stored grams back to display unit for table
                      const displaySize = convertFromGrams(p.size, p.unit);

                      return (
                        <tr
                          key={p.id}
                          className="border-b hover:bg-gray-50 transition duration-200 ease-in-out hover:shadow-lg"
                        >
                          <td className="p-3 text-center font-medium">
                            {index + 1}
                          </td>
                          <td className="p-3">{p.hsn_code || "-"}</td>
                          <td className="p-3 font-semibold text-gray-700">
                            {p.product_name}{" "}
                            {p?.type == "custom" && `(${p?.type})`}
                          </td>
                          <td className="p-3">
                            {displaySize ? displaySize.toFixed(3) : "-"}
                          </td>
                          <td className="p-3">
                            {p?.unit == "quantal" ? "Quintal" : p?.unit || "-"}
                          </td>
                          {/* <td className="p-3">{p?.pieces || "-"}</td> */}
                          <td className="p-3 font-bold text-green-600">
                            ₹{p.total || "0.00"}
                          </td>
                          <td className="p-3 text-center">
                            <IconButton
                              color="primary"
                              className="hover:scale-110 transition-transform"
                              onClick={() => setViewProduct(p)}
                              title="View Details"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <IconButton
                                color="primary"
                                className="hover:scale-110 transition-transform"
                                onClick={() => {
                                  if (p.type !== "custom") {
                                    startEdit(p);
                                  } else {
                                    navigate(`/customproduct/${p.id}`);
                                  }
                                }}
                                title={
                                  p.type === "custom"
                                    ? "Edit Custom Product"
                                    : "Edit Product"
                                }
                              >
                                <EditIcon />
                              </IconButton>

                              <IconButton
                                color="error"
                                className="hover:scale-110 transition-transform"
                                onClick={() => handleDelete(p.id)}
                                title="Delete"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View Product Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    📦 Product Details
                  </h2>
                  <p className="text-blue-100 mt-1">
                    {viewProduct.product_name}
                  </p>
                </div>
                <button
                  onClick={() => setViewProduct(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Basic Information Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📋 Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      HSN Code
                    </label>
                    <p className="text-lg font-semibold text-gray-800 mt-1">
                      {viewProduct.hsn_code || "-"}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Product Name
                    </label>
                    <p className="text-lg font-semibold text-gray-800 mt-1">
                      {viewProduct.product_name}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Size/QTY
                    </label>
                    <p className="text-lg font-semibold text-gray-800 mt-1">
                      {convertFromGrams(
                        viewProduct.size,
                        viewProduct.unit
                      ).toFixed(3)}{" "}
                      {viewProduct.unit}
                      <br />
                      <small className="text-gray-500">
                        (Stored as {viewProduct.size} grams)
                      </small>
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Unit
                    </label>
                    <p className="text-lg font-semibold text-gray-800 mt-1">
                      {viewProduct.unit || "-"}
                    </p>
                  </div>
                  {viewProduct.pieces && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Pieces in Box
                      </label>
                      <p className="text-lg font-semibold text-gray-800 mt-1">
                        {viewProduct.pieces}
                      </p>
                    </div>
                  )}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      GST Rate
                    </label>
                    <p className="text-lg font-semibold text-green-600 mt-1">
                      {viewProduct.gst}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  💰 Cost Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Purchase Rate
                    </label>
                    <p className="text-xl font-bold text-blue-600 mt-1">
                      ₹{viewProduct.purchase_rate || "0.00"}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Transport Charge
                    </label>
                    <p className="text-xl font-bold text-orange-600 mt-1">
                      ₹{viewProduct.transport_charge || "0.00"}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Local Transport
                    </label>
                    <p className="text-xl font-bold text-orange-600 mt-1">
                      ₹{viewProduct.local_transport || "0.00"}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Packaging Cost
                    </label>
                    <p className="text-xl font-bold text-purple-600 mt-1">
                      ₹{viewProduct.packaging_cost || "0.00"}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm col-span-1 md:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total Value (Landed Cost)
                    </label>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      ₹{viewProduct.value || "0.00"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing & Margins Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📈 Pricing & Margins
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      5KG 30% Margin
                    </label>
                    <p className="text-xl font-bold text-indigo-600 mt-1">
                      ₹{viewProduct.discount_30 || "0.00"}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      10KG 25% Margin
                    </label>
                    <p className="text-xl font-bold text-indigo-600 mt-1">
                      ₹{viewProduct.discount_25 || "0.00"}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total Sales Rate
                    </label>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      ₹{viewProduct.total || "0.00"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 flex justify-end">
              <button
                onClick={() => setViewProduct(null)}
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
