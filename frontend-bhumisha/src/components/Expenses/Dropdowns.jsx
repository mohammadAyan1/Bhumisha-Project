import React, { useEffect, useState } from "react";
import employeeAPI from "../../axios/employeeAPI";
import expensesAPI from "../../axios/ExpensesAPI.js";
import salaryPageAPI from "../../axios/SalaryPageAPI.js";
import IncentiveAPI from "../../axios/IncentiveApi.js";
import { toast } from "react-toastify";

const Dropdowns = ({ editData, clearEditData }) => {
  const [formData, setFormData] = useState({
    category: "",
    subCategory: "",
    from: "",
    to: "",
    pnrNo: "",
    location: "",
    empName: "", // This will now store the selected employee name
    billNo: "",
    amount: "",
    remark: "",
    date: "",
    expensedate: "",
    incentive: "",
    company_id: "",
    vendor: "",
    firm: "",
    gst_number: "",
    address: "",
    contact: "",
    bill_no: "",
    total_amount: "",
    total_gst_amount: "",
    number_of_item: "",
  });

  const [billImage, setBillImage] = useState("");

  const getDocumentUrl = (documents) => {
    if (!documents) return null;

    try {
      if (documents.startsWith("[") && documents.endsWith("]")) {
        const parsed = JSON.parse(documents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      }
      return documents;
    } catch (error) {
      console.error("Error parsing documents:", error);
      return documents.replace(/[\[\]"]/g, "");
    }
  };

  const [employees, setEmployees] = useState([]);

  // In your Dropdowns component, add this useEffect
  useEffect(() => {
    // This will reset the form when editData becomes null (when cancel is clicked)
    if (!editData) {
      setFormData((prev) => ({
        ...prev,
        category: "",
        subCategory: "",
        from: "",
        to: "",
        pnrNo: "",
        location: "",
        empName: "",
        billNo: "",
        amount: "",
        remark: "",
        date: "",
        expensedate: "",
        incentive: "",
        company_id: "",
        vendor: "",
        firm: "",
        gst_number: "",
        address: "",
        contact: "",
        bill_no: "",
        total_amount: "",
        total_gst_amount: "",
        number_of_item: "",
      }));
      setFiles([]);
      setBillImage("");
    }
  }, [editData]); // This effect runs whenever editData changes

  useEffect(() => {
    if (!editData) return;

    if (editData?.expenseType == "gst_billing") {
      const image = getDocumentUrl(editData?.bill_image);

      setBillImage(image);

      setFormData((prev) => ({
        ...prev,
        category: editData?.expenseType,
        vendor: editData?.vendor_name,
        firm: editData?.firm_name,
        gst_number: editData?.gst_number,
        address: editData?.address,
        contact: editData?.contact,
        bill_no: editData?.bill_no,
        total_amount: editData?.total_amount,
        total_gst_amount: editData?.total_gst_amount,
        number_of_item: editData?.number_of_item,
        remark: editData?.remark,
        expensedate: editData?.bill_date,
      }));
    } else if (editData?.expenseType == "travels") {
      const image = getDocumentUrl(editData?.documents);

      const splitData = editData?.expenses_type.split("-");
      const from = splitData[0];
      const to = splitData[2];

      setBillImage(image);

      setFormData((prev) => ({
        ...prev,
        category: editData?.expenses_for,
        from: from,
        to: to,
        pnrNo: editData?.master_name,
        amount: editData?.amount,
        remark: editData?.remark,
        expensedate: editData?.expense_date,
      }));
    } else if (editData?.expenses_for == "emp") {
      const image = getDocumentUrl(editData?.documents);
      setBillImage(image);

      const filterEmployee = employees.find(
        (item) => item?.name == editData?.master_name
      );

      if (editData?.expenses_type == "salary") {
        setFormData((prev) => ({
          ...prev,
          category: editData?.expenses_for,
          empName: filterEmployee?.id,
          subCategory: editData?.expenses_type,
          amount: editData?.amount,
          incentive: editData?.incentive,
          remark: editData?.remark,
          expensedate: editData?.expense_date,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          category: editData?.expenses_for,
          empName: filterEmployee?.id,
          subCategory: editData?.expenses_type,
          amount: editData?.amount,
          remark: editData?.remark,
          expensedate: editData?.expense_date,
        }));
      }
    } else if (editData?.expenses_for == "others") {
      const image = getDocumentUrl(editData?.documents);
      setBillImage(image);
      setFormData((prev) => ({
        ...prev,
        category: editData?.expenses_for,
        amount: editData?.amount,
        remark: editData?.remark,
        expensedate: editData?.expense_date,
      }));
    } else if (editData?.expenses_for == "bill") {
      const image = getDocumentUrl(editData?.documents);
      setBillImage(image);
      setFormData((prev) => ({
        ...prev,
        category: editData?.expenses_for,
        amount: editData?.amount,
        remark: editData?.remark,
        expensedate: editData?.expense_date,
        billNo: editData?.master_name,
        subCategory: editData?.expenses_type,
      }));
    } else if (editData?.expenses_for == "rent") {
      const image = getDocumentUrl(editData?.documents);
      setBillImage(image);
      setFormData((prev) => ({
        ...prev,
        category: editData?.expenses_for,
        amount: editData?.amount,
        remark: editData?.remark,
        expensedate: editData?.expense_date,
        location: editData?.expenses_type,
      }));
    }
  }, [editData, employees]);

  const [disableBtn, setDisableBtn] = useState(false);

  const [files, setFiles] = useState([]);

  const handleFetchGeneratedSalary = async () => {
    setDisableBtn(true);

    const payload = {
      employee_id: formData?.empName,
      toDate: formData?.date,
    };
    await salaryPageAPI
      .generate(payload)
      .then((res) => {
        setFormData((prev) => ({
          ...prev,
          amount: res?.data?.data?.finalSalary,
          incentive: res?.data?.data?.incentive,
        }));
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setDisableBtn(false);
      });
  };

  useEffect(() => {
    employeeAPI
      .getAll()
      .then((res) => {
        setEmployees(res?.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const [errors, setErrors] = useState({});

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    // Reset all fields when category changes
    setFormData((prev) => ({
      ...prev,
      category,
      subCategory: "",
      from: "",
      to: "",
      pnrNo: "",
      location: "",
      empName: "",
      billNo: "",
      amount: "",
      remark: "",
      expensedate: "",
    }));

    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name == "subCategory" && value == "salary") {
      const emp = employees?.find((emp) => emp?.id == formData?.empName);

      setFormData((prev) => ({
        ...prev,
        amount: emp?.base_salary || "", // <-- sirf base_salary store
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    switch (formData.category) {
      case "travels":
        if (!formData.from) newErrors.from = "From location is required";
        if (!formData.to) newErrors.to = "To location is required";
        if (!formData.amount) newErrors.amount = "Amount is required";
        break;
      case "rent":
        if (!formData.location) newErrors.location = "Location is required";
        if (!formData.amount) newErrors.amount = "Amount is required";
        break;
      case "emp":
        if (!formData.empName) newErrors.empName = "Employee name is required";
        if (!formData.subCategory)
          newErrors.subCategory = "Please select sub category";
        if (!formData.amount) newErrors.amount = "Amount is required";
        break;
      case "bill":
        if (!formData.billNo) newErrors.billNo = "Bill number is required";
        if (!formData.amount) newErrors.amount = "Amount is required";
        if (!formData.subCategory)
          newErrors.subCategory = "Please select sub category";
        break;
      case "others":
        if (!formData.amount) newErrors.amount = "Amount is required";
        if (!formData.remark) newErrors.remark = "Remarks are required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData?.company_id) {
      alert("please select a company");
      return;
    }

    if (validateForm()) {
      const fd = new FormData();

      Object.keys(formData).forEach((key) => {
        fd.append(key, formData[key]);
      });

      files.forEach((file) => {
        fd.append("files", file);
      });

      if (formData?.category != "gst_billing") {
        expensesAPI
          .create(fd)
          .then(() => {
            // Reset form
            setFormData((prev) => ({
              ...prev,
              category: "",
              subCategory: "",
              from: "",
              to: "",
              pnrNo: "",
              location: "",
              empName: "",
              billNo: "",
              amount: "",
              remark: "",
              expensedate: "",
            }));

            setFiles([]);
            setCompany(null);
            setFiles([]);
            toast("Created expenses successfully!");
          })
          .catch((err) => console.error(err));
      } else {
        expensesAPI
          .billexpenses(fd)
          .then(() => {
            // Reset form
            setFormData((prev) => ({
              ...prev,
              category: "",
              subCategory: "",
              from: "",
              to: "",
              pnrNo: "",
              location: "",
              empName: "",
              billNo: "",
              amount: "",
              remark: "",
              vendor: "",
              firm: "",
              gst_number: "",
              address: "",
              contact: "",
              bill_no: "",
              total_amount: "",
              total_gst_amount: "",
              number_of_item: "",
              expensedate: "",
            }));
            setFiles([]);
            setCompany(null);
            setFiles([]);

            toast("Created expenses successfully!");
          })
          .catch((err) => console.error(err));
      }
    }
  };

  const renderDynamicFields = () => {
    switch (formData.category) {
      case "travels":
        return (
          <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              Travel Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="from"
                  value={formData.from}
                  onChange={handleInputChange}
                  placeholder="Departure location"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.from ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.from && (
                  <p className="mt-1 text-sm text-red-600">{errors.from}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="to"
                  value={formData.to}
                  onChange={handleInputChange}
                  placeholder="Destination location"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.to ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.to && (
                  <p className="mt-1 text-sm text-red-600">{errors.to}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PNR/Vehicle Number
                </label>
                <input
                  type="text"
                  name="pnrNo"
                  value={formData.pnrNo}
                  onChange={handleInputChange}
                  placeholder="Enter PNR number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Additional remarks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
          </div>
        );

      case "rent":
        return (
          <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              Rent Details
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Property location"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.location ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Rent amount"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Rent remarks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
              />
            </div>
          </div>
        );

      case "emp":
        return (
          <div className="mt-6 p-6 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">
              Employee Details
            </h3>

            {/* Employee Name Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Name <span className="text-red-500">*</span>
              </label>
              <select
                name="empName"
                value={formData.empName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.empName ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              {errors.empName && (
                <p className="mt-1 text-sm text-red-600">{errors.empName}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pay Type<span className="text-red-500">*</span>
              </label>
              <select
                name="subCategory"
                value={formData.subCategory}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.subCategory ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Type</option>
                <option value="advance">Advance</option>
                <option value="salary">Salary</option>
                <option value="others">Others</option>
              </select>
              {errors.subCategory && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.subCategory}
                </p>
              )}
            </div>
            {formData?.subCategory == "salary" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="Enter amount"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.amount ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.amount}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {"Incentive"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="incentive"
                      value={formData.incentive}
                      placeholder="Enter amount"
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.amount ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.amount}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Salary Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      // required={formData?.subCategory === "salary"}
                      value={formData.date}
                      onChange={handleInputChange}
                      placeholder="Enter amount"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.amount ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.amount}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleFetchGeneratedSalary}
                    className="bg-blue-700 p-1 text-white text-2xl rounded hover:bg-blue-400"
                    disabled={disableBtn}
                  >
                    Fetch Salary
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Rent amount"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.amount ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                  )}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Employee payment remarks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="3"
              />
            </div>
          </div>
        );

      case "bill":
        return (
          <div className="mt-6 p-6 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">
              Bill Details
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="billNo"
                value={formData.billNo}
                onChange={handleInputChange}
                placeholder="Enter bill number"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.billNo ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.billNo && (
                <p className="mt-1 text-sm text-red-600">{errors.billNo}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Type <span className="text-red-500">*</span>
              </label>
              <select
                name="subCategory"
                value={formData.subCategory}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.subCategory ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Type</option>
                <option value="light">Electricity</option>
                <option value="water">water</option>
                <option value="others">Others</option>
              </select>
              {errors.subCategory && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.subCategory}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Bill amount"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Bill remarks"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows="3"
              />
            </div>
          </div>
        );

      case "others":
        return (
          <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Other Expenses
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleInputChange}
                placeholder="Describe the expenses"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                  errors.remark ? "border-red-500" : "border-gray-300"
                }`}
                rows="3"
                required
              />
              {errors.remark && (
                <p className="mt-1 text-sm text-red-600">{errors.remark}</p>
              )}
            </div>
          </div>
        );

      case "gst_billing":
        return (
          <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              GST Billing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <input
                  type="text"
                  name="vendor"
                  value={formData?.vendor}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firm Name
                </label>
                <input
                  type="text"
                  name="firm"
                  value={formData?.firm}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gst_number"
                  value={formData?.gst_number}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData?.address}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact
                </label>
                <input
                  type="number"
                  name="contact"
                  value={formData?.contact}
                  onInput={(e) => {
                    // Limit to 10 digits
                    if (e.target.value.length > 10) {
                      e.target.value = e.target.value.slice(0, 10);
                    }
                  }}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bill No.
                </label>
                <input
                  type="text"
                  name="bill_no"
                  value={formData?.bill_no}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </label>
                <input
                  type="number"
                  name="total_amount"
                  value={formData?.total_amount}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total GST Amount
                </label>
                <input
                  type="number"
                  name="total_gst_amount"
                  value={formData?.total_gst_amount}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Item
                </label>
                <input
                  type="number"
                  name="number_of_item"
                  value={formData?.number_of_item}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  remark
                </label>
                <input
                  type="text"
                  name="remark"
                  value={formData?.remark}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const [company, setCompany] = useState(null);

  useEffect(() => {
    const rawData = localStorage.getItem("currentCompany");
    if (rawData) {
      setCompany(JSON.parse(rawData));
    }
  }, []);

  useEffect(() => {
    if (!company) return;

    setFormData((prev) => ({
      ...prev,
      company_id: company.id,
    }));
  }, [company]);

  const handleUpdateData = (e) => {
    e.preventDefault();

    if (!formData?.company_id) {
      alert("please select a company");
      return;
    }

    if (validateForm()) {
      const fd = new FormData();

      Object.keys(formData).forEach((key) => {
        fd.append(key, formData[key]);
      });

      if (files.length > 0) {
        files.forEach((file) => {
          fd.append("files", file);
        });
      } else {
        fd.append("files", editData?.bill_image);
      }

      if (formData?.category != "gst_billing") {
        expensesAPI
          .expensesUpdate(fd, editData?.id)
          .then((res) => {
            setFormData((prev) => ({
              ...prev,
              category: "",
              subCategory: "",
              from: "",
              to: "",
              pnrNo: "",
              location: "",
              empName: "",
              billNo: "",
              amount: "",
              remark: "",
              expensedate: "",
            }));

            setFiles([]);
            clearEditData();
            toast(" expenses Updated successfully!");
          })
          .catch((err) => console.error(err));
      } else {
        expensesAPI
          .billexpensesUpdate(fd, editData?.id)
          .then(() => {
            setFormData((prev) => ({
              ...prev,
              category: "",
              subCategory: "",
              from: "",
              to: "",
              pnrNo: "",
              location: "",
              empName: "",
              expensedate: "",
              billNo: "",
              amount: "",
              remark: "",
              vendor: "",
              firm: "",
              gst_number: "",
              address: "",
              contact: "",
              bill_no: "",
              total_amount: "",
              total_gst_amount: "",
              number_of_item: "",
            }));
            setFiles([]);
            clearEditData();

            toast(" GST billing expenses updated  successfully!");
          })
          .catch((err) => console.error(err));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Expenses Form
          </h2>

          <form onSubmit={editData ? handleUpdateData : handleSubmit}>
            {/* Main Category Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expenses Type <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Category</option>
                <option value="travels">Travels</option>
                <option value="rent">Rent</option>
                <option value="bill">Bill</option>
                <option value="emp">Employee</option>
                <option value="gst_billing">GST Billing</option>
                <option value="others">Others</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Dynamic Fields Based on Category */}
            {renderDynamicFields()}

            {/* FILE UPLOAD SECTION */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Files / Images
              </label>

              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={(e) => setFiles([...e.target.files])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />

              {!editData || files.length > 0 ? (
                <div>
                  {files.length > 0 ? (
                    <div className="mt-3 bg-gray-50 p-3 rounded-md border">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Selected Files:
                      </p>
                      <ul className="list-disc pl-5 text-sm text-gray-600">
                        {Array.from(files).map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-3">
                      No files selected
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-2">
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}/${billImage}`}
                    alt="bill image"
                  />
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>

              <input
                name="expensedate"
                type="date"
                value={formData.expensedate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div className="mt-8">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 font-medium"
              >
                {editData ? "Update Expenses" : "Submit Expense"}
              </button>
              {editData && (
                <button
                  type="button"
                  onClick={() => clearEditData()}
                  className=" mt-2 w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 font-medium"
                >
                  Cancel Update
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dropdowns;
