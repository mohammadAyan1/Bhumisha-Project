import React from "react";
import { useState } from "react";
import unitsApi from "../axios/UnitsApi";

const Units = () => {
  const [unit, setUnits] = useState("");
  const [btn, setbtn] = useState(false);

  const handleSubmit = async (e) => {
    setbtn(true);
    e.preventDefault();
    await unitsApi
      .create(unit)
      .then((res) => {})
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setbtn(false);
      });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Units</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnits(e.target.value)}
          />
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-900 p-2 rounded"
          disabled={btn}
          type="submit"
        >
          {btn ? "Submit..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default Units;
