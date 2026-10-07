import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Stethoscope, Calendar, Clock, Edit } from 'lucide-react';

export const DoctorSchedulesView = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editDay, setEditDay] = useState('Monday');
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: 20,
    breakStartTime: '13:00',
    breakEndTime: '14:00',
    isAvailable: true
  });

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      if (res.success && res.data.length > 0) {
        setDoctors(res.data);
        setSelectedDoctorId(res.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  };

  const fetchSchedules = async () => {
    if (!selectedDoctorId) return;
    try {
      setLoading(true);
      const res = await api.get(`/doctors/schedules?doctorId=${selectedDoctorId}`);
      if (res.success) {
        setSchedules(res.data);
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [selectedDoctorId]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/doctors/schedules', {
        doctorId: selectedDoctorId,
        dayOfWeek: editDay,
        ...formData
      });
      if (res.success) {
        setShowModal(false);
        fetchSchedules();
      }
    } catch (err) {
      alert(err.message || 'Failed to update schedule');
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Doctor Schedules & Slot Configuration</h1>
          <p className="text-xs text-zinc-500">Manage shift hours, break times, and appointment slot durations per doctor.</p>
        </div>

        {/* Doctor Selector */}
        {doctors.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-600">Select Doctor:</span>
            <select
              value={selectedDoctorId}
              onChange={e => setSelectedDoctorId(e.target.value)}
              className="bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs font-semibold text-zinc-800"
            >
              {doctors.map(d => (
                <option key={d._id} value={d._id}>{d.name} ({d.specialization})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Schedule Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-100 border-b border-zinc-200 font-semibold text-zinc-700">
            <tr>
              <th className="p-3">Day of Week</th>
              <th className="p-3">Shift Hours</th>
              <th className="p-3">Break Time</th>
              <th className="p-3">Slot Duration</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Configure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-800">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-zinc-500">Loading schedules...</td>
              </tr>
            ) : days.map(day => {
              const sched = schedules.find(s => s.dayOfWeek === day);
              const isAvailable = sched ? sched.isAvailable : true;
              return (
                <tr key={day} className="hover:bg-zinc-50">
                  <td className="p-3 font-semibold text-zinc-900">{day}</td>
                  <td className="p-3 font-mono">
                    {sched ? `${sched.startTime} - ${sched.endTime}` : '09:00 - 17:00'}
                  </td>
                  <td className="p-3 font-mono text-zinc-500">
                    {sched ? `${sched.breakStartTime} - ${sched.breakEndTime}` : '13:00 - 14:00'}
                  </td>
                  <td className="p-3 font-medium text-emerald-800">
                    {sched ? `${sched.slotDurationMinutes} mins` : '20 mins'}
                  </td>
                  <td className="p-3">
                    {isAvailable ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">Available</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-900 border border-rose-300">Day Off</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setEditDay(day);
                        if (sched) {
                          setFormData({
                            startTime: sched.startTime,
                            endTime: sched.endTime,
                            slotDurationMinutes: sched.slotDurationMinutes,
                            breakStartTime: sched.breakStartTime,
                            breakEndTime: sched.breakEndTime,
                            isAvailable: sched.isAvailable
                          });
                        }
                        setShowModal(true);
                      }}
                      className="px-2.5 py-1 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 rounded text-xs font-semibold flex items-center gap-1.5 ml-auto"
                    >
                      <Edit size={13} /> Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white border border-zinc-300 rounded-md w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-3">Configure {editDay} Schedule</h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="avail"
                  checked={formData.isAvailable}
                  onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="avail" className="font-semibold text-zinc-800">Doctor is Available on {editDay}</label>
              </div>

              {formData.isAvailable && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-zinc-700 block mb-1">Shift Start Time</label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full p-2 border border-zinc-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-zinc-700 block mb-1">Shift End Time</label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full p-2 border border-zinc-300 rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-zinc-700 block mb-1">Break Start Time</label>
                      <input
                        type="time"
                        value={formData.breakStartTime}
                        onChange={e => setFormData({ ...formData, breakStartTime: e.target.value })}
                        className="w-full p-2 border border-zinc-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-zinc-700 block mb-1">Break End Time</label>
                      <input
                        type="time"
                        value={formData.breakEndTime}
                        onChange={e => setFormData({ ...formData, breakEndTime: e.target.value })}
                        className="w-full p-2 border border-zinc-300 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-zinc-700 block mb-1">Appointment Slot Duration (Minutes)</label>
                    <select
                      value={formData.slotDurationMinutes}
                      onChange={e => setFormData({ ...formData, slotDurationMinutes: Number(e.target.value) })}
                      className="w-full p-2 border border-zinc-300 rounded"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={20}>20 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-zinc-300 rounded text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
