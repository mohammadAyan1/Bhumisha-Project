import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchClustersInventoryByClusterId } from "../../features/ClusterInventory/ClusterInventory";
import { fetchFarmers } from "../../features/farmers/farmerSlice";
import { fetchClusters } from "../../features/clusterAdded/ClusterAdded";
import {
  createClusterTransaction,
  fetchClusterTransaction,
} from "../../features/ClusterTransaction/ClusterTransaction";

import { fetchAllClustersProduct } from "../../features/ClusterProducts/ClusterProducts";
import clusterTransactionApi from "../../axios/clusterTransactionApi";

const ClusterTransaction = () => {
  const dispatch = useDispatch();

  const [cluster, setCluster] = useState([]);
  const [clusterTransactionId, setClusterTransactionId] = useState(null);
  const [openModel, setOpenModel] = useState(false);
  const [farmer, setFarmer] = useState([]);
  const [clusterProducts, setClusterProducts] = useState([]);

  // ⭐ NEW FIELD for available quantity
  const [availableQtyKG, setAvailableQtyKG] = useState(0);

  const { clusterTransaction } = useSelector(
    (state) => state.clusterTransaction
  );

  const [formData, setFormData] = useState({
    clusterId: "",
    farmerId: "",
    productList: [],
    productName: "",
    salesRate: "",
    purchaseRate: "",
    type: "sale",
    gstper: "",
    date: "",
    billno: "",
    total: "",
    paid: "",
    remaining: "",
    qty: "",
    unit: "",
    qtyGram: 0,
    remarks: "",
  });

  useEffect(() => {
    dispatch(fetchFarmers()).then((res) => setFarmer(res?.payload));
    dispatch(fetchClusters()).then((res) => setCluster(res?.payload));
    dispatch(fetchClusterTransaction());
  }, [dispatch]);

  // ----------------------------------
  // UNIT CONVERSION FUNCTION
  // ----------------------------------
  const convertToGram = (qty, unit) => {
    if (!qty || !unit) return 0;
    qty = parseFloat(qty);

    switch (unit) {
      case "kg":
        return qty * 1000;
      case "gram":
        return qty;
      case "quintal":
        return qty * 100000;
      case "ton":
        return qty * 1000000;
      default:
        return qty;
    }
  };

  const PayModal = ({ isOpen, onClose, clusterTransactionId }) => {
    const handlePayMoney = (e) => {
      e.preventDefault();
      console.log(clusterTransactionId);
      console.log("Payment submitted");
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white p-5 rounded w-[350px]">
          <form onSubmit={handlePayMoney}>
            <div className="space-y-3">
              <div>
                <label>Amount</label>
                <input
                  type="number"
                  className="border w-full p-2"
                  placeholder="Pay here"
                  required
                />
              </div>

              <div>
                <label>Remarks</label>
                <input
                  type="text"
                  className="border w-full p-2"
                  placeholder="Message"
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ----------------------------------
  // CALCULATE TOTAL
  // ----------------------------------
  const calculateTotal = ({ type, salesRate, purchaseRate, qty, unit }) => {
    if (!qty || !unit || !type) return "";

    const qtyGram = convertToGram(qty, unit);
    const qtyKG = qtyGram / 1000;

    let rate =
      type === "purchase"
        ? parseFloat(purchaseRate || 0)
        : parseFloat(salesRate || 0);

    return (rate * qtyKG).toFixed(2);
  };

  // ----------------------------------
  // INPUT CHANGE HANDLER
  // ----------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // PRODUCT SELECTED
    if (name === "product") {
      const selected = JSON.parse(value);

      // ⭐ Set Available Qty in KG (readonly field)
      setAvailableQtyKG(parseFloat(selected.qty) / 1000);

      return setFormData((prev) => ({
        ...prev,
        productList: selected,
        productName: selected?.product_name,
        salesRate: selected?.product_sale_rate || selected?.sale_rate,
        purchaseRate:
          selected?.product_purchase_rate || selected?.purchase_rate,
      }));
    }

    const updatedData = { ...formData, [name]: value };

    // Convert qty to gram
    const qtyGram = convertToGram(updatedData?.qty, updatedData?.unit);
    updatedData.qtyGram = qtyGram;

    // ⭐ SALE VALIDATION (NO OVERSELL)
    if (updatedData.type === "sale") {
      if (qtyGram / 1000 > availableQtyKG) {
        alert("❌ You cannot sell more than available quantity!");
        updatedData.qty = "";
        updatedData.qtyGram = 0;
      }
    }

    // Recalculate TOTAL
    updatedData.total = calculateTotal(updatedData);

    // Recalculate REMAINING AMOUNT
    const paid = parseFloat(updatedData?.paid || 0);
    const total = parseFloat(updatedData?.total || 0);
    updatedData.remaining = (total - paid).toFixed(2);

    setFormData(updatedData);
  };

  // ----------------------------------
  // SUBMIT FORM
  // ----------------------------------
  const handleSubmitForm = (e) => {
    e.preventDefault();
    dispatch(createClusterTransaction(formData)).then(() => {
      dispatch(fetchClusterTransaction());
      setFormData({
        clusterId: "",
        farmerId: "",
        productList: [],
        productName: "",
        salesRate: "",
        purchaseRate: "",
        type: "",
        gstper: "",
        date: "",
        billno: "",
        total: "",
        paid: "",
        remaining: "",
        qty: "",
        unit: "",
        qtyGram: 0,
        remarks: "",
      });
      setAvailableQtyKG(0);
    });
  };

  useEffect(() => {
    if (formData?.type === "sale" && formData?.clusterId) {
      dispatch(fetchClustersInventoryByClusterId(formData.clusterId)).then(
        (res) => {
          setClusterProducts(res?.payload?.data);
        }
      );
    } else if (formData?.type === "purchase") {
      dispatch(fetchAllClustersProduct()).then((res) => {
        setClusterProducts(res?.payload?.data);
      });
    }
  }, [dispatch, formData]);

  const handleDelete = (id) => {
    clusterTransactionApi.delete(id).then(() => {
      dispatch(fetchClusterTransaction());
    });
  };

  // const handleEdit = (data) => {
  //   const clusterProductData = clusterProducts?.find(
  //     (item) => item?.id == data?.productList?.id
  //   );
  //   const clusterData = cluster?.find((item) => item?.id == data?.clusterId);
  //   const farmerData = farmer?.find((item) => item?.id == data?.farmerId);

  //   setAvailableQtyKG();

  //   setFormData((prev) => ({
  //     ...prev,
  //     clusterId: data?.clusterId,
  //     farmerId: data?.farmerId,
  //     productList: JSON.stringify(data?.productList),
  //     productName: data?.productName,
  //     salesRate: data?.salesRate,
  //     purchaseRate: data?.purchaseRate,
  //     type: data?.type,
  //     gstper: data?.gstper,
  //     date: data?.date,
  //     billno: data?.billno,
  //     total: data?.total,
  //     paid: data?.paid,
  //     remaining: Number(data?.total) - Number(data?.paid),
  //     qty: data?.qty,
  //     unit: data?.unit,
  //     qtyGram: convertToGram(data?.qty, data?.unit),
  //     remarks: data?.remarks,
  //   }));
  // };

  // const handlePayClusterTransaction = () => {};

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* FORM */}
      <div className="max-w-3xl mx-auto bg-white shadow-lg p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">
          Cluster Transaction
        </h2>

        <form onSubmit={handleSubmitForm} className="grid grid-cols-2 gap-4">
          {/* TYPE */}
          <div>
            <label className="font-medium">Type</label>
            <select
              name="type"
              value={formData?.type}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="sale">Sale</option>
              <option value="purchase">Purchase</option>
            </select>
          </div>

          {/* CLUSTER */}
          <div>
            <label className="font-medium">Cluster</label>
            <select
              name="clusterId"
              value={formData?.clusterId}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">Select Cluster</option>
              {cluster.map((item) => (
                <option key={item?.id} value={item?.id}>
                  {item?.cluster_name_changes}
                </option>
              ))}
            </select>
          </div>

          {/* FARMER */}
          <div>
            <label className="font-medium">Farmer</label>
            <select
              name="farmerId"
              value={formData?.farmerId}
              required
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Farmer</option>
              {farmer.map((item) => (
                <option key={item?.id} value={item?.id}>
                  {item?.name}
                </option>
              ))}
            </select>
          </div>

          {/* PRODUCT */}
          <div>
            <label className="font-medium">Product</label>
            <select
              name="product"
              value={formData?.product}
              required
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Product</option>
              {clusterProducts.map((item) => (
                <option key={item?.id} value={JSON.stringify(item)}>
                  {item?.product_name || item?.name}
                </option>
              ))}
            </select>
          </div>

          {/* ⭐ NEW FIELD: AVAILABLE QUANTITY (KG) */}
          <div>
            <label className="font-medium">Available Qty (Quantal)</label>
            <input
              type="text"
              readOnly
              value={(availableQtyKG / 100).toFixed(2)}
              className="w-full p-2 border bg-gray-200 rounded"
            />
          </div>

          {/* RATES */}
          <div>
            <label className="font-medium">Purchase Rate (per kg)</label>
            <input
              type="text"
              name="purchaseRate"
              value={formData?.purchaseRate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="font-medium">Sales Rate (per kg)</label>
            <input
              type="text"
              name="salesRate"
              value={formData?.salesRate}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* QTY + UNIT */}
          <div>
            <label className="font-medium">Quantity</label>
            <input
              type="text"
              name="qty"
              value={formData?.qty}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="font-medium">Unit</label>
            <select
              name="unit"
              value={formData?.unit}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Unit</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="gram">Gram</option>
              <option value="quintal">Quintal</option>
              <option value="ton">Ton</option>
            </select>
          </div>

          {/* TOTAL */}
          <div className="col-span-2">
            <label className="font-medium">Total Amount</label>
            <input
              type="text"
              readOnly
              value={formData?.total}
              className="w-full p-2 border bg-gray-100 rounded"
            />
          </div>

          {/* BILL DETAILS */}
          <div>
            <label className="font-medium">Bill No</label>
            <input
              name="billno"
              value={formData?.billno}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="font-medium">Paid</label>
            <input
              name="paid"
              value={formData?.paid}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="font-medium">Remaining</label>
            <input
              name="remaining"
              value={formData?.remaining}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="font-medium">GST %</label>
            <input
              name="gstper"
              value={formData?.gstper}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="font-medium">Date</label>
            <input
              type="date"
              name="date"
              value={formData?.date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="col-span-2">
            <label className="font-medium">Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows="3"
            />
          </div>

          <div className="col-span-2">
            <button
              type="submit"
              className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* TRANSACTION TABLE */}
      <div className="mt-10 bg-white shadow-md rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Transactions</h2>

        <table className="w-full border-collapse border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2">Cluster Manager</th>
              <th className="border p-2">Farmer Name</th>
              <th className="border p-2">Product</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Bill NO</th>
              <th className="border p-2">Purchase Rate(Kg)</th>
              <th className="border p-2">Sales Rate(kg)</th>
              <th className="border p-2">Unit</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Total</th>
              <th className="border p-2">Paid</th>
              <th className="border p-2">Remaining</th>
              <th className="border p-2">Remarks</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {clusterTransaction?.map((item) => {
              console.log("====================================");
              console.log(item);
              console.log("====================================");
              return (
                <tr key={item?.id}>
                  <td className="border p-2">{item?.cluster_manager}</td>
                  <td className="border p-2">{item?.farmer_name}</td>
                  <td className="border p-2">{item?.productName}</td>
                  <td className="border p-2">{item?.qty}</td>
                  <td className="border p-2">{item?.billno}</td>
                  <td className="border p-2">{item?.purchaseRate}</td>
                  <td className="border p-2">{item?.salesRate}</td>
                  <td className="border p-2">{item?.unit}</td>
                  <td className="border p-2">{item?.type}</td>
                  <td className="border p-2">{item?.total}</td>
                  <td className="border p-2">{item?.paid}</td>
                  <td className="border p-2">{item?.remaining}</td>
                  <td className="border p-2">{item?.remarks}</td>
                  <td className="border p-2">
                    <div className="flex justify-between gap-1">
                      <span
                        onClick={() => handleDelete(item?.id)}
                        className="p-1 border border-red-400 hover:bg-red-500 cursor-pointer"
                      >
                        🗑️
                      </span>
                      {/* <span
                        onClick={() => {
                          setClusterTransactionId(item?.id), setOpenModel(true);
                        }}
                        className="p-1 border border-blue-400 hover:bg-blue-500 cursor-pointer"
                      >
                        Pay
                      </span> */}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PayModal
        isOpen={openModel}
        onClose={() => setOpenModel(false)}
        clusterTransactionId={clusterTransactionId}
      />
    </div>
  );
};

export default ClusterTransaction;
