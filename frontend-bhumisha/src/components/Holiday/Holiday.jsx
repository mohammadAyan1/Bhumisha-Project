import React, { useEffect, useState } from "react";
import holidayAPI from "../../axios/Holiday";
import { toast } from "react-toastify";

const Holiday = () => {
  const [holidayData, setHolidayData] = useState({
    holidayDate: "",
    holidayRemark: "",
    id: "",
  });

  const [editOn, setEditOn] = useState(false);

  const [showHolidayData, setShowHolidayData] = useState([]);
  const [shortHolidayDataByDate, setShortHolidayDataByDate] = useState("desc");
  const [date, setDate] = useState({});

  const fetchHolidayData = async () => {
    await holidayAPI.getAll().then((res) => {
      setShowHolidayData(res?.data);
    });
  };

  const createHoliday = async (e) => {
    e.preventDefault();

    if (!editOn) {
      await holidayAPI.create(holidayData).then((res) => {
        if (res?.data?.success) {
          toast.success("Holiday Created successfully");
          setHolidayData({ holidayDate: "", holidayRemark: "" });
          fetchHolidayData();
        } else {
          toast.error(res?.data?.message);
        }
      });
    } else {
      await holidayAPI.update(holidayData).then((res) => {
        if (res?.data?.success) {
          toast.success("Holiday Updated successfully");
          setHolidayData({ holidayDate: "", holidayRemark: "", id: "" });
          fetchHolidayData();
        } else {
          toast.error(res?.data?.message);
        }
      });
    }
  };

  useEffect(() => {
    fetchHolidayData();
  }, []);

  const handleShortData = () => {
    if (shortHolidayDataByDate === "desc") {
      const sortedData = [...showHolidayData].sort(
        (a, b) => new Date(a.holiday_date) - new Date(b.holiday_date)
      );
      setShowHolidayData(sortedData);
      setShortHolidayDataByDate("aesc");
    } else {
      const sortedData = [...showHolidayData].sort(
        (a, b) => new Date(b.holiday_date) - new Date(a.holiday_date)
      );
      setShowHolidayData(sortedData);
      setShortHolidayDataByDate("desc");
    }
  };

  const handleFilterByDate = () => {
    const dateFilteredData = [...showHolidayData].filter((item) => {
      const holidayDate = new Date(item?.holiday_date);
      return (
        holidayDate >= new Date(date?.from) && holidayDate <= new Date(date?.to)
      );
    });

    setShowHolidayData(dateFilteredData);
  };

  const handleEdit = (data) => {
    setEditOn(true);

    setHolidayData((prev) => ({
      ...prev,
      holidayDate: data?.holiday_date,
      holidayRemark: data?.remark,
      id: data?.id,
    }));
  };
  const handleDelete = async (id) => {
    await holidayAPI.delete(id).then((res) => {
      if (res?.data?.success) {
        toast.success("Holiday deleted successfully");
        fetchHolidayData();
      } else {
        toast.error("Holiday did not deleted");
      }
    });
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Create Holiday */}
      <div className="bg-white rounded-xl shadow-md p-6 max-w-xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Create Holiday
        </h2>

        <form onSubmit={createHoliday} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              Holiday Date
            </label>
            <input
              type="date"
              name="holidayDate"
              value={holidayData?.holidayDate}
              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onChange={(e) =>
                setHolidayData((prev) => ({
                  ...prev,
                  [e.target.name]: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              Holiday Reason
            </label>
            <input
              type="text"
              name="holidayRemark"
              value={holidayData?.holidayRemark}
              placeholder="Enter holiday reason"
              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onChange={(e) =>
                setHolidayData((prev) => ({
                  ...prev,
                  [e.target.name]: e.target.value,
                }))
              }
            />
          </div>

          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition">
            {editOn ? "Update" : "Submit"}
          </button>
        </form>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-md p-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">From Date</label>
          <input
            type="date"
            name="from"
            className="border rounded-md px-3 py-2"
            onChange={(e) =>
              setDate((prev) => ({ ...prev, from: e.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">To Date</label>
          <input
            type="date"
            name="to"
            className="border rounded-md px-3 py-2"
            onChange={(e) =>
              setDate((prev) => ({ ...prev, to: e.target.value }))
            }
          />
        </div>

        <button
          onClick={handleFilterByDate}
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md transition"
        >
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th
                className="px-6 py-3 cursor-pointer hover:text-blue-600"
                onClick={handleShortData}
              >
                Holiday Date
              </th>
              <th className="px-6 py-3">Remark</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {showHolidayData?.map((item, index) => (
              <tr key={index} className="border-t hover:bg-gray-50 transition">
                <td className="px-6 py-3">
                  {item?.holiday_date
                    ? new Date(item.holiday_date).toLocaleDateString("en-GB")
                    : ""}
                </td>

                <td className="px-6 py-3">{item?.remark}</td>
                <td className="px-6 py-3">
                  <div>
                    <span
                      onClick={() => {
                        handleEdit(item);
                      }}
                    >
                      ✏️
                    </span>
                    <span
                      onClick={() => {
                        handleDelete(item?.id);
                      }}
                    >
                      🗑️
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Holiday;
