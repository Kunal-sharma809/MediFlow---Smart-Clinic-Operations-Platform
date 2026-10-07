import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  FileText,
  CreditCard,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const role = user?.role || 'PATIENT';

  const menuItems = [
    { id: 'dashboard', label: 'Operational Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { id: 'live-queue', label: 'Live Patient Queue', icon: Clock, roles: ['CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { id: 'patients', label: 'Patient Directory (EHR)', icon: Users, roles: ['CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { id: 'appointments', label: 'Appointments & Booking', icon: Calendar, roles: ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
    { id: 'schedules', label: 'Doctor Schedules', icon: Stethoscope, roles: ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR'] },
    { id: 'prescriptions', label: 'Digital Prescriptions', icon: FileText, roles: ['CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
    { id: 'invoices', label: 'Invoices & Billing', icon: CreditCard, roles: ['CLINIC_ADMIN', 'RECEPTIONIST', 'PATIENT'] },
    { id: 'audit-logs', label: 'System Audit Trails', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'CLINIC_ADMIN'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 min-h-[calc(100vh-60px)] p-4 no-print flex flex-col justify-between">
      <nav className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Main Menu
        </div>
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-700' : 'text-zinc-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Role Context Footer Card */}
      <div className="bg-zinc-50 border border-zinc-200 rounded p-3 text-xs">
        <div className="font-semibold text-zinc-700 mb-1">Clinic Access Mode</div>
        <div className="text-[11px] text-zinc-500">
          Viewing system as <strong className="text-emerald-700 uppercase">{role}</strong>. RBAC permissions automatically applied.
        </div>
      </div>
    </aside>
  );
};
