import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  Calendar,
  ChevronUp,
  ChevronDown,
  User,
  MapPin,
  Crop,
  CalendarDays,
  Hash,
  Package,
  Plus,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import { fetchFarmDetailByFarmerId } from "../features/Farm/FarmSlice";
import { fetchFarmers } from "../features/farmers/farmerSlice";
import { fetchClusters } from "../features/clusterAdded/ClusterAdded";
import { useDispatch, useSelector } from "react-redux";
import {
  addClusterCultivate,
  fetchClustersCultivate,
  updateClusterCultivate,
  deleteClusterCultivate,
} from "../features/clusterCultivate/ClusterCultivate";

const ClusterCultivated = () => {
  const clusterCultivateData = useSelector(
    (state) => state.clusterCultivate.clusterCultivate
  );

  const dispatch = useDispatch();

  const [availableFarmSize, setAvailableFarmSize] = useState(0);
  const [cluster, setCluster] = useState([]);
  const [farmer, setFarmer] = useState([]);
  const [farm, setFarm] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [data, setData] = useState(clusterCultivateData);
  const [sortBy, setSortBy] = useState("farmerName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredClusters, setFilteredClusters] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredFarmerDistricts, setFilteredFarmerDistricts] = useState([]);
  const [filteredClusterDistricts, setFilteredClusterDistricts] = useState([]);
  const [filteredClusterStates, setFilteredClusterStates] = useState([]);
  const [filteredFarmerStates, setFilteredFarmerStates] = useState([]);
  const [filteredFarmStates, setFilteredFarmStates] = useState([]);
  const [filteredFarmDistricts, setFilteredFarmDistricts] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    farmerId: "",
    clusterId: "",
    farmId: "",
    size: "",
    startDate: "",
    endDate: "",
    product: "",
  });

  useEffect(() => {
    dispatch(fetchClusters())
      .then((res) => {
        setCluster(res?.payload || []);
      })
      .catch((err) => {
        console.error(err);
      });
    dispatch(fetchFarmers())
      .then((res) => {
        setFarmer(res?.payload || []);
      })
      .catch((err) => {
        console.error(err);
      });
    dispatch(fetchClustersCultivate());
  }, [dispatch]);

  useEffect(() => {
    setData(clusterCultivateData);
  }, [clusterCultivateData]);

  // Get unique values for filters
  const uniqueClusters = useMemo(
    () => [...new Set(data.map((item) => item.cluster_location))],
    [data]
  );

  const uniqueProducts = useMemo(
    () => [...new Set(data.map((item) => item.product))],
    [data]
  );

  const uniqueFarmerDistricts = useMemo(
    () =>
      [...new Set(data.map((item) => item.farmer_district))].filter(Boolean),
    [data]
  );

  const uniqueClusterDistricts = useMemo(
    () =>
      [...new Set(data.map((item) => item.cluster_district))].filter(Boolean),
    [data]
  );

  const uniqueClusterStates = useMemo(
    () => [...new Set(data.map((item) => item.cluster_state))].filter(Boolean),
    [data]
  );

  const uniqueFarmerStates = useMemo(
    () => [...new Set(data.map((item) => item.farmer_state))].filter(Boolean),
    [data]
  );

  const uniqueFarmStates = useMemo(
    () =>
      [...new Set(data.map((item) => item.farmer_farm_state))].filter(Boolean),
    [data]
  );

  const uniqueFarmDistricts = useMemo(
    () =>
      [...new Set(data.map((item) => item.farmer_farm_district))].filter(
        Boolean
      ),
    [data]
  );

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Apply all filters and sorting
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(term)
        )
      );
    }

    if (fromDate) {
      result = result.filter((item) => item.start_date >= fromDate);
    }
    if (toDate) {
      result = result.filter((item) => item.end_date <= toDate);
    }

    if (filteredClusters.length > 0) {
      result = result.filter((item) =>
        filteredClusters.includes(item.cluster_location)
      );
    }

    if (filteredProducts.length > 0) {
      result = result.filter((item) => filteredProducts.includes(item.product));
    }

    if (filteredFarmerDistricts.length > 0) {
      result = result.filter((item) =>
        filteredFarmerDistricts.includes(item.farmer_district)
      );
    }

    if (filteredClusterDistricts.length > 0) {
      result = result.filter((item) =>
        filteredClusterDistricts.includes(item.cluster_district)
      );
    }

    if (filteredClusterStates.length > 0) {
      result = result.filter((item) =>
        filteredClusterStates.includes(item.cluster_state)
      );
    }

    if (filteredFarmerStates.length > 0) {
      result = result.filter((item) =>
        filteredFarmerStates.includes(item.farmer_state)
      );
    }

    if (filteredFarmStates.length > 0) {
      result = result.filter((item) =>
        filteredFarmStates.includes(item.farmer_farm_state)
      );
    }

    if (filteredFarmDistricts.length > 0) {
      result = result.filter((item) =>
        filteredFarmDistricts.includes(item.farmer_farm_district)
      );
    }

    result.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "size") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [
    data,
    sortBy,
    sortOrder,
    searchTerm,
    fromDate,
    toDate,
    filteredClusters,
    filteredProducts,
    filteredFarmerDistricts,
    filteredClusterDistricts,
    filteredClusterStates,
    filteredFarmerStates,
    filteredFarmStates,
    filteredFarmDistricts,
  ]);

  // Filter handlers
  const handleClusterFilter = (cluster) => {
    setFilteredClusters((prev) =>
      prev.includes(cluster)
        ? prev.filter((c) => c !== cluster)
        : [...prev, cluster]
    );
  };

  const handleProductFilter = (product) => {
    setFilteredProducts((prev) =>
      prev.includes(product)
        ? prev.filter((p) => p !== product)
        : [...prev, product]
    );
  };

  const handleFarmerDistrictFilter = (district) => {
    setFilteredFarmerDistricts((prev) =>
      prev.includes(district)
        ? prev.filter((d) => d !== district)
        : [...prev, district]
    );
  };

  const handleClusterDistrictFilter = (district) => {
    setFilteredClusterDistricts((prev) =>
      prev.includes(district)
        ? prev.filter((d) => d !== district)
        : [...prev, district]
    );
  };

  const handleClusterStateFilter = (state) => {
    setFilteredClusterStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const handleFarmerStateFilter = (state) => {
    setFilteredFarmerStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const handleFarmStateFilter = (state) => {
    setFilteredFarmStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const handleFarmDistrictFilter = (district) => {
    setFilteredFarmDistricts((prev) =>
      prev.includes(district)
        ? prev.filter((d) => d !== district)
        : [...prev, district]
    );
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
    setFilteredClusters([]);
    setFilteredProducts([]);
    setFilteredFarmerDistricts([]);
    setFilteredClusterDistricts([]);
    setFilteredClusterStates([]);
    setFilteredFarmerStates([]);
    setFilteredFarmStates([]);
    setFilteredFarmDistricts([]);
    setSortBy("farmerName");
    setSortOrder("asc");
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  // Handle edit
  const handleEdit = (item) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormData({
      farmerId: item.farmer_id || "",
      clusterId: item.cluster_id || "",
      farmId: item.farm_id || "",
      size: item.size || "",
      startDate: item.start_date?.split("T")[0] || "",
      endDate: item.end_date?.split("T")[0] || "",
      product: item.product || "",
    });

    // Fetch farms for the selected farmer
    if (item.farmer_id) {
      dispatch(fetchFarmDetailByFarmerId(item.farmer_id)).then((res) => {
        setFarm(res?.payload?.data || []);
      });
    }

    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await dispatch(deleteClusterCultivate(id));
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "farmerId") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        farmId: "", // Reset farm when farmer changes
      }));

      if (value) {
        dispatch(fetchFarmDetailByFarmerId(value)).then((res) => {
          setFarm(res?.payload?.data || []);
        });
      }
      return;
    }

    if (name === "farmId") {
      const farmDetails = farm.find((item) => item.id == value);
      setAvailableFarmSize(farmDetails?.size || 0);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        size: farmDetails?.size || "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (
      !formData.farmerId ||
      !formData.clusterId ||
      !formData.farmId ||
      !formData.size ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.product
    ) {
      alert("Please fill in all fields");
      return;
    }

    // Validate dates
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert("Start date must be before end date");
      return;
    }

    // Validate size
    const sizeNum = parseFloat(formData.size);
    if (sizeNum > availableFarmSize) {
      alert(
        `Farm size cannot exceed available size of ${availableFarmSize} acres`
      );
      return;
    }

    try {
      if (isEditing) {
        // Update existing record
        await dispatch(
          updateClusterCultivate({
            id: editingId,
            data: formData,
          })
        );
        alert("Record updated successfully!");
      } else {
        // Add new record
        await dispatch(addClusterCultivate(formData));
        alert("Record added successfully!");
      }

      // Reset form and close
      handleResetForm();
      setShowForm(false);
      setIsEditing(false);
      setEditingId(null);
    } catch (error) {
      console.error("Form submission failed:", error);
      alert("Operation failed. Please try again.");
    }
  };

  // Reset form
  const handleResetForm = () => {
    setFormData({
      farmerId: "",
      clusterId: "",
      farmId: "",
      size: "",
      startDate: "",
      endDate: "",
      product: "",
    });
    setAvailableFarmSize(0);
    setFarm([]);
    setIsEditing(false);
    setEditingId(null);
  };

  // Close form
  const handleCloseForm = () => {
    setShowForm(false);
    handleResetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Cluster Contract Farming Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and monitor farm cultivation data across different
                clusters
              </p>
            </div>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingId(null);
                handleResetForm();
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Crops
            </button>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {isEditing ? "Edit Farmer Record" : "Add New Farmer"}
                  </h2>
                  <button
                    onClick={handleCloseForm}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Farmer Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Farmer Name *
                      </label>
                      <select
                        name="farmerId"
                        value={formData.farmerId}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      >
                        <option value="">Select Farmer</option>
                        {farmer.map((kisan) => (
                          <option key={kisan?.id} value={kisan?.id}>
                            {kisan?.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Farm Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Farm Location *
                      </label>
                      <select
                        name="farmId"
                        value={formData.farmId}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                        disabled={!formData.farmerId}
                      >
                        <option value="">Select Farm</option>
                        {farm.map((item) => (
                          <option key={item?.id} value={item?.id}>
                            {item?.location} ({item?.size} acres)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cluster Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cluster Location *
                      </label>
                      <select
                        name="clusterId"
                        value={formData.clusterId}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      >
                        <option value="">Select Cluster</option>
                        {cluster.map((cluster) => (
                          <option key={cluster?.id} value={cluster?.id}>
                            {cluster?.cluster_name_changes}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Product/Crop Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Crop *
                      </label>
                      <input
                        type="text"
                        name="product"
                        value={formData.product}
                        onChange={handleFormChange}
                        placeholder="Enter crop name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      />
                    </div>

                    {/* Farm Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Farm Size (acres) *
                        {availableFarmSize > 0 && (
                          <span className="text-sm text-gray-500 ml-2">
                            Available: {availableFarmSize} acres
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="size"
                          value={formData.size}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="Enter size in acres"
                          min="0.1"
                          step="0.1"
                          max={availableFarmSize}
                          required
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          acres
                        </div>
                      </div>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                      Reset Form
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      {isEditing ? "Update" : "Submit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </h2>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Reset All Filters
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search across all fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date Range Filter */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Date Range
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Cluster Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Cluster
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {uniqueClusters.map((cluster) => (
                  <div key={cluster} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`cluster-${cluster}`}
                      checked={filteredClusters.includes(cluster)}
                      onChange={() => handleClusterFilter(cluster)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`cluster-${cluster}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      {cluster}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Crop
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {uniqueProducts.map((product) => (
                  <div key={product} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`product-${product}`}
                      checked={filteredProducts.includes(product)}
                      onChange={() => handleProductFilter(product)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`product-${product}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      {product}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* District Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Farmer District
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {uniqueFarmerDistricts.map((district) => (
                  <div key={district} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`farmer-district-${district}`}
                      checked={filteredFarmerDistricts.includes(district)}
                      onChange={() => handleFarmerDistrictFilter(district)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`farmer-district-${district}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      {district}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Cluster District
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {uniqueClusterDistricts.map((district) => (
                  <div key={district} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`cluster-district-${district}`}
                      checked={filteredClusterDistricts.includes(district)}
                      onChange={() => handleClusterDistrictFilter(district)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`cluster-district-${district}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      {district}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* State Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Cluster State
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {uniqueClusterStates.map((state) => (
                  <div key={state} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`cluster-state-${state}`}
                      checked={filteredClusterStates.includes(state)}
                      onChange={() => handleClusterStateFilter(state)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`cluster-state-${state}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      {state}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Farmer State
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {uniqueFarmerStates.map((state) => (
                  <div key={state} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`farmer-state-${state}`}
                      checked={filteredFarmerStates.includes(state)}
                      onChange={() => handleFarmerStateFilter(state)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`farmer-state-${state}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      {state}
                    </label>
                  </div>
                ))}
              </div>
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Farm State
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {uniqueFarmStates.map((state) => (
                  <div key={state} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`farm-state-${state}`}
                      checked={filteredFarmStates.includes(state)}
                      onChange={() => handleFarmStateFilter(state)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`farm-state-${state}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      {state}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Farm District Filter */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Farm District
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {uniqueFarmDistricts.map((district) => (
                <div key={district} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`farm-district-${district}`}
                    checked={filteredFarmDistricts.includes(district)}
                    onChange={() => handleFarmDistrictFilter(district)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`farm-district-${district}`}
                    className="ml-2 text-sm text-gray-700 cursor-pointer"
                  >
                    {district}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Cultivation Data ({filteredAndSortedData.length} records)
              </h3>
              <div className="text-sm text-gray-500">
                Showing {filteredAndSortedData.length} of {data.length} entries
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Farmer Name
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cluster
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Farm Location
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size (acres)
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crop
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedData.length > 0 ? (
                  filteredAndSortedData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">
                              {item.farmer_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {item.cluster_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {item.farm_location}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {item.size}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">
                          acres
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {new Date(item.start_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {new Date(item.end_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Crop className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-900">{item.product}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 px-4 text-center">
                      <div className="text-gray-500">
                        No records found. Try adjusting your filters.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium">
                  {filteredAndSortedData.length}
                </span>{" "}
                entries
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium">Active Filters:</span>
                {searchTerm && ` Search: "${searchTerm}"`}
                {fromDate && ` From: ${fromDate}`}
                {toDate && ` To: ${toDate}`}
                {filteredClusters.length > 0 &&
                  ` Clusters: ${filteredClusters.length}`}
                {filteredProducts.length > 0 &&
                  ` Crops: ${filteredProducts.length}`}
                {filteredFarmerDistricts.length > 0 &&
                  ` Farmer Districts: ${filteredFarmerDistricts.length}`}
                {filteredClusterDistricts.length > 0 &&
                  ` Cluster Districts: ${filteredClusterDistricts.length}`}
                {filteredClusterStates.length > 0 &&
                  ` Cluster States: ${filteredClusterStates.length}`}
                {filteredFarmerStates.length > 0 &&
                  ` Farmer States: ${filteredFarmerStates.length}`}
                {filteredFarmStates.length > 0 &&
                  ` Farm States: ${filteredFarmStates.length}`}
                {filteredFarmDistricts.length > 0 &&
                  ` Farm Districts: ${filteredFarmDistricts.length}`}
                {!searchTerm &&
                  !fromDate &&
                  !toDate &&
                  filteredClusters.length === 0 &&
                  filteredProducts.length === 0 &&
                  filteredFarmerDistricts.length === 0 &&
                  filteredClusterDistricts.length === 0 &&
                  filteredClusterStates.length === 0 &&
                  filteredFarmerStates.length === 0 &&
                  filteredFarmStates.length === 0 &&
                  filteredFarmDistricts.length === 0 &&
                  " None"}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">Total Farms</div>
            <div className="text-2xl font-bold text-gray-800">
              {data.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">Total Acres</div>
            <div className="text-2xl font-bold text-gray-800">
              {data.reduce((sum, item) => sum + Number(item.size || 0), 0)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">Unique Clusters</div>
            <div className="text-2xl font-bold text-gray-800">
              {uniqueClusters.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">Crops</div>
            <div className="text-2xl font-bold text-gray-800">
              {uniqueProducts.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClusterCultivated;
