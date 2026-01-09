import React, { useState, useEffect } from 'react';
import api from '../../axios/AttendanceAPI';
import EmployeeList from '../EmployeeList/EmployeeList';
import dayjs from 'dayjs';

export default function AttendancePage() {
    const [selected, setSelected] = useState(null);
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [status, setStatus] = useState('present');
    const [reason, setReason] = useState('');

    const mark = async () => {
        if (!selected) return alert('Select employee');
        await api.mark({
            employee_id: selected.id, date, status, reason
        });
        alert('Saved');
    };

    return (
        <div style={{ display: 'flex', gap: 30 }}>
            <div style={{ width: 300 }}>
                <EmployeeList onSelect={setSelected} />
            </div>

            <div>
                <h3>Mark Attendance {selected ? `for ${selected.name}` : ''}</h3>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                <div>
                    <select value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="halfday">Half Day</option>
                        <option value="leave">Leave</option>
                    </select>
                </div>
                <div>
                    <input placeholder="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} />
                </div>
                <button onClick={mark}>Save</button>
            </div>
        </div>
    );
}
