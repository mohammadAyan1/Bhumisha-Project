import { NavLink } from "react-router-dom";

export default function EmployeeCard({
  index,
  emp,
  onSelect,
  onEdit,
  onDelete,
  show,
  selectedIndex,
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center transition hover:shadow-md">
      <div className="mb-3 sm:mb-0">
        <NavLink to={`/salaryincentive/employee/${emp.id}`}>
          <div className="font-semibold text-gray-800 text-lg hover:text-indigo-600 transition">
            {emp.name}
          </div>
          <div className="text-sm text-gray-500">
            {emp.position} • ₹{emp.base_salary?.toLocaleString("en-IN")}
          </div>
        </NavLink>
      </div>

      {!show && (
        <button
          onClick={onSelect}
          className={`px-4 py-2 ${
            selectedIndex === index
              ? "bg-green-700 text-white"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          } rounded-lg shadow transition`}
        >
          Select
        </button>
      )}

      {show && (
        <>
          <button
            onClick={() => onEdit(emp)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(emp?.id)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}
