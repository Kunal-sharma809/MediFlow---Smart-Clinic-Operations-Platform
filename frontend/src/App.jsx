import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DemoRoleSwitcher } from './components/DemoRoleSwitcher';

// Views
import { DashboardView } from './views/DashboardView';
import { PatientsView } from './views/PatientsView';
import { AppointmentsView } from './views/AppointmentsView';
import { LiveQueueView } from './views/LiveQueueView';
import { DoctorSchedulesView } from './views/DoctorSchedulesView';
import { PrescriptionsView } from './views/PrescriptionsView';
import { InvoicesView } from './views/InvoicesView';
import { AuditLogsView } from './views/AuditLogsView';

const MainLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-600 font-medium text-sm">
        Initializing Multi-Tenant Clinic Platform...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900">
      {/* 1-Click Role Switcher */}
      <DemoRoleSwitcher />

      {/* Main Header */}
      <Navbar />

      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic View Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'patients' && <PatientsView />}
          {activeTab === 'appointments' && <AppointmentsView />}
          {activeTab === 'live-queue' && <LiveQueueView />}
          {activeTab === 'schedules' && <DoctorSchedulesView />}
          {activeTab === 'prescriptions' && <PrescriptionsView />}
          {activeTab === 'invoices' && <InvoicesView />}
          {activeTab === 'audit-logs' && <AuditLogsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainLayout />
      </SocketProvider>
    </AuthProvider>
  );
}
