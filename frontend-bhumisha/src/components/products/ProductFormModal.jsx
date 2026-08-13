import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../../features/Categories/categoiresSlice";
import { addProduct, updateProduct, fetchProducts } from "../../features/products/productsSlice";

// Display helper
const fx = (n) => (isNaN(n) ? 0 : Number(n));

const getDiscountsFromValue = (value) => ({
  discount_30: (value * 30) / 100,
  discount_25: (value * 25) / 100,
});

// Helper function to convert size to grams
export const convertToGrams = (size, unit) => {
  const numericValue = Number(size || 0);
  if (numericValue <= 0) return numericValue;

  switch (unit) {
    case "ton":
      return numericValue * 1000 * 1000;
    case "quantal":
      return numericValue * 100 * 1000;
    case "kg":
      return numericValue * 1000;
    case "litter":
      return numericValue * 1000;
    case "gram":
    default:
      return numericValue;
  }
};

export const convertFromGrams = (grams, unit) => {
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

export const initialProductForm = {
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

export default function ProductFormModal({ open, hide, editProduct, onSuccess }) {
  const dispatch = useDispatch();
  const { list: categories } = useSelector((state) => state.categories);

  const [formData, setFormData] = useState(initialProductForm);
  const [openPiecesFields, setOpenPiecesFields] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (editProduct) {
      const displaySize = convertFromGrams(editProduct.size, editProduct.unit);
      setFormData({
        category_id: editProduct.category_id ?? "",
        product_name: editProduct.product_name ?? "",
        size: displaySize,
        purchase_rate: editProduct.purchase_rate ?? "",
        transport_charge: editProduct.transport_charge ?? 10,
        local_transport: editProduct.local_transport ?? 5,
        packaging_cost: editProduct.packaging_cost ?? 1.5,
        hsn_code: editProduct.hsn_code ?? "",
        value: editProduct.value ?? "",
        discount_30: editProduct.discount_30 ?? 0,
        discount_25: editProduct.discount_25 ?? 0,
        total: editProduct.total ?? "",
        gst: editProduct.gst ?? "",
        gstAmount: editProduct.gstAmount ?? 0,
        unit: editProduct?.unit || "",
        pieces: editProduct?.pieces || "",
      });
    } else {
      setFormData(initialProductForm);
    }
  }, [editProduct]);

  useEffect(() => {
    const purchase = fx(formData.purchase_rate);
    const transport = fx(formData.transport_charge);
    const local = fx(formData.local_transport);
    const packaging = fx(formData.packaging_cost);

    const value = purchase + transport + local + packaging;
    const { discount_30, discount_25 } = getDiscountsFromValue(value);
    const salesRate = value * 1.5;

    setFormData((prev) => ({
      ...prev,
      value,
      discount_30,
      discount_25,
      total: salesRate,
      gstAmount: prev.gstAmount ?? 0,
    }));
  }, [
    formData.purchase_rate,
    formData.transport_charge,
    formData.local_transport,
    formData.packaging_cost,
  ]);

  useEffect(() => {
    if (formData?.unit === "box") {
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
    if (!formData.unit) {
      alert("Please select the Unit first");
      return;
    }

    const gramWeight = convertToGrams(formData.size, formData.unit);

    const finalPayload = {
      ...formData,
      size: gramWeight.toString(),
    };

    const resultAction = await dispatch(addProduct(finalPayload));

    if (addProduct.fulfilled.match(resultAction)) {
      dispatch(fetchProducts());
      if (onSuccess) onSuccess(resultAction.payload);
    }

    setFormData(initialProductForm);
    hide();
  };

  const handleUpdate = () => {
    if (!editProduct?.id) return;
    if (!formData.unit) {
      alert("Please select the Unit first");
      return;
    }

    const gramWeight = convertToGrams(formData.size, formData.unit);

    const finalPayload = {
      ...formData,
      size: gramWeight.toString(),
    };

    dispatch(updateProduct({ id: editProduct.id, data: finalPayload }));
    setFormData(initialProductForm);
    hide();
    if (onSuccess) onSuccess();
  };

  if (!open) return null;

  return (
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
              {formData.unit ? `in ${formData.unit}` : "e.g., 5KG, 10KG, 1L"}
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

          {openPiecesFields && (
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
              setFormData(initialProductForm);
              hide();
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
  );
}
