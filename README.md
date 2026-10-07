# MediFlow — Smart Multi-Tenant Clinic Operations Platform

MediFlow is a modern, multi-tenant clinic operations platform designed to streamline administrative workflows, automate patient reminders, manage doctor schedules, record electronic prescriptions, issue itemized invoices, and provide real-time patient queue boards.

---

## 🌟 Key Features

### 🏢 Multi-Tenant Data Isolation
- Complete tenant data separation scoped by `clinicId` and request header `X-Tenant-ID`.
- Multi-clinic support allowing switching between clinic locations seamlessly.

### 🔐 Role-Based Access Control (RBAC)
- **Super Admin**: System-wide clinic management, global audit trails.
- **Clinic Admin**: Staff onboarding, doctor schedules, operational dashboards, billing settings.
- **Doctor**: View daily appointments, manage working hours, issue digital e-prescriptions, view patient EHR records.
- **Receptionist**: Patient intake/registration, appointment booking, queue check-in, billing & payment collection.
- **Patient**: View personal appointments, download digital prescriptions, view billing history.

### ⚡ Real-Time Patient Queue (Socket.IO)
- Interactive 3-column Kanban queue board (*Scheduled Today*, *Waiting Room*, *In Doctor Consultation*).
- Live Socket.IO broadcasts update Receptionist and Doctor desks instantly when statuses change without needing page refreshes.

### 📋 Digital Electronic Prescriptions (EHR)
- Structured prescription builder with multi-medicine rows (dosage, frequency, duration, special instructions).
- Printable clinic letterhead formatted for export and physical printout.

### 💳 Itemized Billing & Invoices
- Generate detailed invoices with itemized service charges, tax calculation, and discounts.
- Payment recording (Cash, Card, Insurance, Online Transfer) with printable receipts.

### ⏰ Automated Reminders (BullMQ + Nodemailer)
- Scheduled background appointment reminder emails 24 hours prior to appointment time.
- Follow-up checkup notifications automatically queued via BullMQ.

### 🛡️ System Audit Trails
- Immutable audit log tracking critical actions, user actors, roles, target entities, IP addresses, and exact timestamps.

---

## 🎨 Design & Aesthetic Guidelines

MediFlow strictly follows clean, modern UI principles:
- **Light Theme**: High-contrast, clean light surfaces (`bg-zinc-50`, `bg-white`).
- **No Blue Policy**: Exclusive use of Emerald (`#059669` / `#10b981`), Teal (`#0d9488`), and Slate/Zinc neutral tones.
- **No Gradients**: Clean solid fills across buttons and cards.
- **No Shadows**: Flat UI with crisp 1px borders (`border border-zinc-200`).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons, Axios, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO Server, Mongoose, JWT + Refresh Tokens, Bcrypt
- **Database**: MongoDB (with automatic `mongodb-memory-server` fallback for zero-dependency execution)
- **Queue & Storage**: Redis, BullMQ (with event-driven fallback)
- **Mailer**: Nodemailer (with Ethereal test mailer / console fallback)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Backend Setup
```bash
cd backend
npm install
```

#### Run Database Seed Script
Populate the database with sample clinics, doctors, patients, schedules, and appointments:
```bash
npm run seed
```

#### Start Backend Server
```bash
npm start
# Server runs on http://localhost:8000
```

#### Run Automated Backend API Verification Suite
```bash
npm run test:api
```

### 2. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Dashboard launches on http://127.0.0.1:5173
```

---

## 🔑 Demo Login Credentials

The top bar of the application includes a **1-Click Role Switcher**, or you can log in manually using:

| Role | Email | Password | Clinic Code |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@platform.com` | `admin123` | - |
| **Clinic Admin** | `clinicadmin@apex.com` | `admin123` | `apex` |
| **Doctor** | `dr.sarah@apex.com` | `doctor123` | `apex` |
| **Receptionist** | `receptionist@apex.com` | `reception123` | `apex` |
| **Patient** | `patient@apex.com` | `patient123` | `apex` |

---

## 📁 Repository Structure

```
MediFlow/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Redis, Nodemailer configs & memory fallbacks
│   │   ├── controllers/     # Route request handlers
│   │   ├── middleware/      # Auth JWT, RBAC, Audit logger, Error handler
│   │   ├── models/          # Mongoose schemas (Tenant, User, Patient, Appointment, etc.)
│   │   ├── queues/          # BullMQ reminder queue
│   │   ├── routes/          # Express REST API routes
│   │   └── seed/            # Seed data generator script
│   ├── tests/               # Automated API verification test suite
│   ├── server.js            # Main Express & Socket.IO server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, DemoRoleSwitcher
│   │   ├── context/         # AuthContext, SocketContext
│   │   ├── services/        # Axios API client
│   │   └── views/           # Dashboard, Patients, Appointments, LiveQueue, Rx, Invoices, AuditLogs
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 📜 License

MIT License. Designed and developed for modern clinic operations management.
