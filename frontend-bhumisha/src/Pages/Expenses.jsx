import React, { useEffect } from "react";
import Dropdowns from "../components/Expenses/Dropdowns";
import ExpensesList from "../components/Expenses/ExpensesList";
import { useState } from "react";

const Expenses = ({ tabel = "form", switchTable = false }) => {
  const [openExpenses, setOpenExpenses] = useState("form");
  const [openExpensesForEdit, setOpenExpensesForEdit] = useState(null);

  useEffect(() => {
    setOpenExpenses(tabel);
  }, [tabel]);

  const handleEditClick = (data, type) => {
    // Create an object with data and type properties
    setOpenExpensesForEdit({
      ...data, // spread all properties from data
      expenseType: type, // add the type (renamed to avoid conflict if data already has 'type' property)
    });
    setOpenExpenses("form");
  };

  return (
    <>
      <div className="flex justify-around bg-blue-700 p-2 rounded">
        <div className="bg-white p-1 rounded">
          <button onClick={() => setOpenExpenses("form")}>Expenses Form</button>
        </div>
        <div className="bg-white p-1 rounded">
          <button onClick={() => setOpenExpenses("list")}>Expenses List</button>
        </div>
      </div>
      {openExpenses == "form" ? (
        <Dropdowns
          editData={openExpensesForEdit}
          clearEditData={() => setOpenExpensesForEdit(null)}
        />
      ) : (
        <ExpensesList
          onchangeEdit={handleEditClick}
          switchTable={switchTable}
        />
      )}
    </>
  );
};

export default Expenses;
