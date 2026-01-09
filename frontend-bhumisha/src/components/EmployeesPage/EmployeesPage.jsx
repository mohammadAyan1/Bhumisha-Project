import React, { useState } from "react";
import EmployeeList from "../../components/EmployeeList/EmployeeList";
import EmployeePageApi from "../../axios/EmployeesPageApi";

export default function EmployeesPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    base_salary: "",
    join_date: "",
    salary_date: "",
    photo: null,
  });

  const [edit, setOpen] = useState(false);
  const [editID, setEditID] = useState(false);

  const create = async () => {
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("email", form.email);
    fd.append("phone", form.phone);
    fd.append("position", form.position);
    fd.append("base_salary", form.base_salary);
    fd.append("join_date", form.join_date);
    fd.append("salary_date", form.salary_date);
    fd.append("photo", form.photo);

    await EmployeePageApi.create(fd);

    alert("Created");
    window.location.reload();
  };

  const update = async () => {
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("email", form.email);
    fd.append("phone", form.phone);
    fd.append("position", form.position);
    fd.append("base_salary", form.base_salary);
    fd.append("join_date", form.join_date);
    fd.append("photo", form.photo);
    fd.append("salary_date", form.salary_date);

    await EmployeePageApi.edit(fd, editID);

    alert("Updated");
    window.location.reload();
  };

  const handleDelete = async (id) => {
    await EmployeePageApi.delete(id);
    alert("delete");
    window.location.reload();
  };

  const handleEdit = async (employeData) => {
    setEditID(employeData?.id);
    setOpen(true);
    setForm({
      name: employeData?.name,
      email: employeData?.email,
      phone: employeData?.phone,
      position: employeData?.position,
      base_salary: employeData?.base_salary,
      join_date: employeData?.join_date?.slice(0, 10), // 👈 FIX
      salary_date: employeData?.salary_date?.slice(0, 10), // 👈 FIX
      photo: employeData?.photo, // still needs fix below
    });
  };

  return (
    <div className="space-y-8 md:space-y-0 md:flex md:gap-6">
      {/* Left Form */}
      <div className="md:w-1/3 bg-[var(--bg)] p-6 rounded-2xl shadow-md border border-gray-200">
        <h5 className="text-lg font-semibold mb-4">Add Employee</h5>

        <div className="space-y-3">
          <input
            className="w-full p-2 rounded-lg border border-gray-300 focus:border-[var(--accent)] focus:ring focus:ring-[var(--accent)]/20 outline-none"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="w-full p-2 rounded-lg border border-gray-300 focus:border-[var(--accent)] focus:ring focus:ring-[var(--accent)]/20 outline-none"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            className="w-full p-2 rounded-lg border border-gray-300 focus:border-[var(--accent)] focus:ring focus:ring-[var(--accent)]/20 outline-none"
            placeholder="Phone"
            type="number"
            onInput={(e) => {
              // Limit to 6 digits
              if (e.target.value.length > 10) {
                e.target.value = e.target.value.slice(0, 10);
              }
            }}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <input
            className="w-full p-2 rounded-lg border border-gray-300 focus:border-[var(--accent)] focus:ring focus:ring-[var(--accent)]/20 outline-none"
            placeholder="Position"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
          />

          <input
            className="w-full p-2 rounded-lg border border-gray-300 focus:border-[var(--accent)] focus:ring focus:ring-[var(--accent)]/20 outline-none"
            placeholder="Base Salary"
            type="number"
            value={form.base_salary}
            onChange={(e) => setForm({ ...form, base_salary: e.target.value })}
          />

          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Joining Date
            </label>
            <input
              type="date"
              className="w-full p-2 rounded-lg border border-gray-300 focus:border-[var(--accent)] focus:ring focus:ring-[var(--accent)]/20 outline-none"
              value={form.join_date}
              required
              onChange={(e) => setForm({ ...form, join_date: e.target.value })}
            />
          </div>

          {/* <div>
            <label className="block mb-1 font-medium text-gray-700">
              Salary Date
            </label>
            <input
              type="date"
              className="w-full p-2 rounded-lg border border-gray-300 focus:border-[var(--accent)] focus:ring focus:ring-[var(--accent)]/20 outline-none"
              value={form.salary_date}
              onChange={(e) =>
                setForm({ ...form, salary_date: e.target.value })
              }
            />
          </div> */}

          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Employee Photo
            </label>
            <input
              type="file"
              className="w-full p-2 rounded-lg border border-gray-300 focus:border-[var(--accent)] focus:ring focus:ring-[var(--accent)]/20 outline-none"
              onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
            />
          </div>

          {form.photo && typeof form.photo === "string" && (
            <div className="mb-2">
              <p className="text-gray-600 text-sm mb-1">Current Photo:</p>
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${
                  form.photo
                }`}
                alt="Employee"
                className="w-24 h-24 rounded-lg object-cover border"
              />
            </div>
          )}

          {edit ? (
            <button
              onClick={update}
              className="w-full py-2 rounded-lg bg-[var(--accent)] text-white font-semibold shadow hover:shadow-lg transition-all"
            >
              Update
            </button>
          ) : (
            <button
              onClick={create}
              className="w-full py-2 rounded-lg bg-[var(--accent)] text-white font-semibold shadow hover:shadow-lg transition-all"
            >
              Create
            </button>
          )}
        </div>
      </div>

      {/* Right Employee List */}
      <div className="md:w-2/3 bg-[var(--bg)] p-6 rounded-2xl shadow-md border border-gray-200">
        <h5 className="text-lg font-semibold mb-4">Employees</h5>
        <EmployeeList
          onSelect={() => {}}
          onEdit={handleEdit}
          onDelete={handleDelete}
          show={true}
        />
      </div>
    </div>
  );
}
