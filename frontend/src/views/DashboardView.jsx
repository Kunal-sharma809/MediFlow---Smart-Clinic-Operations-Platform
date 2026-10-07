import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Stethoscope, Calendar, Clock, DollarSign, AlertCircle, ShieldCheck } from 'lucide-react';

export const DashboardView = ({ setActiveTab }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 font-medium text-sm">Loading clinic dashboard analytics...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-sm">
        Failed to load dashboard metrics: {error}
      </div>
    );
  }

  const { summary, statusMap, recentAuditLogs } = stats;

  const statCards = [
    { label: 'Total Registered Patients', value: summary.totalPatients, icon: Users, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: 'Active Doctors', value: summary.totalDoctors, icon: Stethoscope, color: 'text-teal-700 bg-teal-50 border-teal-200' },
    { label: "Today's Appointments", value: summary.todayAppointments, icon: Calendar, color: 'text-zinc-700 bg-zinc-100 border-zinc-200' },
    { label: 'Queue (Checked In)', value: summary.checkedInQueue, icon: Clock, color: 'text-amber-800 bg-amber-50 border-amber-200' },
    { label: 'Revenue Collected', value: `$${summary.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-800 bg-emerald-100 border-emerald-300' },
    { label: 'Pending Receivables', value: `$${summary.pendingPayments.toFixed(2)}`, icon: AlertCircle, color: 'text-rose-800 bg-rose-50 border-rose-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Clinic Operational Dashboard</h1>
          <p className="text-xs text-zinc-500">Real-time metrics, appointment throughput, and billing summary.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('appointments')}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold"
          >
            + Book Appointment
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className="px-3 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-800 rounded text-xs font-semibold"
          >
            + Register Patient
          </button>
        </div>
      </div>

      {/* Stat Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`p-4 rounded-md border flex items-center justify-between ${card.color}`}>
              <div>
                <div className="text-xs font-medium opacity-80">{card.label}</div>
                <div className="text-2xl font-bold mt-1 tracking-tight">{card.value}</div>
              </div>
              <Icon className="h-8 w-8 opacity-70 stroke-[1.5]" />
            </div>
          );
        })}
      </div>

      {/* Today's Queue Breakdown & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 rounded-md p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">Today's Appointment Queue</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-zinc-50 border border-zinc-200 rounded">
              <span className="font-medium text-zinc-600">Checked In (Waiting)</span>
              <span className="font-bold text-amber-700">{statusMap.CHECKED_IN || 0}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-teal-50 border border-teal-200 rounded">
              <span className="font-medium text-teal-800">In Consultation</span>
              <span className="font-bold text-teal-900">{statusMap.IN_CONSULTATION || 0}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-emerald-50 border border-emerald-200 rounded">
              <span className="font-medium text-emerald-800">Completed</span>
              <span className="font-bold text-emerald-900">{statusMap.COMPLETED || 0}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-zinc-50 border border-zinc-200 rounded">
              <span className="font-medium text-zinc-600">Scheduled (Upcoming)</span>
              <span className="font-bold text-zinc-800">{statusMap.SCHEDULED || 0}</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('live-queue')}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-semibold rounded text-center"
          >
            Open Live Queue Board →
          </button>
        </div>

        {/* Audit Trail Summary */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              Recent Audit Log Activity
            </h2>
            <button
              onClick={() => setActiveTab('audit-logs')}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              View All Logs
            </button>
          </div>

          <div className="border border-zinc-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-200 font-semibold text-zinc-700">
                <tr>
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">User</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800">
                {recentAuditLogs.length > 0 ? (
                  recentAuditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-zinc-50">
                      <td className="p-2.5 font-mono text-[11px] text-zinc-500">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2.5 font-medium">{log.userName} ({log.userRole})</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 border border-zinc-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-2.5 truncate max-w-xs">{log.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-zinc-500">No recent audit logs available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
