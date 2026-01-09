const pool = require("../config/db");
const { calculateSalary } = require("../utils/salaryCalc");

function queryAsync(sql, params) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function generateSalaryByMe(req, res) {
  try {
    const { employee_id, toDate } = req.body;

    if (!employee_id)
      return res.status(400).json({ error: "employee_id required" });

    // ---------------- FETCH EMPLOYEE ----------------
    const empRows = await queryAsync(
      "SELECT id, base_salary, join_date, salary_date FROM employees WHERE id=?",
      [employee_id]
    );

    if (!empRows.length)
      return res.status(404).json({ error: "Employee not found" });

    const emp = empRows[0];
    const baseSalary = Number(emp.base_salary);

    const [toY, toM, toD] = toDate.split("-");
    let salD;

    if (emp?.salary_date) {
      // salary_date available → use this
      const [, , d] = emp.salary_date.split("-");
      salD = d;
    } else {
      // salary_date missing → use joining_date (never null)
      const [, , d] = emp.join_date.split("-");
      salD = d;
    }

    const sendingDay = Number(toD);
    const salaryDay = Number(salD);

    let finalDate;
    let makeConditionTrue = false;
    let myCurrectCondition;
    let salaryEndDate;
    let todayDayFromGivenDate;
    // ---------------- SALARY CYCLE DATE ----------------
    if (sendingDay > salaryDay) {
      makeConditionTrue = true;

      finalDate = `${toY}-${toM}-${salD}`;

      let nextYear = Number(toY);
      let nextMonth = Number(toM) + 1;

      if (nextMonth === 13) {
        nextMonth = 1;
        nextYear += 1;
      }

      myCurrectCondition = `${nextYear}-${String(nextMonth).padStart(
        2,
        "0"
      )}-${salD}`;

      const date1 = new Date(finalDate);
      const date2 = new Date(toDate);

      // Difference in milliseconds
      const diffMs = date2 - date1;

      // Convert to days
      const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

      todayDayFromGivenDate = totalDays;
    } else {
      const d = new Date(toDate);
      d.setMonth(d.getMonth() - 1);
      const prevY = d.getFullYear();
      const prevM = String(d.getMonth() + 1).padStart(2, "0");
      finalDate = `${prevY}-${prevM}-${salD}`;

      const toDateObj = new Date(toDate);
      const finalDateObj = new Date(finalDate);

      // extract year and month from toDate
      const year = toDateObj.getFullYear();
      const month = String(toDateObj.getMonth() + 1).padStart(2, "0");

      // extract day from finalDate
      const day = String(finalDateObj.getDate()).padStart(2, "0");

      // create combined date
      const combinedDate = `${year}-${month}-${day}`;
      salaryEndDate = combinedDate;

      const date1 = new Date(finalDate);
      const date2 = new Date(toDate);

      // Difference in milliseconds
      const diffMs = date2 - date1;

      // Convert to days
      const totalDaysFromGivenDate =
        Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

      todayDayFromGivenDate = totalDaysFromGivenDate;
    }

    // ---------------- GET HOLIDAYS ----------------
    const holidayRows = await queryAsync(
      `SELECT * FROM holidays
       WHERE holiday_date BETWEEN ? AND ?`,
      [finalDate, makeConditionTrue ? myCurrectCondition : toDate]
    );

    const holidayDates = holidayRows.map((h) => {
      return { holiday_date: h.holiday_date, remark: h.remark };
    });

    // ---------------- GET ATTENDANCE ----------------
    const attendanceRows = await queryAsync(
      `SELECT * FROM attendance
       WHERE employee_id=? AND date BETWEEN ? AND ?
       ORDER BY date ASC`,
      [employee_id, finalDate, makeConditionTrue ? myCurrectCondition : toDate]
    );

    // ---------------- COUNT SUNDAYS ----------------
    function getSundays(start, end) {
      let s = new Date(start);
      let e = new Date(end);
      let count = 0;
      while (s <= e) {
        if (s.getDay() === 0) count++;
        s.setDate(s.getDate() + 1);
      }
      return count;
    }

    const totalSundays = getSundays(
      finalDate,
      makeConditionTrue ? myCurrectCondition : toDate
    );

    // ---------------- TOTAL DAYS RANGE ----------------
    const d1 = new Date(finalDate);
    const d2 = new Date(makeConditionTrue ? myCurrectCondition : salaryEndDate);
    // const totalDays = (d2 - d1) / (1000 * 60 * 60 * 24) + 1;
    // FIX: salary cycle should end one day before the selected salary date
    let adjustedEnd = new Date(
      makeConditionTrue ? myCurrectCondition : salaryEndDate
    );

    if (makeConditionTrue) {
      adjustedEnd.setDate(adjustedEnd.getDate() - 1);
    }

    // if user selects same salary day (like 10), reduce one day
    if (sendingDay === salaryDay) {
      adjustedEnd.setDate(adjustedEnd.getDate() - 1);
      todayDayFromGivenDate = todayDayFromGivenDate - 1;
    }

    const totalDays =
      Math.floor((adjustedEnd - d1) / (1000 * 60 * 60 * 24)) + 1;

    // ---------------- WORKING DAYS ----------------
    const workingDays = totalDays - totalSundays - holidayDates.length;

    // ---------------- ATTENDANCE COUNTS ----------------
    let absentDays = 0;
    let leavePaid = 0;
    let leaveUnpaid = 0;
    let halfPaid = 0;
    let halfUnpaid = 0;

    attendanceRows.forEach((row) => {
      if (row.status === "absent") absentDays++;

      if (row.status === "leave") {
        if (row.leave_type === "paid") leavePaid++;
        else leaveUnpaid++;
      }

      if (
        row.status === "halfday" ||
        row.status === "first halfday" ||
        row.status === "second halfday"
      ) {
        if (row.leave_type === "paid") halfPaid++;
        else halfUnpaid++;
      }
    });

    // ---------------- PER DAY SALARY ----------------
    const perDaySalary = baseSalary / totalDays;

    // ---------------- SALARY DEDUCTIONS ----------------
    const deductAbsent = absentDays * perDaySalary;
    const deductLeaveUnpaid = leaveUnpaid * perDaySalary;
    const deductHalfUnpaid = halfUnpaid * (perDaySalary / 2);

    const totalDeduction = deductAbsent + deductLeaveUnpaid + deductHalfUnpaid;

    // ---------------- INCENTIVE FETCH ----------------
    const incentiveRows = await queryAsync(
      `SELECT * FROM incentives
       WHERE employee_id=? AND year=? AND month=? `,
      [employee_id, toY, toM]
    );

    let incentiveAmount = 0;

    if (incentiveRows.length > 0) {
      // incentiveAmount = Number(incentiveRows[0].amount);
      incentiveAmount = incentiveRows?.reduce(
        (sum, item) => sum + Number(item?.amount),
        0
      );

      // Mark incentive as USED
      await queryAsync("UPDATE incentives SET is_used=1 WHERE id=?", [
        incentiveRows[0].id,
      ]);
    }

    // ---------------- FINAL SALARY ----------------
    const salaryBeforeDeduction = todayDayFromGivenDate * perDaySalary;
    const finalSalary =
      salaryBeforeDeduction - totalDeduction + incentiveAmount;

    return res.json({
      success: true,
      data: {
        finalDate,
        // toDate: makeConditionTrue ? myCurrectCondition : toDate,
        toDate,
        totalDays,
        totalSundays,
        holidays: holidayDates.length,
        workingDays,

        // Attendance
        absentDays,
        leavePaid,
        leaveUnpaid,
        halfPaid,
        halfUnpaid,

        // salary details
        perDaySalary: perDaySalary.toFixed(2),
        salaryBeforeDeduction: salaryBeforeDeduction.toFixed(2),
        totalDeduction: totalDeduction.toFixed(2),
        incentiveAmount,
        finalSalary: finalSalary.toFixed(2),

        attendanceRows,
        holidayDates,
        incentiveRows,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

// ----------------- GET SALARY REPORT -----------------
function getSalaryReport(req, res) {
  const { id } = req.params;
  const { year, month, toDate } = req.query;

  pool.query(
    "SELECT * FROM salary_reports WHERE employee_id=? AND year=? AND month=?",
    [id, year, month],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0)
        return res.status(404).json({ error: "Not generated" });

      const salary = rows[0];

      // fetch attendance rows in period saved in report (we stored days_in_month but not start/end dates) -> fallback: use employee salary_date/join_date -> compute same way as generate
      pool.query(
        "SELECT base_salary, join_date, salary_date FROM employees WHERE id=?",
        [id],
        (err2, empRows) => {
          if (err2) return res.status(500).json({ error: err2.message });
          const emp = empRows[0];
          const startDate = emp.salary_date
            ? fmtYMD(emp.salary_date)
            : fmtYMD(emp.join_date);
          const endDate = toDate || fmtYMD(new Date());

          pool.query(
            "SELECT date, status, leave_type, reason FROM attendance WHERE employee_id=? AND date BETWEEN ? AND ?",
            [id, startDate, endDate],
            (err3, attendanceRows) => {
              if (err3) return res.status(500).json({ error: err3.message });

              // reconstruct per-day pro-rata and deductions same as generate
              const { calculateSalary } = require("../utils/salaryCalc"); // require fresh
              const calc = calculateSalary(
                Number(emp.base_salary || 0),
                attendanceRows || [],
                startDate,
                endDate
              );

              return res.json({
                success: true,
                result: {
                  daysInMonth: calc.daysInMonth,
                  perDay: Number(
                    (
                      Number(emp.base_salary || 0) /
                      (new Date(endDate).getDate() || 30)
                    ).toFixed(2)
                  ),
                  todayDayFromGivenDate,
                  total_deduction: calc.totalDeduction,
                  total_incentives: salary.total_incentives,
                  final_salary: calc.finalSalary,
                  attendanceRecords: calc.attendanceBreakdown,
                  grossAmount: calc.grossAmount,
                  startDate,
                  endDate,
                },
              });
            }
          );
        }
      );
    }
  );
}

module.exports = { getSalaryReport, generateSalaryByMe };
