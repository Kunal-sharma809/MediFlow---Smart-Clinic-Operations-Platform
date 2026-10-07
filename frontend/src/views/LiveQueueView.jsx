import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Clock, UserCheck, Stethoscope, CheckCircle, RefreshCw } from 'lucide-react';

export const LiveQueueView = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useSocket();

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments/live-queue');
      if (res.success) {
        setQueue(res.data);
      }
    } catch (err) {
      console.error('Failed to load live queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Socket.IO event listener trigger auto-reload
  useEffect(() => {
    if (lastEvent) {
      console.log('[LiveQueueView] Socket event trigger received, updating queue...');
      fetchQueue();
    }
  }, [lastEvent]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      fetchQueue();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const checkedInList = queue.filter(a => a.status === 'CHECKED_IN');
  const inConsultationList = queue.filter(a => a.status === 'IN_CONSULTATION');
  const scheduledList = queue.filter(a => a.status === 'SCHEDULED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-700" />
            Live Clinic Patient Queue
          </h1>
          <p className="text-xs text-zinc-500">Real-time Socket.IO sync for Receptionist Intake & Doctor Consultation Room.</p>
        </div>
        <button
          onClick={fetchQueue}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 rounded text-xs font-semibold"
        >
          <RefreshCw size={13} /> Refresh Queue
        </button>
      </div>

      {/* 3 Column Queue Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Scheduled Upcoming */}
        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
            <h2 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck size={14} className="text-zinc-500" />
              Scheduled Today ({scheduledList.length})
            </h2>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {scheduledList.length > 0 ? (
              scheduledList.map(apt => (
                <div key={apt._id} className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-2 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-zinc-900">{apt.patientId?.fullName}</span>
                    <span className="font-mono text-emerald-800">Q#{apt.queueNumber}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono">{apt.timeSlot} • Dr. {apt.doctorId?.name}</div>
                  <button
                    onClick={() => updateStatus(apt._id, 'CHECKED_IN')}
                    className="w-full py-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded text-[11px]"
                  >
                    Check In Patient →
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-400 text-xs">No upcoming scheduled patients.</div>
            )}
          </div>
        </div>

        {/* Column 2: Waiting Queue (Checked In) */}
        <div className="bg-white border border-amber-200 rounded-md p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-amber-200 pb-2">
            <h2 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-amber-700" />
              Waiting Room ({checkedInList.length})
            </h2>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {checkedInList.length > 0 ? (
              checkedInList.map(apt => (
                <div key={apt._id} className="p-3 bg-amber-50 border border-amber-200 rounded space-y-2 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-amber-950">{apt.patientId?.fullName}</span>
                    <span className="font-mono text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">Q#{apt.queueNumber}</span>
                  </div>
                  <div className="text-[11px] text-amber-900 font-medium">Dr. {apt.doctorId?.name} ({apt.doctorId?.specialization})</div>
                  <button
                    onClick={() => updateStatus(apt._id, 'IN_CONSULTATION')}
                    className="w-full py-1 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded text-[11px]"
                  >
                    Call to Doctor Desk →
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-amber-700/60 text-xs">No patients waiting in queue.</div>
            )}
          </div>
        </div>

        {/* Column 3: In Doctor Consultation */}
        <div className="bg-white border border-teal-200 rounded-md p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-teal-200 pb-2">
            <h2 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope size={14} className="text-teal-700" />
              In Consultation ({inConsultationList.length})
            </h2>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {inConsultationList.length > 0 ? (
              inConsultationList.map(apt => (
                <div key={apt._id} className="p-3 bg-teal-50 border border-teal-200 rounded space-y-2 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-teal-950">{apt.patientId?.fullName}</span>
                    <span className="font-mono text-teal-800">Q#{apt.queueNumber}</span>
                  </div>
                  <div className="text-[11px] text-teal-800">Reason: {apt.reasonForVisit || 'Consultation'}</div>
                  <button
                    onClick={() => updateStatus(apt._id, 'COMPLETED')}
                    className="w-full py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-[11px] flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={12} /> Complete Consultation
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-teal-700/60 text-xs">No active consults right now.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
