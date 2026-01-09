import React, { useState } from "react";
import EmployeeList from "../../components/EmployeeList/EmployeeList";
import salaryPageAPI from "../../axios/SalaryPageAPI";

export default function SalaryPage() {
  const formatDateDMY = (dateTime, lastDate = "") => {
    if (!dateTime) return "—";

    // Convert "2025-12-17 12:00:00" → "2025-12-17T12:00:00"
    const normalized = dateTime.replace(" ", "T");

    const d = new Date(normalized);

    if (isNaN(d)) return "—";
    let day;
    let month;
    let year;
    if (d) {
      day = String(d.getDate()).padStart(2, "0");
      month = String(d.getMonth() + 1).padStart(2, "0");
      year = d.getFullYear();
    }
    return `${day}/${month}/${year}`;
  };

  const [employee, setEmployee] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!employee) return alert("Select employee");

    setLoading(true);
    try {
      const res = await salaryPageAPI.generate({
        employee_id: employee.id,
        year,
        month,
        toDate,
      });

      setReport(res?.data?.data); // ★ controller se data aa raha hai
    } catch (e) {
      console.error(e);
      alert("Error generating salary");
    } finally {
      setLoading(false);
    }
  }

  async function fetchReport() {
    if (!employee) return alert("Select employee");

    try {
      const res = await salaryPageAPI.getReport(
        employee.id,
        year,
        month,
        toDate
      );

      setReport(res?.data?.data);
    } catch (err) {
      console.error(err);
      alert("Report not generated yet or error");
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6 min-h-screen bg-gray-100">
      {/* Employee Selector */}
      <div className="lg:w-1/4 bg-white p-5 rounded-2xl shadow-lg h-fit">
        <h5 className="text-lg font-semibold mb-4 text-gray-700">
          Select Employee
        </h5>
        <EmployeeList onSelect={setEmployee} show={false} />
      </div>

      {/* Salary Section */}
      <div className="lg:w-3/4 flex-1 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl shadow-lg">
          <div>
            <h4 className="text-xl font-bold text-gray-800">
              Salary — {employee?.name || "Select an employee"}
            </h4>
            <p className="text-gray-500 mt-1 text-sm">
              Generate or fetch saved salary report
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-3 md:mt-0">
            <input
              type="number"
              className="p-2 rounded-lg border border-gray-300 w-24"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />

            <input
              type="number"
              className="p-2 rounded-lg border border-gray-300 w-20"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            />

            <input
              type="date"
              className="p-2 rounded-lg border border-gray-300"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />

            <button
              onClick={generate}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              {loading ? "Generating..." : "Generate"}
            </button>

            {/* <button
              onClick={fetchReport}
              className="px-4 py-2 bg-gray-300 rounded-lg"
            >
              Fetch
            </button> */}
          </div>
        </div>

        {/* Report Section */}
        {report && (
          <div className="bg-white p-5 rounded-2xl shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <InfoCard label="Total Days" value={report.totalDays} />
              <InfoCard label="Working Days" value={report.workingDays} />
              <InfoCard label="Sundays" value={report.totalSundays} />
              <InfoCard label="Holidays" value={report.holidays} />
              <InfoCard label="Absent Days" value={report.absentDays} />
              <InfoCard label="Unpaid Leave" value={report.leaveUnpaid} />
              <InfoCard label="Paid Leave" value={report.leavePaid} />
              <InfoCard label="Half Day (Unpaid)" value={report.halfUnpaid} />
              <InfoCard label="Half Day (paid)" value={report.halfPaid} />

              <div className="col-span-full mt-3 p-4 bg-indigo-600 text-white rounded-lg text-center font-bold text-lg">
                Final Salary: ₹{report.finalSalary}
              </div>
            </div>

            {/* Attendance Table */}
            <h5 className="font-semibold mb-2 text-gray-700">
              Attendance & Deductions
            </h5>

            <div className="overflow-x-auto max-h-80 rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Leave Type</th>
                    <th className="px-2 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {report.attendanceRows?.map((rec, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1">
                        {new Date(rec.date).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-1">{rec.status}</td>
                      <td className="px-2 py-1">{rec.leave_type || "-"}</td>
                      <td className="px-2 py-1">{rec.reason || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Holiday Dates */}
            {report.holidayDates?.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold mb-1 text-gray-700">Holidays</h5>
                <ul className="list-disc ml-6 text-sm">
                  {report.holidayDates.map((d, idx) => (
                    <li key={idx}>
                      {/* {new Date(formatDateDMY(d)).toLocaleDateString()} */}
                      {formatDateDMY(d?.holiday_date)} - {d?.remark}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Incentives */}
            {report.incentiveRows?.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold mb-1 text-gray-700">Incentives</h5>
                <ul className="list-disc ml-6 text-sm">
                  {report.incentiveRows.map((i, idx) => (
                    <li key={idx}>
                      ₹{i.amount} – {i.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600">
              <div>Start Date: {formatDateDMY(report.finalDate)}</div>
              <div>End Date: {formatDateDMY(report.toDate, "last")}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Small Card Component */
function InfoCard({ label, value }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg text-center">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
