import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllClustersProduct } from "../features/ClusterProducts/ClusterProducts";
import { fetchClusters } from "../features/clusterAdded/ClusterAdded";
import {
  addClusterInventory,
  fetchClustersInventory,
  updateClusterInventory,
  deleteClusterInventory,
} from "../features/ClusterInventory/ClusterInventory";
import { toast } from "react-toastify";

const ClusterInventory = () => {
  const dispatch = useDispatch();
  const [cluster, setCluster] = useState([]);

  const uniConvertionFn = (qty, unit) => {
    if (unit == "ton") {
      return qty / 1000 / 1000;
    } else if (unit == "kg" || unit == "liter") {
      return qty / 1000;
    } else if (unit == "quintal") {
      return qty / 1000 / 100;
    } else return qty;
  };

  const [editOn, setEditOn] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    clusterId: "",
    qty: "",
    purchase: "",
    sale: "",
    date: Date.now(),
    unit: "",
    hsn: "",
    id: "",
  });

  const { list } = useSelector((state) => state.secondClusterProducts);
  const { clusterInventory } = useSelector((state) => state.clusterInventory);

  useEffect(() => {
    dispatch(fetchAllClustersProduct());
    dispatch(fetchClusters())
      .then((res) => {
        setCluster(res?.payload);
      })
      .catch((err) => {
        console.error(err);
      });
    dispatch(fetchClustersInventory());
  }, [dispatch]);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "productId") {
      const product = list?.find((p) => p.id == value);

      setFormData((prev) => ({
        ...prev,
        productId: value,
        hsn: product?.hsn_number,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Convert quantity to grams before sending
  const convertToGrams = (qty, unit) => {
    if (!qty) return 0;
    switch (unit) {
      case "kg":
        return qty * 1000;
      case "liter":
        return qty * 1000;
      case "ton":
        return qty * 1000000;
      case "quintal":
        return qty * 100000;
      case "gram":
        return qty;
      default:
        return qty;
    }
  };

  const handleSubmitData = (e) => {
    e.preventDefault();

    // Convert quantity to grams
    const qtyInGram = convertToGrams(formData.qty, formData.unit);
    if (!editOn) {
      dispatch(
        addClusterInventory({
          ...formData,
          qty: qtyInGram, // always save in grams
        })
      ).then(() => {
        toast.success("Cluster Product added successfully");
        dispatch(fetchClustersInventory());
      });
    } else {
      dispatch(
        updateClusterInventory({
          ...formData,
          qty: qtyInGram, // always save in grams
        })
      ).then(() => {
        toast.success("Cluster Product Updated successfully");
        dispatch(fetchClustersInventory());
      });
      setEditOn(false);
    }

    // Reset form
    setFormData({
      productId: "",
      clusterId: "",
      qty: "",
      purchase: "",
      sale: "",
      date: "",
      unit: "",
      hsn: "",
    });
  };

  const handleDelete = (id) => {
    dispatch(deleteClusterInventory(id));
  };

  const handleEdit = (data) => {
    if (!list.length || !cluster.length) return;

    setEditOn(true);

    const product = list.find((p) => Number(p.id) === Number(data.product_id));

    const clusterItem = cluster.find(
      (c) => Number(c.id) === Number(data.cluster_id)
    );

    setFormData({
      productId: product ? String(product.id) : "",
      clusterId: clusterItem ? String(clusterItem.id) : "",
      qty: uniConvertionFn(data.qty, data.unit),
      purchase: data.purchase_rate,
      sale: data.sale_rate,
      date: Date.now(),
      unit: data.unit,
      hsn: product?.hsn_number || "",
      id: data?.id,
    });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Form Card */}
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Add Cluster Inventory
        </h2>
        <form
          onSubmit={handleSubmitData}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Product Dropdown */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Product</label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleInputChange}
              required
              className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Product</option>
              {list?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cluster Dropdown */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Cluster</label>
            <select
              name="clusterId"
              value={formData.clusterId}
              onChange={handleInputChange}
              required
              className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Cluster</option>
              {cluster?.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.cluster_name_changes}
                </option>
              ))}
            </select>
          </div>

          {/* Purchase Rate Editable */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">
              Purchase Rate
            </label>
            <input
              type="number"
              name="purchase"
              value={formData.purchase}
              onChange={handleInputChange} // now editable
              required
              className="border rounded-lg p-2"
              placeholder="Enter purchase rate"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">HSN Number</label>
            <input
              type="text"
              value={formData.hsn}
              readOnly
              className="border rounded-lg p-2"
              placeholder="Enter HSN Number"
            />
          </div>

          {/* Sale Rate Editable */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Sale Rate</label>
            <input
              type="number"
              name="sale"
              value={formData.sale}
              onChange={handleInputChange} // now editable
              required
              className="border rounded-lg p-2"
              placeholder="Enter sale rate"
            />
          </div>

          {/* Quantity */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              name="qty"
              value={formData.qty}
              onChange={handleInputChange}
              required
              className="border rounded-lg p-2"
            />
          </div>

          {/* Unit */}
          <div className="flex flex-col">
            <label className="mb-2 font-medium text-gray-700">Unit</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              required
              className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Unit</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="ton">Ton</option>
              <option value="liter">liter</option>
              <option value="quintal">Quintal</option>
              <option value="gram">Gram (g)</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {editOn ? "Update" : "Submit"}
            </button>
          </div>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 overflow-x-auto">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Cluster Inventory List
        </h2>
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border-b text-left">Product</th>
              <th className="py-2 px-4 border-b text-left">Cluster name</th>
              <th className="py-2 px-4 border-b text-left">Purchase Rate</th>
              <th className="py-2 px-4 border-b text-left">Sale Rate</th>
              <th className="py-2 px-4 border-b text-left">
                Quantity (Quantal)
              </th>
              <th className="py-2 px-4 border-b text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {clusterInventory?.map((item) => {
              return (
                <tr key={item?.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{item?.product_name}</td>
                  <td className="py-2 px-4 border-b">{item?.cluster_name}</td>
                  <td className="py-2 px-4 border-b">{item?.purchase_rate}</td>
                  <td className="py-2 px-4 border-b">{item?.sale_rate}</td>
                  <td className="py-2 px-4 border-b">
                    {(item?.qty / 1000 / 100).toFixed(2)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className=" flex justify-between">
                      <span
                        onClick={() => handleEdit(item)}
                        className="border border-blue-600 p-1 hover:bg-blue-600"
                      >
                        ✏️
                      </span>
                      <span
                        onClick={() => handleDelete(item?.id)}
                        className="border border-red-600 p-1 hover:bg-red-600"
                      >
                        🗑️
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClusterInventory;
