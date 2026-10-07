import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, Search, Filter } from 'lucide-react';

export const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (entityFilter) params.append('entity', entityFilter);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, entityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          System Audit Trails & Security Logs
        </h1>
        <p className="text-xs text-zinc-500">Immutable audit logs recording user actions, IP addresses, entity changes, and timestamps.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search action, user, or details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-300 rounded text-xs focus:outline-none focus:border-emerald-600"
          />
        </div>

        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
          className="bg-white border border-zinc-300 rounded px-3 py-2 text-xs font-semibold text-zinc-700"
        >
          <option value="">All Target Entities</option>
          <option value="PATIENT">Patient Records</option>
          <option value="APPOINTMENT">Appointments</option>
          <option value="PRESCRIPTION">Prescriptions</option>
          <option value="INVOICE">Invoices</option>
          <option value="USER">User Authentication</option>
          <option value="TENANT">Tenant Configuration</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-100 border-b border-zinc-200 font-semibold text-zinc-700">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">User Actor</th>
              <th className="p-3">Role</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">IP Address</th>
              <th className="p-3">Log Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-800">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-500">Loading audit logs...</td>
              </tr>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-zinc-50">
                  <td className="p-3 font-mono text-zinc-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 font-semibold text-zinc-900">{log.userName}</td>
                  <td className="p-3 font-mono text-[11px] text-zinc-600">{log.userRole}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 border border-zinc-300 font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-emerald-800 font-semibold">{log.entity}</td>
                  <td className="p-3 font-mono text-zinc-500">{log.ipAddress || '127.0.0.1'}</td>
                  <td className="p-3 max-w-xs truncate text-zinc-700">{log.details}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-6 text-center text-zinc-500">No audit log entries matching criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
