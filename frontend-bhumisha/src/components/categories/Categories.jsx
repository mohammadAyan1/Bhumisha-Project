// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchCategories,
//   addCategory,
//   updateCategory,
//   deleteCategory,
//    updateCategoryStatus
// } from "../../features/Categories/categoiresSlice";
// import { Edit, Trash2, Plus, Loader2 } from "lucide-react";

// export default function Categories() {
//   const dispatch = useDispatch();
//   const { list: categories, loading } = useSelector((state) => state.categories);

//   const [newCategory, setNewCategory] = useState({ name: "", status: "active" });
//   const [search, setSearch] = useState("");
//   const [editCategory, setEditCategory] = useState(null);

//   // 🔹 Pagination states
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 8;

//   useEffect(() => {
//     dispatch(fetchCategories());
//   }, [dispatch]);

//   const handleAdd = () => {
//     if (!newCategory.name.trim()) return;
//     dispatch(addCategory(newCategory));
//     setNewCategory({ name: "", status: "active" });
//   };

//   const handleUpdate = () => {
//     if (!editCategory.name.trim()) return;
//     dispatch(
//       updateCategory({
//         id: editCategory.id,
//         data: { name: editCategory.name, status: editCategory.status },
//       })
//     );
//     setEditCategory(null);
//   };

//   const handleDelete = (id) => {
//     if (window.confirm("Delete this category?")) {
//       dispatch(deleteCategory(id));
//     }
//   };

//   // 🔹 Search + Pagination
//   const filteredCategories = categories.filter((cat) =>
//     cat.name.toLowerCase().includes(search.toLowerCase())
//   );
//   const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
//   const paginatedCategories = filteredCategories.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   return (
//     <div className="">
//       {/* Header */}
//       <div className="flex bg-white shadow-md justify-between items-center mb-4 p-4 rounded-lg">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           📦 Category Manager
//         </h1>
//         {/* Search */}
//         <div className="relative w-72">
//           <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
//             🔍
//           </span>
//           <input
//             type="text"
//             placeholder="Search categories..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm
//                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
//                transition duration-200"
//           />
//         </div>
//       </div>

//       <div className="grid grid-cols-3 text-center gap-6">
//         {/* Category Table */}
//         <div className="col-span-2 bg-white shadow-md rounded-lg p-4">
//           {loading ? (
//             <div className="flex justify-center items-center py-10">
//               <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
//               <span className="ml-2 text-gray-600">Loading...</span>
//             </div>
//           ) : (
//             <>
//               <table className="w-full  border rounded-lg overflow-hidden">
//                 <thead>
//                   <tr className="bg-gray-100  text-left">
//                     <th className="p-2 text-center border">S/N</th>
//                     <th className="p-2 text-center border">Name</th>
//                     <th className="p-2 text-center border">Status</th>
//                     <th className="p-2 text-center border">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {paginatedCategories.map((cat, idx) => (
//                     <tr key={cat.id} className="hover:bg-gray-50">
//                       <td className="p-2 border">
//                         {(currentPage - 1) * itemsPerPage + idx + 1}
//                       </td>
//                       <td className="p-2 border">{cat.name}</td>
//                     <td className="p-2 border text-center">
//   <label className="inline-flex items-center cursor-pointer">
//     <input
//       type="checkbox"
//       checked={cat.status.toLowerCase() === "active"}
//       onChange={() =>
//         dispatch(
//           updateCategoryStatus({
//             id: cat.id,
//             status: cat.status.toLowerCase() === "active" ? "Inactive" : "Active",
//           })
//         )
//       }
//       className="sr-only peer"
//     />
//     <div
//       className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none
//         peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer
//         peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full
//         peer-checked:after:border-white after:content-[''] after:absolute
//         after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300
//         after:border after:rounded-full after:h-5 after:w-5 after:transition-all
//         peer-checked:bg-green-500"
//     ></div>
//   </label>
// </td>

//                       <td className="p-2 border">
//                         <div className="flex gap-2 text-center justify-center">
//                           <button
//                             className="bg-green-500 p-2 rounded text-white"
//                             onClick={() => setEditCategory(cat)}
//                           >
//                             <Edit size={16} />
//                           </button>
//                           <button
//                             className="bg-red-500 p-2 rounded text-white"
//                             onClick={() => handleDelete(cat.id)}
//                           >
//                             <Trash2 size={16} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>

//               {/* 🔹 Pagination Controls */}
//               <div className="flex justify-between items-center mt-4">
//                 <button
//                   disabled={currentPage === 1}
//                   onClick={() => setCurrentPage((prev) => prev - 1)}
//                   className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
//                 >
//                   Prev
//                 </button>
//                 <span className="text-sm text-gray-600">
//                   Page {currentPage} of {totalPages}
//                 </span>
//                 <button
//                   disabled={currentPage === totalPages}
//                   onClick={() => setCurrentPage((prev) => prev + 1)}
//                   className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
//                 >
//                   Next
//                 </button>
//               </div>
//             </>
//           )}
//         </div>

