import React, { useEffect, useState } from "react";
import companyAPI from "../axios/companyAPI";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchClusters,
  addCluster,
} from "../features/clusterAdded/ClusterAdded";
import clusterApi from "../axios/clusterAdded";
import { toast } from "react-toastify";

const ClusterCreate = () => {
  const [formData, setFormData] = useState({
    companyId: "",
    companyCode: "",
    location: "",
    state: "",
    village: "",
    manager: "",
    district: "",
    name: "",
    id: "",
  });

  const dispatch = useDispatch();
  const { clusters } = useSelector((state) => state.clusters);

  const [rows, setRows] = useState([]);
  const [editOn, setEditOn] = useState(false);

  const [companies, setCompanies] = useState([]);

  // Load companies
  const fetchAllCompany = async () => {
    try {
      const response = await companyAPI.getAll();
      if (response.status === 200) {
        setCompanies(response.data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  useEffect(() => {
    fetchAllCompany();
    dispatch(fetchClusters());
  }, [dispatch]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "companyId") {
      const selected = companies.find((c) => c.id == value);
      setFormData({
        ...formData,
        companyId: value,
        companyCode: selected?.code || "",
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Add Row
  const addRow = () => {
    const {
      companyId,
      companyCode,
      location,
      manager,
      village,
      state,
      district,
      name,
    } = formData;

    if (!companyId || !location || !manager) {
      alert("Please fill all fields.");
      return;
    }

    setRows([
      ...rows,
      {
        id: Date.now(),
        companyId,
        companyCode,
        location,
        manager,
        village,
        state,
        district,
        name,
      },
    ]);

    setFormData({
      companyId: "",
      companyCode: "",
      location: "",
      manager: "",
      village: "",
      state: "",
      district: "",
      name: "",
    });
  };

  // Remove row
  const removeRow = (id) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  // Submit
  // const handleSubmit = () => {
  //   rows.forEach((row) => {
  //     dispatch(
  //       addCluster({
  //         companyId: row.companyId,
  //         location: row.location,
  //         manager: row.manager,
  //         state: row.state,
  //         village: row.village,
  //         district: row.district,
  //         name: row?.name,
  //       })
  //     );
  //   });
  //   alert("Clusters submitted!");
  //   setRows([]);
  // };

  const handleSubmit = async () => {
    try {
      const promises = rows.map((row) =>
        dispatch(
          addCluster({
            companyId: row.companyId,
            location: row.location,
            manager: row.manager,
            state: row.state,
            village: row.village,
            district: row.district,
            name: row?.name,
          })
        ).unwrap()
      );

      // ✅ wait for all inserts
      await Promise.all(promises);

      alert("Clusters submitted!");

      // ✅ reset form (keep one empty row)
      setRows([
        {
          companyId: "",
          location: "",
          manager: "",
          state: "",
          village: "",
          district: "",
          name: "",
        },
      ]);

      // ✅ refetch data
      dispatch(fetchClusters());
    } catch (error) {
      alert(error.message || "Something went wrong");
    }
  };

  const handleDelete = (id) => {
    clusterApi
      .remove(id)
      .then((res) => {
        if (res?.data?.success) {
          toast.success(res?.data?.message);
          dispatch(fetchClusters());
        } else {
          toast.error(res?.data?.message);
        }
      })
      .catch((err) => {
        toast.error(err);
      });
  };

  const handleEdit = (data) => {
    setEditOn(true);
    setFormData((prev) => ({
      ...prev,
      companyId: data?.company_id ?? "",
      companyCode: data?.company_code ?? "",
      location: data?.cluster_location ?? "",
      state: data?.state ?? "",
      village: data?.city ?? "",
      manager: data?.cluster_manager ?? "",
      district: data?.district ?? "",
      name: data?.cluster_name_changes ?? "",
      id: data?.id ?? "",
    }));
  };

  const handleUpdate = async () => {
    if (!formData) return;

    await clusterApi
      .update(formData?.id, formData)
      .then((res) => {
        if (res?.data?.success) {
          toast.success("Cluster Updated Successfully");
          dispatch(fetchClusters());
        } else {
          throw new Error(res?.data?.message);
        }
      })
      .catch((err) => {
        toast.error(err);
        console.error(err);
      });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6">Cluster Management</h1>

      {/* FORM CARD */}
      <div className="bg-white shadow-lg p-6 rounded-xl">
        {/* Company Select */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">
            Company (Warehouse)
          </label>
          <select
            name="companyId"
            value={formData.companyId}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-lg"
          >
            <option value="">Select Company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c?.code?.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Cluster Name */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Cluster Name</label>
          <input
            type="text"
            placeholder="Cluster Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* Location */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Address</label>
          <input
            type="text"
            placeholder="Address"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">State</label>
          <input
            type="text"
            placeholder="State"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">District</label>
          <input
            type="text"
            placeholder="District"
            name="district"
            value={formData.district}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Village/City</label>
          <input
            type="text"
            placeholder="Village/City"
            name="village"
            value={formData.village}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* Manager */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Cluster Manager</label>
          <input
            type="text"
            placeholder="Cluster Manager"
            name="manager"
            value={formData.manager}
            onChange={handleInputChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={editOn ? handleUpdate : addRow}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ➕ {editOn ? "Update Cluster" : "Add Cluster"}
        </button>
      </div>

      {/* Added Rows Section */}
      {rows.length > 0 && (
        <div className="mt-6 bg-white shadow-md p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Rows to be Added</h2>

          {rows.map((r) => (
            <div
              key={r.id}
              className="border p-4 rounded-lg mb-2 flex justify-between items-center"
            >
              <div>
                <p>
                  <strong>Company:</strong> {r.companyCode}
                </p>
                <p>
                  <strong>Location:</strong> {r.location}
                </p>
                <p>
                  <strong>Manager:</strong> {r.manager}
                </p>
              </div>

              <button
                onClick={() => removeRow(r.id)}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
              >
                ❌ Remove
              </button>
            </div>
          ))}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-5 py-3 rounded-lg mt-4 hover:bg-green-700"
          >
            ✅ Submit All Clusters
          </button>
        </div>
      )}

      {/* DATATABLE */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">All Clusters</h2>

        <div className="overflow-x-auto shadow-lg rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 border">ID</th>
                <th className="p-3 border">Company Code</th>
                <th className="p-3 border">Cluster Name</th>
                <th className="p-3 border">Location</th>
                <th className="p-3 border">Manager</th>
                <th className="p-3 border">State</th>
                <th className="p-3 border">City</th>
                <th className="p-3 border">District</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {clusters.map((c, i) => {
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-3 border">{i + 1}</td>
                    <td className="p-3 border">
                      {c?.company_code?.toUpperCase()}
                    </td>
                    <td className="p-3 border">{c.cluster_name_changes}</td>
                    <td className="p-3 border">{c.cluster_location}</td>
                    <td className="p-3 border">{c.cluster_manager}</td>
                    <td className="p-3 border">{c.state}</td>
                    <td className="p-3 border">{c.city}</td>
                    <td className="p-3 border">{c.district}</td>
                    <td className="p-3 border">
                      <div className="flex justify-between">
                        <span
                          onClick={() => handleDelete(c?.id)}
                          className="border p-1 cursor-pointer hover:bg-blue-500"
                        >
                          🗑️
                        </span>
                        <span
                          onClick={() => handleEdit(c)}
                          className="border p-1 cursor-pointer hover:bg-blue-500"
                        >
                          ✏️
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClusterCreate;
