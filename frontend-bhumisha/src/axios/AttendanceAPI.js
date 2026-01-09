import { api } from "./axios";

const AttendanceAPI = {
  mark: (data) => api.post("/attendance/mark", data),
  delete: (attendanceId) =>
    api.post("/attendance/delete", {
      attendance_id: attendanceId,
    }),
  deleteEmployeePresentAttendance: (data) =>
    api.delete(`/attendance/deletepresent`, { params: data  }),

  getAll: () => api.get(`/employees/all`),
  getByYearMonth: (year, month) =>
    api.get(`/attendance/all?year=${year}&month=${month}`),
};

export default AttendanceAPI;