//         {/* Add/Edit Category Form */}
//         <div className="bg-white shadow-md rounded-lg p-4">
//           <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
//             <Plus size={18} /> {editCategory ? "Edit Category" : "Add New Category"}
//           </h2>

//           <input
//             type="text"
//             placeholder="Enter category name"
//             value={editCategory ? editCategory.name : newCategory.name}
//             onChange={(e) =>
//               editCategory
//                 ? setEditCategory({ ...editCategory, name: e.target.value })
//                 : setNewCategory({ ...newCategory, name: e.target.value })
//             }
//             className="border rounded p-2 w-full mb-3"
//           />

//           {/* 🔹 Status Dropdown */}
//           <select
//             value={editCategory ? editCategory.status : newCategory.status}
//             onChange={(e) =>
//               editCategory
//                 ? setEditCategory({ ...editCategory, status: e.target.value })
//                 : setNewCategory({ ...newCategory, status: e.target.value })
//             }
//             className="border rounded p-2 w-full mb-3"
//           >
//             <option value="active">Active ✅</option>
//             <option value="inactive">Inactive ❌</option>
//           </select>

//           {editCategory ? (
//             <div className="flex gap-2">
//               <button
//                 onClick={handleUpdate}
//                 disabled={loading}
//                 className="w-full py-2 bg-green-600 text-white rounded flex active:scale-105 active:bg-green-500 justify-center items-center"
//               >
//                 {loading ? (
//                   <Loader2 className="animate-spin active:scale-105 active:bg-green-500 w-5 h-5" />
//                 ) : (
//                   "Update Category"
//                 )}
//               </button>
//               <button
//                 onClick={() => setEditCategory(null)}
//                 className="w-full py-2 bg-gray-400 text-white rounded"
//               >
//                 Cancel
//               </button>
//             </div>
//           ) : (
//             <button
//               onClick={handleAdd}
//               disabled={loading}
//               className="w-full py-2 bg-blue-600 text-white rounded flex justify-center items-center"
//             >
//               {loading ? (
//                 <Loader2 className="animate-spin active:scale-105 active:bg-green-500 w-5 h-5" />
//               ) : (
//                 "Save Category"
//               )}
//             </button>
//           )}

