import React, { useEffect, useState } from "react";
import AttendanceAPI from "../../axios/AttendanceAPI";
import EmployeeCard from "../../components/EmployeeCard/EmployeeCard";

export default function EmployeeList({ onSelect, onEdit, onDelete, show }) {
  const [employees, setEmployees] = useState([]);

  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    AttendanceAPI.getAll()
      .then((res) => {
        setEmployees(res.data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
      {employees.map((e, index) => (
        <EmployeeCard
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
          key={e.id}
          emp={e}
          onSelect={() => {
            onSelect(e);
            setSelectedIndex(index);
          }}
          selectedIndex={selectedIndex}
          show={show}
        />
      ))}
    </div>
  );
}
