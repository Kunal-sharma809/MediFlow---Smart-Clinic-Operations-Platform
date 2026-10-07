import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Plus, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const AppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState('');

  // Booking Form State
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '',
    reasonForVisit: ''
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aptRes, patRes, docRes] = await Promise.all([
        api.get(`/appointments${selectedStatus ? `?status=${selectedStatus}` : ''}`),
        api.get('/patients'),
        api.get('/doctors')
      ]);

      if (aptRes.success) setAppointments(aptRes.data);
      if (patRes.success) setPatients(patRes.data);
      if (docRes.success) setDoctors(docRes.data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus]);

  // Fetch slots whenever doctorId or appointmentDate changes in form
  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      const fetchSlots = async () => {
        try {
          setLoadingSlots(true);
          const res = await api.get(`/doctors/${formData.doctorId}/available-slots?date=${formData.appointmentDate}`);
          if (res.success) {
            setAvailableSlots(res.data);
          }
        } catch (err) {
          console.error('Failed to fetch slots:', err);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [formData.doctorId, formData.appointmentDate]);

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/appointments', formData);
      if (res.success) {
        setShowModal(false);
        setFormData({
          patientId: '', doctorId: '',
          appointmentDate: new Date().toISOString().split('T')[0],
          timeSlot: '', reasonForVisit: ''
        });
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to book appointment.');
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const res = await api.put(`/appointments/${appointmentId}/status`, { status: newStatus });
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CHECKED_IN':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">Checked In</span>;
      case 'IN_CONSULTATION':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-900 border border-teal-300">In Consultation</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-900 border border-rose-300">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-300">Scheduled</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Appointments & Booking</h1>
          <p className="text-xs text-zinc-500">Schedule appointments, assign queue slots, and manage patient consultation status.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold"
        >
          <Plus size={15} />
          Book New Appointment
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap text-xs">
        {['', 'SCHEDULED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded font-medium border transition-all ${
              selectedStatus === st
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
            }`}
          >
            {st ? st.replace('_', ' ') : 'All Statuses'}
          </button>
        ))}
      </div>

      {/* Appointments Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-100 border-b border-zinc-200 font-semibold text-zinc-700">
            <tr>
              <th className="p-3">Code / Queue</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Doctor</th>
              <th className="p-3">Date & Time Slot</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-800">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-500">Loading appointments...</td>
              </tr>
            ) : appointments.length > 0 ? (
              appointments.map((apt) => (
                <tr key={apt._id} className="hover:bg-zinc-50">
                  <td className="p-3 font-mono">
                    <div className="font-bold text-emerald-800">{apt.appointmentCode}</div>
                    <div className="text-[11px] text-zinc-500">Queue #{apt.queueNumber}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-zinc-900">{apt.patientId?.fullName || 'N/A'}</div>
                    <div className="text-[11px] font-mono text-zinc-500">{apt.patientId?.phone}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-zinc-800">{apt.doctorId?.name || 'Doctor'}</div>
                    <div className="text-[11px] text-zinc-500">{apt.doctorId?.specialization}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{apt.appointmentDate}</div>
                    <div className="text-zinc-600 font-semibold">{apt.timeSlot}</div>
                  </td>
                  <td className="p-3 max-w-xs truncate">{apt.reasonForVisit || 'General Checkup'}</td>
                  <td className="p-3">{getStatusBadge(apt.status)}</td>
                  <td className="p-3 text-right">
                    <select
                      value={apt.status}
                      onChange={(e) => handleStatusChange(apt._id, e.target.value)}
                      className="bg-white border border-zinc-300 rounded px-2 py-1 text-[11px] font-medium text-zinc-700 focus:outline-none"
                    >
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="CHECKED_IN">Check-In Queue</option>
                      <option value="IN_CONSULTATION">In Consultation</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-500">No appointments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white border border-zinc-300 rounded-md w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-3">Book Clinic Appointment</h2>

            <form onSubmit={handleBook} className="space-y-4 text-xs">
              <div>
                <label className="font-medium text-zinc-700 block mb-1">Select Patient *</label>
                <select
                  required
                  value={formData.patientId}
                  onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.fullName} ({p.patientCode} - {p.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-zinc-700 block mb-1">Select Doctor *</label>
                <select
                  required
                  value={formData.doctorId}
                  onChange={e => setFormData({ ...formData, doctorId: e.target.value, timeSlot: '' })}
                  className="w-full p-2 border border-zinc-300 rounded"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-zinc-700 block mb-1">Appointment Date *</label>
                <input
                  type="date"
                  required
                  value={formData.appointmentDate}
                  onChange={e => setFormData({ ...formData, appointmentDate: e.target.value, timeSlot: '' })}
                  className="w-full p-2 border border-zinc-300 rounded"
                />
              </div>

              {/* Slot Picker */}
              {formData.doctorId && (
                <div>
                  <label className="font-medium text-zinc-700 block mb-1">Available Time Slot *</label>
                  {loadingSlots ? (
                    <div className="text-zinc-500 py-2">Loading slots...</div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border border-zinc-200 rounded">
                      {availableSlots.map((slot, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setFormData({ ...formData, timeSlot: slot.time })}
                          className={`p-1.5 rounded text-center font-mono text-[11px] transition-all ${
                            formData.timeSlot === slot.time
                              ? 'bg-emerald-700 text-white font-bold'
                              : slot.isAvailable
                              ? 'bg-zinc-100 hover:bg-emerald-100 text-zinc-800 border border-zinc-300'
                              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed line-through'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-amber-800 bg-amber-50 p-2 rounded text-[11px]">No slots available for doctor on this date.</div>
                  )}
                </div>
              )}

              <div>
                <label className="font-medium text-zinc-700 block mb-1">Reason for Visit</label>
                <input
                  type="text"
                  value={formData.reasonForVisit}
                  onChange={e => setFormData({ ...formData, reasonForVisit: e.target.value })}
                  className="w-full p-2 border border-zinc-300 rounded"
                  placeholder="e.g. Fever, Follow-up consultation"
                />
              </div>

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
                  disabled={!formData.timeSlot}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold disabled:opacity-50"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