//           {/* Total Categories */}
//           <div className="mt-6 p-4 bg-gray-50 rounded shadow-sm text-center">
//             <p className="text-sm font-semibold text-gray-600">Total Categories</p>
//             <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
} from "../../features/Categories/categoiresSlice";
import {
  Edit,
  Trash2,
  Plus,
  Loader2,
  Layers,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function Categories() {
  const dispatch = useDispatch();
  const { list: categories, loading } = useSelector(
    (state) => state.categories
  );

  const [newCategory, setNewCategory] = useState({
    name: "",
    status: "active",
  });
  const [search, setSearch] = useState("");
  const [editCategory, setEditCategory] = useState(null);

  // Toggle state for active/inactive categories
  const [showInactive, setShowInactive] = useState(false);

  // 🔹 Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleAdd = () => {
    if (!newCategory.name.trim()) return;
    dispatch(addCategory(newCategory));
    setNewCategory({ name: "", status: "active" });
  };

  const handleUpdate = () => {
    if (!editCategory.name.trim()) return;
    dispatch(
      updateCategory({
        id: editCategory.id,
        data: { name: editCategory.name, status: editCategory.status },
      })
    );
    setEditCategory(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this category?")) {
      dispatch(deleteCategory(id));
    }
  };

  // 🔹 Filter categories based on showInactive toggle
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = showInactive
      ? (cat.status || "").toLowerCase() === "inactive"
      : (cat.status || "").toLowerCase() === "active";
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalCategories = categories.length;
  const activeCategories = categories.filter(
    (cat) => (cat.status || "").toLowerCase() === "active"
  ).length;
  const inactiveCategories = totalCategories - activeCategories;

  return (
    <div className="">
      {/* Header */}
      <div className="flex bg-white shadow-md justify-between items-center mb-4 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Layers className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Category Manager</h1>
            <p className="text-sm text-gray-500">
              Manage your product categories
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                 transition duration-200"
            />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-100 via-blue-200 to-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              Total Categories
            </p>
            <Layers size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            {totalCategories}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-100 via-green-200 to-green-50 rounded-lg shadow p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-900">Active</p>
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900 mt-2">
            {activeCategories}
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-50 rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">Inactive</p>
            <XCircle size={18} className="text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {inactiveCategories}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-100 via-purple-200 to-purple-50 rounded-lg shadow p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-purple-900">Showing</p>
            <span
              className={`w-3 h-3 rounded-full ${
                showInactive ? "bg-gray-500" : "bg-green-500"
              }`}
            />
          </div>
          <p className="text-2xl font-bold text-purple-900 mt-2">
            {showInactive ? "Inactive" : "Active"}
          </p>
          <p className="text-xs text-purple-700 mt-1">
            ({filteredCategories.length} categories)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Table */}
        <div className="lg:col-span-2 bg-white shadow-md rounded-lg p-4">
          {/* Toggle Button and Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div className="text-sm font-medium text-gray-700">
              Showing:{" "}
              {showInactive ? "Inactive Categories" : "Active Categories"}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Show Inactive Categories
              </span>
              <button
                onClick={() => {
                  setShowInactive(!showInactive);
                  setCurrentPage(1);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  showInactive ? "bg-purple-600" : "bg-gray-300"
                }`}
                aria-label={
                  showInactive
                    ? "Show active categories"
                    : "Show inactive categories"
                }
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    showInactive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Info banner when showing inactive categories */}
          {showInactive && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-yellow-700">
                  Showing inactive categories only. To activate a category,
                  click on its status toggle.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
              <span className="ml-2 text-gray-600">Loading categories...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-3 text-center border">S.No.</th>
                      <th className="p-3 text-center border">Name</th>
                      <th className="p-3 text-center border">Status</th>
                      <th className="p-3 text-center border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCategories.map((cat, idx) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="p-3 border">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="p-3 border font-medium">{cat.name}</td>
                        <td className="p-3 border text-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={
                                (cat.status || "").toLowerCase() === "active"
                              }
                              onChange={() =>
                                dispatch(
                                  updateCategoryStatus({
                                    id: cat.id,
                                    status:
                                      (cat.status || "").toLowerCase() ===
                                      "active"
                                        ? "Inactive"
                                        : "Active",
                                  })
                                )
                              }
                              className="sr-only peer"
                            />
                            <div
                              className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none 
                                peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer 
                                peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                                peer-checked:after:border-white after:content-[''] after:absolute 
                                after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 
                                after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                                peer-checked:bg-green-500"
                            ></div>
                            <span className="ml-2 text-sm">
                              {(cat.status || "").toLowerCase() === "active"
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </label>
                        </td>
                        <td className="p-3 border">
                          <div className="flex gap-2 text-center justify-center">
                            <button
                              className="p-2 rounded text-white bg-green-500 hover:bg-green-600 transition-colors"
                              onClick={() => setEditCategory(cat)}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="p-2 rounded text-white bg-red-500 hover:bg-red-600 transition-colors"
                              onClick={() => handleDelete(cat.id)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {paginatedCategories.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <Layers className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-600">
                    No {showInactive ? "inactive" : "active"} categories found
                  </p>
                  {search && (
                    <p className="text-sm text-gray-500 mt-1">
                      Try a different search term
                    </p>
                  )}
                </div>
              )}

              {/* 🔹 Pagination Controls */}
              {filteredCategories.length > itemsPerPage && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium text-gray-600">
                    Page <span className="font-bold">{currentPage}</span> of{" "}
                    <span className="font-bold">{totalPages}</span>
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add/Edit Category Form */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">
              {editCategory ? "Edit Category" : "Add New Category"}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                placeholder="Enter category name"
                value={editCategory ? editCategory.name : newCategory.name}
                onChange={(e) =>
                  editCategory
                    ? setEditCategory({ ...editCategory, name: e.target.value })
                    : setNewCategory({ ...newCategory, name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 🔹 Status Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={editCategory ? editCategory.status : newCategory.status}
                onChange={(e) =>
                  editCategory
                    ? setEditCategory({
                        ...editCategory,
                        status: e.target.value,
                      })
                    : setNewCategory({ ...newCategory, status: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active ✅</option>
                <option value="inactive">Inactive ❌</option>
              </select>
            </div>

            {editCategory ? (
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex justify-center items-center"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    "Update Category"
                  )}
                </button>
                <button
                  onClick={() => setEditCategory(null)}
                  className="flex-1 py-2.5 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={loading || !newCategory.name.trim()}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex justify-center items-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  "Save Category"
                )}
              </button>
            )}
          </div>

          {/* Summary Stats */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Category Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600">Currently Showing</p>
                <p className="text-lg font-bold text-blue-800">
                  {showInactive ? "Inactive" : "Active"}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-600">On This Page</p>
                <p className="text-lg font-bold text-green-800">
                  {paginatedCategories.length}
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <p>Search results: {filteredCategories.length} categories</p>
              <p>Total in database: {totalCategories} categories</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
