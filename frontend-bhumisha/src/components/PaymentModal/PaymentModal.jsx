import React, { useState, useEffect } from "react";
import payBillAPI from "../../axios/payBill";

const PaymentModal = ({ bill, onClose, onSuccess }) => {
  const [billDetails, setBillDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    remark: "",
    payment_method: "Cash",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingPayment, setEditingPayment] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showItems, setShowItems] = useState(true);

  useEffect(() => {
    fetchBillDetails();
  }, [bill]);

  const fetchBillDetails = () => {
    setLoading(true);
    setError("");
    payBillAPI
      .getBillDetails(bill.bill_type, bill.id)
      .then((res) => {
        if (res.data.success) {
          setBillDetails(res.data.data);
          setFormData((prev) => ({
            ...prev,
            amount: (res.data.data.left_amount || 0).toString(),
          }));
        } else {
          setError(res.data.message || "Failed to fetch bill details");
        }
      })
      .catch((err) => {
        console.error(
          "Error fetching bill details:",
          err.response?.data || err.message
        );
        setError(err.response?.data?.message || "Failed to load bill details");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "amount") {
      const numericValue = value.replace(/[^0-9.]/g, "");
      const maxAmount = billDetails?.left_amount || 0;

      if (parseFloat(numericValue) > maxAmount) {
        setError(`Amount cannot exceed ${formatCurrency(maxAmount)}`);
      } else {
        setError("");
      }

      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else if (name === "payment_method") {
      setPaymentMethod(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setError("");
    setSuccess("");
    setPaymentLoading(true);

    try {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      const amount = parseFloat(formData.amount);
      if (amount > (billDetails?.left_amount || 0)) {
        setError(
          `Amount cannot exceed ${formatCurrency(
            billDetails?.left_amount || 0
          )}`
        );
        return;
      }

      const paymentData = {
        billId: bill.id,
        billType: bill.bill_type,
        amount: amount,
        remark: formData.remark,
        payment_method: paymentMethod || "Cash",
      };

      const res = await payBillAPI.createPayment(paymentData);

      if (res.data.success) {
        setSuccess("Payment created successfully!");

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setError(res.data.message || "Payment failed");
      }
    } catch (err) {
      console.error("Payment error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to create payment");
    } finally {
      setPaymentLoading(false);
      setIsProcessing(false);
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setShowEditForm(true);
    setFormData({
      amount: payment.amount.toString(),
      remark: payment.remark || "",
      payment_method: payment.method || "Cash",
    });
    setPaymentMethod(payment.method || "Cash");
    setError("");
    setSuccess("");
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setError("");
    setSuccess("");
    setPaymentLoading(true);

    try {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      const paymentData = {
        amount: parseFloat(formData.amount),
        remark: formData.remark,
        payment_method: paymentMethod || formData.payment_method,
      };

      const res = await payBillAPI.updatePayment(
        editingPayment.id,
        paymentData
      );

      if (res.data.success) {
        setSuccess("Payment updated successfully!");

        setTimeout(() => {
          fetchBillDetails();
          setShowEditForm(false);
          setEditingPayment(null);
        }, 1000);
      } else {
        setError(res.data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to update payment");
    } finally {
      setPaymentLoading(false);
      setIsProcessing(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    const paymentType = bill?.bill_type;

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    setPaymentLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await payBillAPI.deletePayment(paymentId, paymentType);

      if (res.data.success) {
        setSuccess("Payment deleted successfully!");

        setTimeout(() => {
          fetchBillDetails();
        }, 1000);
      } else {
        setError(res.data.message || "Delete failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete payment");
    } finally {
      setPaymentLoading(false);
      setIsProcessing(false);
    }
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setEditingPayment(null);
    setFormData({
      amount: (billDetails?.left_amount || 0).toString(),
      remark: "",
      payment_method: "Cash",
    });
    setPaymentMethod("Cash");
    setError("");
    setSuccess("");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Calculate totals for display
  const calculateItemTotals = () => {
    if (!billDetails?.items) return { totalDiscount: 0, totalGST: 0 };

    const totals = billDetails.items.reduce(
      (acc, item) => {
        acc.totalDiscount += parseFloat(item.discount_amount || 0);
        acc.totalGST += parseFloat(item.gst_amount || 0);
        return acc;
      },
      { totalDiscount: 0, totalGST: 0 }
    );

    return totals;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="mt-2 text-center text-gray-600">
            Loading bill details...
          </p>
        </div>
      </div>
    );
  }

  const itemTotals = calculateItemTotals();
  const totalDiscount =
    billDetails?.total_discount_amount || itemTotals.totalDiscount;
  const totalGST = billDetails?.total_gst_amount || itemTotals.totalGST;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {showEditForm
                ? "Edit Payment"
                : `Payment for ${bill.invoice_no} (${
                    bill.bill_type === "sale" ? "Sales" : "Purchase"
                  })`}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isProcessing}
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

        {billDetails && (
          <>
            {!showEditForm ? (
              <>
                {/* Bill Summary */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Party Name</p>
                      <p className="font-medium">
                        {billDetails.party_name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-medium">
                        {formatCurrency(billDetails.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Paid Amount</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(billDetails.total_paid || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Left Amount</p>
                      <p className="font-medium text-red-600">
                        {formatCurrency(billDetails.left_amount || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Total GST and Discount Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Total GST Amount</p>
                      <p className="font-medium text-blue-700">
                        {formatCurrency(totalGST)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Total Discount Amount
                      </p>
                      <p className="font-medium text-green-700">
                        {formatCurrency(totalDiscount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bill Items Section */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-semibold text-gray-900">
                      Bill Items ({billDetails.items?.length || 0})
                    </h4>
                    <button
                      onClick={() => setShowItems(!showItems)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showItems ? "Hide Items" : "Show Items"}
                    </button>
                  </div>

                  {showItems &&
                  billDetails.items &&
                  billDetails.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Product
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Qty
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Rate
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Discount %
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Discount Amt
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              GST %
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              GST Amt
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {billDetails.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {item.product_name || "-"}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {item.quantity} {item.unit || ""}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {formatCurrency(item.rate)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {item.discount_percent ||
                                  item.discount_rate ||
                                  0}
                                %
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {formatCurrency(item.discount_amount || 0)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {item.gst_percent || 0}%
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {formatCurrency(item.gst_amount || 0)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                {formatCurrency(
                                  item.net_total || item.total || 0
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : showItems ? (
                    <p className="text-gray-500 text-sm">No items available</p>
                  ) : null}
                </div>

                {/* Payment History */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    Payment History ({billDetails.payments?.length || 0})
                  </h4>
                  {billDetails.payments && billDetails.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Amount
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Method
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Remark
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {billDetails.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {new Date(
                                  payment.created_at
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {payment.method || "Cash"}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {payment.remark || "-"}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 space-x-2">
                                <button
                                  onClick={() => handleEditPayment(payment)}
                                  disabled={isProcessing}
                                  className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 disabled:opacity-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeletePayment(payment.id)
                                  }
                                  disabled={isProcessing}
                                  className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No payment history available
                    </p>
                  )}
                </div>

                {/* Payment Form */}
                <div className="px-6 py-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    Make Payment
                  </h4>
                  {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                      {success}
                    </div>
                  )}
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount
                        </label>
                        <input
                          type="text"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder={`Max: ${formatCurrency(
                            billDetails.left_amount || 0
                          )}`}
                          disabled={isProcessing}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Method
                        </label>
                        <select
                          name="payment_method"
                          value={paymentMethod}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          disabled={isProcessing}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Online">Online</option>
                          <option value="UPI">UPI</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Remark
                        </label>
                        <input
                          type="text"
                          name="remark"
                          value={formData.remark}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="Enter remark (optional)"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          isProcessing ||
                          paymentLoading ||
                          !formData.amount ||
                          parseFloat(formData.amount) <= 0 ||
                          parseFloat(formData.amount) >
                            (billDetails.left_amount || 0)
                        }
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {paymentLoading ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          "Make Payment"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              /* Edit Payment Form */
              <div className="px-6 py-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Edit Payment
                </h4>
                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                    {success}
                  </div>
                )}
                <form onSubmit={handleUpdatePayment}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <input
                        type="text"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Enter amount"
                        disabled={isProcessing}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        name="payment_method"
                        value={paymentMethod}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        disabled={isProcessing}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Online">Online</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remark
                      </label>
                      <input
                        type="text"
                        name="remark"
                        value={formData.remark}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Enter remark (optional)"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={isProcessing}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isProcessing ||
                        paymentLoading ||
                        parseFloat(formData.amount) <= 0
                      }
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {paymentLoading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Updating...
                        </span>
                      ) : (
                        "Update Payment"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
