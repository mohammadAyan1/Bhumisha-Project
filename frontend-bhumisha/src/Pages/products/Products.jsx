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

import ProductFormModal, { convertToGrams, convertFromGrams } from "../../components/products/ProductFormModal";

export default function Products({ open, hide }) {
  const dispatch = useDispatch();
  const { list: products, loading } = useSelector((state) => state.products);
  const { list: categories } = useSelector((state) => state.categories);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [openoPiecesFields, setOpenPiecesFields] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  // Update Product (handled by ProductFormModal)

  // Delete Product (with confirmation)
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      dispatch(deleteProduct(id));
    }
  };

  const startEdit = (p) => {
    setEditProduct(p);

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
      <ProductFormModal
        open={openForm || open}
        hide={() => {
          setOpenForm(false);
          hide && hide(false);
          setEditProduct(null);
        }}
        editProduct={editProduct}
        onSuccess={() => {
          // fetchProducts is already called inside modal on success
        }}
      />

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
