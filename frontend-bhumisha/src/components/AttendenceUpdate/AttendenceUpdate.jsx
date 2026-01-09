// AttendenceUpdate.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import AttendanceAPI from "../../axios/AttendanceAPI";
import holidayAPI from "../../axios/Holiday";

const AttendenceUpdate = () => {
  const [date, setDate] = useState(null); // yyyy-mm from <input type="month">
  const [month, setMonth] = useState(null);
  const [year, setYear] = useState(null);

  const [employee, setEmployee] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [popup, setPopup] = useState({
    open: false,
    empId: null,
    day: null,
    status: "",
    reason: "",
    paidType: "unpaid",
  });

  const dayRefs = useRef({}); // refs to day header / first cell used for scroll
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const todayYear = today.getFullYear();

  const Days = (m, y) => new Date(y, m, 0).getDate();
  const normalizeDate = (isoStr) =>
    new Date(isoStr).toISOString().split("T")[0];

  // map holiday by yyyy-mm-dd
  const holidayMap = useMemo(() => {
    const map = {};
    holidays.forEach((h) => {
      if (h?.holiday_date) {
        map[normalizeDate(h.holiday_date)] = h;
      }
    });
    return map;
  }, [holidays]);

  const isSunday = (day, m, y) => new Date(y, m - 1, day).getDay() === 0;

  const isFutureDate = (day, m, y) => {
    const d = new Date(y, m - 1, day, 0, 0, 0, 0);
    const t = new Date(todayYear, todayMonth - 1, todayDay, 0, 0, 0, 0);
    return d > t;
  };

  const formatCellDateKey = (d, m, y) =>
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // --- Init month/year from input or default to current
  useEffect(() => {
    if (date) {
      const [yy, mm] = date.split("-");
      setMonth(Number(mm));
      setYear(Number(yy));
    } else {
      setMonth(todayMonth);
      setYear(todayYear);
    }
  }, [date]);

  // --- Fetch employees
  useEffect(() => {
    AttendanceAPI.getAll()
      .then((res) => setEmployee(res?.data ?? []))
      .catch((err) => console.error(err));
  }, []);

  // --- Fetch holidays
  const fetchAllHoliday = () => {
    holidayAPI
      .getAll()
      .then((res) => {
        const list = Array.isArray(res?.data)
          ? res.data
          : res?.data?.data ?? [];
        setHolidays(list);
      })
      .catch((err) => console.error(err));
  };
  useEffect(() => fetchAllHoliday(), []);

  // --- Fetch attendance for month
  const fetchAttendance = () => {
    if (!year || !month) return;
    AttendanceAPI.getByYearMonth(year, month)
      .then((res) => {
        // backend returns rows with a.date and leave_type etc.
        setAttendance(res?.data ?? []);
      })
      .catch((err) => console.error(err));
  };
  useEffect(() => fetchAttendance(), [year, month]);

  // --- helpers to save/delete
  const deleteAttendance = (attendanceId) => {
    if (!attendanceId) return;
    AttendanceAPI.delete(attendanceId)
      .then(() => fetchAttendance())
      .catch((err) => console.error(err));
  };

  // Backend expects `attendenceDate` key (as per your controller). We send full ISO date string (yyyy-mm-dd).
  const saveAttendance = (payload) => {
    // payload should include: employee_id, status, attendenceDate, reason?, leave_type?
    if (payload?.status != "present") {
      AttendanceAPI.mark(payload)
        .then(() => fetchAttendance())
        .catch((err) => console.error(err));
    } else {
      AttendanceAPI.deleteEmployeePresentAttendance(payload)
        .then(() => fetchAttendance())
        .catch((err) => console.error(err));
    }
  };

  // find attendance record for employee on a given day
  const getAttendanceStatus = (empId, day, m, y) =>
    attendance.find((a) => {
      const d = new Date(a.date);
      return (
        a.employee_id === empId &&
        d.getFullYear() === y &&
        d.getMonth() + 1 === m &&
        d.getDate() === day
      );
    }) || null;

  // Scroll to today's column on mount / when month/year/attendance changes
  useEffect(() => {
    const ref = dayRefs.current[todayDay];
    if (ref?.scrollIntoView) {
      // scroll horizontally into center so today's column visible
      ref.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [month, year, attendance, holidays]);

  // Popup submit handler (for leave / halfday)
  const submitPopup = () => {
    if (!popup.empId || !popup.day || !popup.status) {
      setPopup({ ...popup, open: false });
      return;
    }

    const finalDate = formatCellDateKey(popup.day, month, year); // yyyy-mm-dd

    const payload = {
      employee_id: popup.empId,
      status: popup.status,
      attendenceDate: finalDate, // backend expects this key name
      reason: popup.reason || null,
      leave_type: popup.paidType || "unpaid", // DB column name is leave_type
    };

    saveAttendance(payload);

    setPopup({
      open: false,
      empId: null,
      day: null,
      status: "",
      reason: "",
      paidType: "unpaid",
    });
  };

  // Close popup without saving
  const closePopup = () =>
    setPopup({
      open: false,
      empId: null,
      day: null,
      status: "",
      reason: "",
      paidType: "unpaid",
    });

  // UI helpers: checkbox state logic
  // checkboxChecked: if no record => true (present). If record present => true only when status === 'present'
  const isCheckboxChecked = (att) => (att ? att.status === "present" : true);

  return (
    <div className="p-4 max-w-full overflow-x-auto">
      {/* Date Filter */}
      <div className="mb-4 flex items-center gap-4">
        <input
          type="month"
          className="border rounded-lg p-2"
          onChange={(e) => setDate(e.target.value)}
          value={date ?? `${todayYear}-${String(todayMonth).padStart(2, "0")}`}
        />
        <div className="font-semibold">
          {String(month).padStart(2, "0")}/{year}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded-lg shadow">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-20">
            <tr>
              <th className="px-3 py-2 text-center sticky left-0 bg-gray-100 z-30">
                SNO
              </th>
              <th className="px-3 py-2 text-left sticky left-12 bg-gray-100 z-30 min-w-[180px]">
                Name
              </th>

              {/* Days header */}
              {Array.from({ length: Days(month, year) }, (_, i) => {
                const d = i + 1;
                const isTodayCol =
                  d === todayDay && month === todayMonth && year === todayYear;
                return (
                  <th
                    key={d}
                    ref={(el) => {
                      if (!dayRefs.current[d]) dayRefs.current[d] = el;
                    }}
                    className={`px-2 py-2 text-center align-top ${
                      isTodayCol ? "bg-yellow-100" : ""
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {String(d).padStart(2, "0")}/
                      {String(month).padStart(2, "0")}
                    </div>
                  </th>
                );
              })}

              <th className="px-2 py-2 bg-gray-100 text-center">
                Working Days
              </th>
              <th className="px-2 py-2 bg-gray-100 text-center">Present</th>
              <th className="px-2 py-2 bg-gray-100 text-center">Absent</th>
              <th className="px-2 py-2 bg-gray-100 text-center">Leaves</th>
              <th className="px-2 py-2 bg-gray-100 text-center">Half Days</th>
            </tr>
          </thead>

          <tbody>
            {employee.map((emp, idx) => {
              // counters per employee for summary columns
              let working = 0;
              let present = 0;
              let absent = 0;
              let leaves = 0;
              let half = 0;

              return (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white z-10 text-center px-3 py-2">
                    {idx + 1}
                  </td>
                  <td className="sticky left-12 bg-white z-10 px-3 py-2">
                    {emp.name}
                  </td>

                  {Array.from({ length: Days(month, year) }, (_, i) => {
                    const day = i + 1;
                    const key = formatCellDateKey(day, month, year);
                    const holiday = holidayMap[key];
                    const sund = isSunday(day, month, year);
                    const future = isFutureDate(day, month, year);
                    const att = getAttendanceStatus(emp.id, day, month, year);

                    // count working days (exclude sunday & holiday)
                    if (!sund && !holiday) working++;
                    if (att?.status === "present") present++;
                    else if (att?.status === "absent") absent++;
                    else if (att?.status === "leave") leaves++;
                    else if (
                      ["first halfday", "second halfday"].includes(att?.status)
                    )
                      half++;

                    // Sunday cell (vertical text). Make it sticky on vertical scroll (top) but not horizontally.
                    if (sund) {
                      return (
                        <td
                          key={key}
                          className="text-center font-semibold"
                          style={{
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                            position: "sticky",
                            top: 0,
                            background: "transparent",
                          }}
                        >
                          <div className="text-red-600">Sunday</div>
                        </td>
                      );
                    }

                    // Holiday cell (vertical)
                    if (holiday) {
                      return (
                        <td
                          key={key}
                          className="text-center font-semibold"
                          style={{
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                            position: "sticky",
                            top: 0,
                          }}
                        >
                          <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                            HOLIDAY
                          </div>
                        </td>
                      );
                    }

                    // Future date: show empty cell (as requested) except keep checkbox? you asked "kuch bhi na show except sunday and holiday" — so empty
                    if (future) {
                      return <td key={key} className="text-center"></td>;
                    }

                    // Normal working day cell
                    return (
                      <td key={key} className="text-center px-1 py-2">
                        <div className="flex flex-col items-center gap-1">
                          {/* Checkbox: default checked means present (if no record), otherwise reflects status === 'present' */}
                          <input
                            type="checkbox"
                            title="Present toggle"
                            checked={isCheckboxChecked(att)}
                            onChange={(e) => {
                              const checked = e.target.checked;

                              // If user checks -> mark present (save)
                              if (checked) {
                                // If no existing record -> call mark present

                                const payload = {
                                  employee_id: emp.id,
                                  status: "present",
                                  attendenceDate: key,
                                };
                                saveAttendance(payload);
                                return;
                              }

                              // If user unchecks -> mark absent immediately
                              const payload = {
                                employee_id: emp.id,
                                status: "absent",
                                attendenceDate: key,
                              };
                              saveAttendance(payload);
                            }}
                          />

                          {/* dropdown for explicit control */}
                          <select
                            className="border rounded p-1 text-sm"
                            value={att?.status || ""}
                            onChange={(e) => {
                              const value = e.target.value;

                              if (value === "") {
                                // user cleared selection -> delete record if exists
                                att && deleteAttendance(att.id);
                                return;
                              }

                              if (value === "absent") {
                                // immediate save
                                saveAttendance({
                                  employee_id: emp.id,
                                  status: "absent",
                                  attendenceDate: key,
                                });
                                return;
                              }

                              // For leave or halfday: open popup (collect reason & paid/unpaid)
                              if (
                                [
                                  "leave",
                                  "first halfday",
                                  "second halfday",
                                ].includes(value)
                              ) {
                                setPopup({
                                  open: true,
                                  empId: emp.id,
                                  day,
                                  status: value,
                                  reason: "",
                                  paidType: "unpaid",
                                });
                                return;
                              }

                              // any other status: just save
                              saveAttendance({
                                employee_id: emp.id,
                                status: value,
                                attendenceDate: key,
                              });
                            }}
                          >
                            <option value="">Present</option>
                            <option value="leave">Leave</option>
                            <option value="absent">Absent</option>
                            <option value="first halfday">
                              First Half Day
                            </option>
                            <option value="second halfday">
                              Second Half Day
                            </option>
                            {/* <option value="present">Present</option> */}
                          </select>
                        </div>
                      </td>
                    );
                  })}

                  {/* Summary columns */}
                  <td className="text-center font-semibold">{working}</td>
                  <td className="text-center font-semibold">
                    {/* present calculation: working - (absent + leaves + half/2) might not be exactly correct always,
                        but we also tracked `present` variable above. We'll compute as:
                        presentCount = present (records with status present)
                        + (working - (present+absent+leaves+half))  -> days with no record we assume present
                    */}
                    {(() => {
                      // recompute present/absent/leaves/half for displayed month for this employee:
                      // simpler: presentDays = working - (absent + leaves + half/2)
                      const presentCalc = Math.max(
                        0,
                        Math.round(working - (absent + leaves + half / 2))
                      );
                      return presentCalc;
                    })()}
                  </td>
                  <td className="text-center font-semibold">{absent}</td>
                  <td className="text-center font-semibold">{leaves}</td>
                  <td className="text-center font-semibold">{half}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Popup (Leave / Halfday details) */}
      {popup.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white p-5 rounded-xl shadow-xl w-96">
            <h3 className="text-lg font-bold mb-3">Extra Details</h3>

            <div className="mb-2">
              <label className="block text-sm font-medium">Reason</label>
              <input
                type="text"
                className="border w-full p-2 rounded mt-1"
                value={popup.reason}
                onChange={(e) => setPopup({ ...popup, reason: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium">Paid Type</label>
              <select
                className="border w-full p-2 rounded mt-1"
                value={popup.paidType}
                onChange={(e) =>
                  setPopup({ ...popup, paidType: e.target.value })
                }
              >
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button className="px-4 py-2 rounded border" onClick={closePopup}>
                Close
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={submitPopup}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendenceUpdate;
