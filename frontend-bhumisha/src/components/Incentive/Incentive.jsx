import React, { useState, useEffect } from "react";
import IncentiveAPI from "../../axios/IncentiveApi";
import { toast } from "react-toastify";

export default function IncentiveForm() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employee_id: "",
    year: new Date().getFullYear(),
    month: String(new Date().getMonth() + 1).padStart(2, "0"),
    amount: "",
    remark: "",
    id: "",
  });
  const [loading, setLoading] = useState(false);
  const [editOn, setEditOn] = useState(false);

  const [incentiveData, setIncentiveData] = useState([]);

  useEffect(() => {
    IncentiveAPI.getAllEmployee().then((res) => setEmployees(res.data || []));
    IncentiveAPI.getAllIncentive().then((res) => {
      setIncentiveData(res.data || []);
    });
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (editOn) {
      await IncentiveAPI.updateIncentive(form)
        .then(async () => {
          const res = await IncentiveAPI.getAllIncentive();
          setIncentiveData(res.data || []);
          setEditOn(false);
          toast.success("Incentive Updated Successfully");
        })
        .catch((err) => {
          toast.error("server error While  Updating Incentive ", err);
          setEditOn(false);
        });
    } else {
      await IncentiveAPI.createIncentive(form)
        .then(async () => {
          const res = await IncentiveAPI.getAllIncentive();
          setIncentiveData(res.data || []);
          toast.success("Incentive Created Successfully");
        })
        .catch((err) => {
          toast.error("server error While Creating  Incentive ", err);
        });
    }
    setForm({
      employee_id: "",
      year: new Date().getFullYear(),
      month: String(new Date().getMonth() + 1).padStart(2, "0"),
      amount: "",
      remark: "",
    });
    setLoading(false);
  };

  const handleEdit = (data) => {
    setEditOn(true);

    setForm({
      employee_id: data?.employee_id ?? "",
      year: data?.year ?? "",
      month: String(data?.month).padStart(2, "0"),
      amount: data?.amount ?? "",
      remark: data?.reason ?? "",
      incentive_id: data?.incentive_id, // VERY IMPORTANT (for update)
      id: data?.incentive_id,
    });
  };

  const handleDelete = async (id) => {
    await IncentiveAPI.deleteIncentive(id)
      .then(async () => {
        await IncentiveAPI.getAllIncentive().then((res) => {
          setIncentiveData(res.data || []);
          toast.success("Incentive deleted successfully");
        });
      })
      .catch((err) => {
        toast.error("server error while  deleting Incentive", err);
      });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      {/* ================= FORM ================= */}
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Incentive Management
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employee */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Employee
            </label>
            <select
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year & Month */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={form.year}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Month
              </label>
              <select
                name="month"
                value={form.month}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Month</option>
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((m, i) => (
                  <option key={i} value={String(i + 1).padStart(2, "0")}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Incentive Amount
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Remark */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Remark
            </label>
            <textarea
              name="remark"
              value={form.remark}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            {editOn
              ? loading
                ? "Updating..."
                : "Update Incentive"
              : loading
              ? "Saving..."
              : "Add Incentive"}
          </button>
        </form>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          Incentive List
        </h3>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-sm">
              <th className="p-3 border">Employee</th>
              <th className="p-3 border">Year</th>
              <th className="p-3 border">Month</th>
              <th className="p-3 border">Amount</th>
              <th className="p-3 border">Remark</th>
              <th className="p-3 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {incentiveData.length > 0 ? (
              incentiveData.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50 transition text-sm">
                  <td className="p-3 border">{item.employee_name}</td>
                  <td className="p-3 border">{item.year}</td>
                  <td className="p-3 border">{item.month}</td>
                  <td className="p-3 border font-semibold text-green-600">
                    ₹{item.amount}
                  </td>
                  <td className="p-3 border">{item.reason}</td>
                  <td className="p-3 border text-center">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item?.incentive_id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-500">
                  No incentives found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
