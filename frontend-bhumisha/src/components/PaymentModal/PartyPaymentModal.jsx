import React, { useState, useEffect } from "react";
import { api } from "../../axios/axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const PartyPaymentModal = ({ onClose, onPaymentSuccess, companies, vendors, farmers, customers }) => {
  const [formData, setFormData] = useState({
    billType: "sales", // 'sales' or 'purchase'
    party_type: "customer",
    party_id: "",
    company_id: "",
    amount: "",
    payment_method: "Cash",
    date: new Date().toISOString().split("T")[0],
    remarks: ""
  });

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (formData.party_id && formData.party_type && formData.billType) {
      // Fetch summary
      const fetchSummary = async () => {
        try {
          const res = await api.get(`/party-payment/summary`, {
            params: {
              party_type: formData.party_type,
              party_id: formData.party_id,
              billType: formData.billType,
              company_id: formData.company_id
            }
          });
          if (res.data.success) {
            setSummary(res.data.data);
          }
        } catch (error) {
          console.error("Error fetching summary", error);
        }
      };
      fetchSummary();
    } else {
      setSummary(null);
    }
  }, [formData.party_id, formData.party_type, formData.billType, formData.company_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset party ID if party type changes
      if (name === "party_type") {
        updated.party_id = "";
      }
      if (name === "billType") {
        if (value === "sales") updated.party_type = "customer";
        else updated.party_type = "vendor";
        updated.party_id = "";
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_id || !formData.party_id || !formData.amount) {
      alert("Please fill in required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/party-payment`, formData);
      if (res.data.success) {
        alert(res.data.message + `\nAdvance added: ₹${res.data.advance_added}`);
        onPaymentSuccess && onPaymentSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to process payment.");
    } finally {
      setLoading(false);
    }
  };

  const getPartyOptions = () => {
    if (formData.party_type === "customer") return customers;
    if (formData.party_type === "vendor") return vendors;
    if (formData.party_type === "farmer") return farmers;
    return [];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Consolidated Party Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  name="billType"
                  value={formData.billType}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                >
                  <option value="sales">Incoming (Sales)</option>
                  <option value="purchase">Outgoing (Purchase)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Party Type</label>
                <select
                  name="party_type"
                  value={formData.party_type}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                >
                  {formData.billType === "sales" ? (
                    <>
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="farmer">Farmer</option>
                    </>
                  ) : (
                    <>
                      <option value="vendor">Vendor</option>
                      <option value="farmer">Farmer</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Party</label>
                <select
                  name="party_id"
                  value={formData.party_id}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select {formData.party_type}</option>
                  {getPartyOptions().map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.vendor_name} {p.firm_name ? `(${p.firm_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {summary && (
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-blue-200">
                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      {formData.billType === 'sales' ? 'Total Amount to Receive from:' : 'Total Amount to Pay to:'}
                    </p>
                    <p className="text-lg font-bold text-blue-900 mt-1">
                      {summary.name} {summary.firm_name ? `(${summary.firm_name})` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-blue-600 uppercase font-bold tracking-wider">Unpaid Due</p>
                    <p className="text-2xl font-bold text-blue-800">₹{summary.unpaid_due.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Current Advance</p>
                    <p className="text-2xl font-bold text-green-700">₹{summary.advance_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay/Receive</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="1"
                  step="0.01"
                  className="w-full border rounded-md p-2"
                  placeholder="₹ 0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="2"
                className="w-full border rounded-md p-2"
                placeholder="Optional notes"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : 'Process Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartyPaymentModal;
