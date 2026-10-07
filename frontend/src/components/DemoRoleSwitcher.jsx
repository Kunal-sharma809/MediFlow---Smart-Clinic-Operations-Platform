import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Building2, Stethoscope, ClipboardList, UserCheck } from 'lucide-react';

export const DemoRoleSwitcher = () => {
  const { user, quickLoginAs } = useAuth();

  const roles = [
    { key: 'SUPER_ADMIN', label: 'Super Admin', icon: Shield, bg: 'bg-zinc-800 text-white' },
    { key: 'CLINIC_ADMIN', label: 'Clinic Admin', icon: Building2, bg: 'bg-emerald-700 text-white' },
    { key: 'DOCTOR', label: 'Dr. Sarah (Doctor)', icon: Stethoscope, bg: 'bg-teal-700 text-white' },
    { key: 'RECEPTIONIST', label: 'Rita (Receptionist)', icon: ClipboardList, bg: 'bg-emerald-600 text-white' },
    { key: 'PATIENT', label: 'John (Patient)', icon: UserCheck, bg: 'bg-zinc-600 text-white' }
  ];

  return (
    <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 no-print">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-zinc-700 uppercase tracking-wider text-[11px]">⚡ 1-Click Role Switcher:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {roles.map(r => {
            const Icon = r.icon;
            const isActive = user && user.role === r.key;
            return (
              <button
                key={r.key}
                onClick={() => quickLoginAs(r.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  isActive
                    ? `${r.bg} ring-2 ring-emerald-500`
                    : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-300'
                }`}
              >
                <Icon size={13} />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {user && (
        <div className="text-zinc-600 font-mono text-[11px]">
          Logged in: <strong className="text-emerald-800">{user.name}</strong> ({user.role})
        </div>
      )}
    </div>
  );
};
