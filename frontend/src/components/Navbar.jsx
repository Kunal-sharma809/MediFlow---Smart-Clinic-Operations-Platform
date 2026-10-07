import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Building2, Wifi, WifiOff, LogOut, Activity } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, activeClinic, allClinics, switchClinic } = useAuth();
  const { connected } = useSocket();

  return (
    <header className="bg-white border-b border-zinc-200 px-6 py-3 flex items-center justify-between no-print">
      {/* Brand & Clinic Switcher */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-xl tracking-tight">
          <Activity className="h-6 w-6 stroke-[2.5]" />
          <span>ApexCare<span className="text-zinc-700 text-sm font-medium ml-1">EHR</span></span>
        </div>

        {/* Tenant Switcher */}
        {allClinics.length > 0 && (
          <div className="flex items-center gap-2 border-l border-zinc-200 pl-4">
            <Building2 className="h-4 w-4 text-zinc-500" />
            <select
              value={activeClinic ? activeClinic._id : ''}
              onChange={(e) => {
                const found = allClinics.find(c => c._id === e.target.value);
                if (found) switchClinic(found);
              }}
              className="bg-zinc-50 text-xs font-semibold text-zinc-800 border border-zinc-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-600"
            >
              {allClinics.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Socket Live Sync Badge & User Actions */}
      <div className="flex items-center gap-4">
        {/* Real-time Socket status indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${
          connected
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : 'bg-amber-50 text-amber-800 border-amber-300'
        }`}>
          {connected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
              <span>Live Sync Active</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-amber-600" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* User profile & Logout */}
        {user ? (
          <div className="flex items-center gap-3 border-l border-zinc-200 pl-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-zinc-800">{user.name}</div>
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wide">{user.role}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-zinc-100 rounded transition-all"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
