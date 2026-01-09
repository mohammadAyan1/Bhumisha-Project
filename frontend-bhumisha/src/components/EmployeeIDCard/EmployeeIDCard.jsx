import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EmployeeIDCardAPI from "../../axios/EmployeeIDCardAPI";

export default function EmployeeIDCard() {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await EmployeeIDCardAPI.getById(employeeId);
        setEmployee(res.data);
      } catch (err) {
        console.error("Failed to fetch employee:", err);
      }
      setLoading(false);
    };

    fetchEmployee();
  }, [employeeId]);

  if (loading)
    return (
      <p className="text-center mt-10 text-lg text-gray-500">Loading...</p>
    );

  if (!employee)
    return (
      <p className="text-center mt-10 text-lg text-gray-500">
        Employee not found
      </p>
    );

  return (
    <div className="min-h-screen flex justify-center items-start bg-[var(--secondary-bg)] py-10 px-4">
      <div className="bg-[var(--bg)] rounded-2xl shadow-xl max-w-sm w-full p-6 flex flex-col items-center transition hover:shadow-2xl">
        {/* Company Logo */}
        <div className="mb-4">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf4eFD0CmfBewLe5_WXAcxfusooQRyF_6GQQ&s"
            alt="Company Logo"
            className="w-20 h-20 object-contain"
          />
        </div>

        {/* Employee Photo */}
        <div className="mb-4">
          <img
            src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${
              employee.photo
            }`}
            alt="Employee"
            className="w-32 h-32 rounded-full border-4 border-[var(--accent)] object-cover"
          />
        </div>

        {/* Employee Name & Position */}
        <h2 className="text-xl font-bold text-[var(--text-color)] text-center">
          {employee.name}
        </h2>
        <p className="text-sm text-gray-500 mb-4 text-center">
          {employee.position}
        </p>

        {/* Employee Details */}
        <div className="w-full border-t border-gray-200 pt-4 text-sm space-y-2">
          <p>
            <span className="font-semibold">Email:</span> {employee.email}
          </p>
          <p>
            <span className="font-semibold">Phone:</span> {employee.phone}
          </p>
          <p>
            <span className="font-semibold">Base Salary:</span> ₹
            {employee.base_salary?.toLocaleString("en-IN")}
          </p>
          <p>
            <span className="font-semibold">Joining Date:</span>{" "}
            {new Date(employee.join_date).toLocaleDateString()}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-gray-400 text-xs">
          Employee ID: {employee.id}
        </div>
      </div>
    </div>
  );
}
