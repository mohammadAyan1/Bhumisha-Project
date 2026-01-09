function calculateSalary(
  baseSalary,
  attendanceRecords,
  year,
  month,
  incentivesTotal = 0
) {
  const daysInMonth = new Date(year, month, 0).getDate();
  // keep high precision until final rounding
  const perDayRaw = baseSalary / daysInMonth;

  let totalDeductionRaw = 0;

  attendanceRecords.forEach((r) => {
    // defensive normalization
    const s = (r.status || "").toString().trim().toLowerCase();
    const lt = (r.leave_type || "unpaid").toString().trim().toLowerCase();
    // treat anything other than explicit 'paid' as unpaid
    const isPaid = lt === "paid";

    if (s === "absent") {
      totalDeductionRaw += perDayRaw;
    } else if (
      s === "first halfday" ||
      s === "second halfday" ||
      s === "halfday"
    ) {
      if (!isPaid) totalDeductionRaw += perDayRaw / 2;
    } else if (s === "leave") {
      if (!isPaid) totalDeductionRaw += perDayRaw;
    }
  });

  const perDay = Number(perDayRaw.toFixed(2));
  const totalDeduction = Number(totalDeductionRaw.toFixed(2));
  const finalSalary = Number(
    (baseSalary - totalDeductionRaw + Number(incentivesTotal || 0)).toFixed(2)
  );

  return {
    daysInMonth,
    perDay,
    totalDeduction,
    incentivesTotal: Number(Number(incentivesTotal || 0).toFixed(2)),
    finalSalary,
    attendanceRecords,
  };
}

module.exports = { calculateSalary };
