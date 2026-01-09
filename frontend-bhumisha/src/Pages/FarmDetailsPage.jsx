import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFarmers } from "../features/farmers/farmerSlice";
import {
  addFarm,
  deleteFarm,
  fetchFarms,
  updateFarm,
} from "../features/Farm/FarmSlice";

const FarmDetailsPage = () => {
  const [farmForm, setFarmForm] = useState({
    farmerId: "",
    location: "",
    state: "",
    village: "",
    size: "",
    type: "",
    district: "",
  });

  const [edit, setEdit] = useState(false);

  const dispatch = useDispatch();
  const { farms } = useSelector((state) => state.farms);
  const { list } = useSelector((state) => state.farmers);

  useEffect(() => {
    dispatch(fetchFarmers());
    dispatch(fetchFarms());
  }, [dispatch]);

  // Separate handler for farmer selection
  const handleFarmerSelect = (e) => {
    const value = e.target.value;

    if (value) {
      const farmerFilter = list?.find((item) => item?.id == value);

      if (farmerFilter) {
        setFarmForm((prev) => ({
          ...prev,
          farmerId: value,
          village: farmerFilter?.village || "",
          district: farmerFilter?.district || "",
        }));
      }
    } else {
      // If clearing selection
      setFarmForm((prev) => ({
        ...prev,
        farmerId: "",
      }));
    }
  };

  // General handler for other inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // For village and district, allow manual editing even after farmer selection
    setFarmForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitData = async (e) => {
    e.preventDefault();

    try {
      if (!edit) {
        await dispatch(addFarm(farmForm)).unwrap();
      } else {
        await dispatch(updateFarm(farmForm)).unwrap();
        setEdit(false);
      }

      // ✅ fetch AFTER success
      dispatch(fetchFarms());

      setFarmForm({
        farmerId: "",
        location: "",
        size: "",
        type: "",
        state: "",
        village: "",
        district: "",
        id: "",
      });
    } catch (err) {
      console.error("Farm submit failed:", err);
    }
  };

  const handleEdit = (data) => {
    setEdit(true);
    setFarmForm((prev) => ({
      ...prev,
      farmerId: data?.farmer_id,
      location: data?.location,
      size: data?.size,
      type: data?.farm_type,
      state: data?.farm_state,
      village: data?.city || data?.village || "",
      district: data?.farm_district || "",
      id: data?.farm_id,
    }));
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteFarm(id)).unwrap();
      dispatch(fetchFarms());
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Farm Details Management
      </h2>

      {/* Form Section */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-10">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          Add New Farm
        </h3>

        <form
          onSubmit={handleSubmitData}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Farmer Select */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">Select Farmer</label>
            <select
              name="farmerId"
              value={farmForm.farmerId}
              onChange={handleFarmerSelect}
              className="border p-3 rounded-lg shadow-sm"
              required
            >
              <option value="">-- Select Farmer --</option>
              {list &&
                list.map((farmer) => (
                  <option key={farmer.id} value={farmer.id}>
                    {farmer.name}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Selecting a farmer will auto-fill village and district, but you
              can edit them below
            </p>
          </div>

          {/* Location */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">Address</label>
            <input
              type="text"
              name="location"
              value={farmForm.location}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              placeholder="Enter Address"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="font-medium mb-1">State</label>
            <input
              type="text"
              name="state"
              value={farmForm.state}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              placeholder="Enter state"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="font-medium mb-1">District</label>
            <input
              type="text"
              name="district"
              value={farmForm.district}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              placeholder="Enter district"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="font-medium mb-1">City/Village</label>
            <input
              type="text"
              name="village"
              value={farmForm.village}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              placeholder="Enter City/Village"
              required
            />
          </div>

          {/* Size */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">Farm Size (Acre)</label>
            <input
              type="number"
              name="size"
              value={farmForm.size}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              placeholder="Enter size (e.g., 4 Acre)"
              required
            />
          </div>

          {/* Type */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">Farm Type</label>
            <input
              type="text"
              name="type"
              value={farmForm.type}
              onChange={handleInputChange}
              className="border p-3 rounded-lg shadow-sm"
              placeholder="e.g., Irrigated, Non-Irrigated"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition"
            >
              {edit ? "Update Farm Details" : "Save Farm Details"}
            </button>
          </div>
        </form>
      </div>

      {/* Data Table Section */}
      <div className="bg-white shadow-lg rounded-xl p-6 overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Farm List</h3>

        <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border text-left">#</th>
              <th className="p-3 border text-left">Farmer Name</th>
              <th className="p-3 border text-left">Father Name</th>
              <th className="p-3 border text-left">Contact</th>
              <th className="p-3 border text-left">Location</th>
              <th className="p-3 border text-left">Size</th>
              <th className="p-3 border text-left">Type</th>
              <th className="p-3 border text-left">City/Village</th>
              <th className="p-3 border text-left">District</th>
              <th className="p-3 border text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {farms?.data && farms.data.length > 0 ? (
              farms.data.map((item, index) => (
                <tr key={item.farm_id} className="hover:bg-gray-50">
                  <td className="p-3 border">{index + 1}</td>
                  <td className="p-3 border">{item.name}</td>
                  <td className="p-3 border">{item.father_name}</td>
                  <td className="p-3 border">{item.contact_number}</td>
                  <td className="p-3 border">{item.location}</td>
                  <td className="p-3 border">{item.size}</td>
                  <td className="p-3 border">{item.farm_type}</td>
                  <td className="p-3 border">{item.village}</td>
                  <td className="p-3 border">{item.farm_district}</td>
                  <td className="p-3 border">
                    <div className="flex justify-between">
                      <span
                        onClick={() => handleEdit(item)}
                        className="border p-1 hover:bg-blue-400 hover:border-blue-400 cursor-pointer"
                      >
                        ✏️
                      </span>
                      <span
                        onClick={() => handleDelete(item.farm_id)}
                        className="border p-1 hover:bg-blue-400 hover:border-blue-400 cursor-pointer"
                      >
                        🗑️
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={10}
                  className="text-center p-4 text-gray-500 border"
                >
                  No farm records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FarmDetailsPage;
