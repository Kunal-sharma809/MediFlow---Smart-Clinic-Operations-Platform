const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB, closeDB } = require('../config/db');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Patient = require('../models/Patient');
const DoctorSchedule = require('../models/DoctorSchedule');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      Tenant.deleteMany({}),
      User.deleteMany({}),
      Patient.deleteMany({}),
      DoctorSchedule.deleteMany({}),
      Appointment.deleteMany({}),
      Prescription.deleteMany({}),
      Invoice.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('[Seed] Creating Tenants (Clinics)...');
    const tenantApex = await Tenant.create({
      name: 'Apex Health Clinic',
      code: 'apex',
      email: 'contact@apexhealth.com',
      phone: '+1 (555) 234-5678',
      address: '742 Evergreen Terrace, Medical Suite 100',
      subscriptionTier: 'PRO',
      settings: { slotDurationMinutes: 20, currency: 'USD', taxPercentage: 8.5 }
    });

    const tenantCare = await Tenant.create({
      name: 'CareFirst Medical Center',
      code: 'carefirst',
      email: 'info@carefirstmed.com',
      phone: '+1 (555) 987-6543',
      address: '100 Health Boulevard, Tower B',
      subscriptionTier: 'ENTERPRISE',
      settings: { slotDurationMinutes: 15, currency: 'USD', taxPercentage: 5.0 }
    });

    console.log('[Seed] Creating Users for Apex Health Clinic...');
    const hashedAdminPass = await bcrypt.hash('admin123', 10);
    const hashedDocPass = await bcrypt.hash('doctor123', 10);
    const hashedRecepPass = await bcrypt.hash('reception123', 10);
    const hashedPatientPass = await bcrypt.hash('patient123', 10);

    const superAdmin = await User.create({
      name: 'System Super Admin',
      email: 'admin@platform.com',
      password: hashedAdminPass,
      role: 'SUPER_ADMIN',
      phone: '+1 (555) 000-0000'
    });

    const clinicAdmin = await User.create({
      clinicId: tenantApex._id,
      name: 'Clinic Admin Manager',
      email: 'clinicadmin@apex.com',
      password: hashedAdminPass,
      role: 'CLINIC_ADMIN',
      phone: '+1 (555) 111-2222'
    });

    const drSarah = await User.create({
      clinicId: tenantApex._id,
      name: 'Dr. Sarah Connor',
      email: 'dr.sarah@apex.com',
      password: hashedDocPass,
      role: 'DOCTOR',
      specialization: 'Cardiology',
      phone: '+1 (555) 333-4444'
    });

    const drJames = await User.create({
      clinicId: tenantApex._id,
      name: 'Dr. James Wilson',
      email: 'dr.james@apex.com',
      password: hashedDocPass,
      role: 'DOCTOR',
      specialization: 'General Medicine',
      phone: '+1 (555) 555-6666'
    });

    const receptionist = await User.create({
      clinicId: tenantApex._id,
      name: 'Receptionist Rita',
      email: 'receptionist@apex.com',
      password: hashedRecepPass,
      role: 'RECEPTIONIST',
      phone: '+1 (555) 777-8888'
    });

    const patientUser = await User.create({
      clinicId: tenantApex._id,
      name: 'John Doe',
      email: 'patient@apex.com',
      password: hashedPatientPass,
      role: 'PATIENT',
      phone: '+1 (555) 999-1001'
    });

    console.log('[Seed] Creating Doctor Schedules...');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days) {
      await DoctorSchedule.create({
        clinicId: tenantApex._id,
        doctorId: drSarah._id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 20,
        isAvailable: true
      });

      await DoctorSchedule.create({
        clinicId: tenantApex._id,
        doctorId: drJames._id,
        dayOfWeek: day,
        startTime: '08:30',
        endTime: '16:30',
        slotDurationMinutes: 15,
        isAvailable: true
      });
    }

    console.log('[Seed] Creating Patients...');
    const patient1 = await Patient.create({
      clinicId: tenantApex._id,
      patientCode: 'PAT-1001',
      fullName: 'John Doe',
      dateOfBirth: new Date('1988-04-12'),
      gender: 'Male',
      phone: '+1 (555) 999-1001',
      email: 'patient@apex.com',
      address: '123 Pine Street, Apt 4B',
      bloodGroup: 'O+',
      allergies: ['Penicillin', 'Peanuts'],
      chronicConditions: ['Hypertension'],
      emergencyContact: { name: 'Mary Doe', relationship: 'Spouse', phone: '+1 (555) 999-1002' },
      insurance: { provider: 'BlueCross Health', policyNumber: 'BC-9948271' }
    });

    const patient2 = await Patient.create({
      clinicId: tenantApex._id,
      patientCode: 'PAT-1002',
      fullName: 'Jane Smith',
      dateOfBirth: new Date('1994-08-23'),
      gender: 'Female',
      phone: '+1 (555) 888-2002',
      email: 'janesmith@example.com',
      address: '456 Oak Avenue',
      bloodGroup: 'A+',
      allergies: ['Dust'],
      chronicConditions: ['Asthma'],
      emergencyContact: { name: 'David Smith', relationship: 'Brother', phone: '+1 (555) 888-2003' }
    });

    const patient3 = await Patient.create({
      clinicId: tenantApex._id,
      patientCode: 'PAT-1003',
      fullName: 'Robert Brown',
      dateOfBirth: new Date('1975-11-05'),
      gender: 'Male',
      phone: '+1 (555) 777-3003',
      email: 'rbrown@example.com',
      address: '789 Maple Drive',
      bloodGroup: 'B+',
      allergies: [],
      chronicConditions: ['Type 2 Diabetes']
    });

    console.log('[Seed] Creating Appointments for Today...');
    const todayStr = new Date().toISOString().split('T')[0];

    const apt1 = await Appointment.create({
      clinicId: tenantApex._id,
      appointmentCode: 'APT-8401',
      patientId: patient1._id,
      doctorId: drSarah._id,
      appointmentDate: todayStr,
      timeSlot: '09:00 AM',
      status: 'CHECKED_IN',
      queueNumber: 1,
      reasonForVisit: 'Routine Cardiac Checkup & ECG Review'
    });

    const apt2 = await Appointment.create({
      clinicId: tenantApex._id,
      appointmentCode: 'APT-8402',
      patientId: patient2._id,
      doctorId: drSarah._id,
      appointmentDate: todayStr,
      timeSlot: '09:20 AM',
      status: 'IN_CONSULTATION',
      queueNumber: 2,
      reasonForVisit: 'Shortness of breath & Chest Tightness'
    });

    const apt3 = await Appointment.create({
      clinicId: tenantApex._id,
      appointmentCode: 'APT-8403',
      patientId: patient3._id,
      doctorId: drJames._id,
      appointmentDate: todayStr,
      timeSlot: '10:00 AM',
      status: 'COMPLETED',
      queueNumber: 1,
      reasonForVisit: 'Diabetic Medication Refill'
    });

    console.log('[Seed] Creating Digital Prescriptions...');
    const rx1 = await Prescription.create({
      clinicId: tenantApex._id,
      prescriptionCode: 'RX-5011',
      appointmentId: apt3._id,
      patientId: patient3._id,
      doctorId: drJames._id,
      diagnosis: 'Type 2 Diabetes Mellitus - Controlled',
      medicines: [
        { name: 'Metformin HCl', dosage: '500mg', frequency: '1-0-1 (After Meals)', duration: '30 Days', instructions: 'Take with full glass of water' },
        { name: 'Glimepiride', dosage: '1mg', frequency: '1-0-0 (Before Breakfast)', duration: '30 Days', instructions: 'Monitor blood glucose' }
      ],
      generalInstructions: 'Maintain low glycaemic index diet and 30-min daily walks.',
      followUpDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    });

    console.log('[Seed] Creating Invoices & Billing Records...');
    const inv1 = await Invoice.create({
      clinicId: tenantApex._id,
      invoiceNumber: 'INV-9001',
      appointmentId: apt3._id,
      patientId: patient3._id,
      items: [
        { description: 'General Doctor Consultation Fee', quantity: 1, unitPrice: 85, totalPrice: 85 },
        { description: 'Fasting Blood Sugar Test (FBS)', quantity: 1, unitPrice: 25, totalPrice: 25 }
      ],
      subtotal: 110,
      taxAmount: 8.5,
      discountAmount: 10,
      totalAmount: 108.5,
      paidAmount: 108.5,
      paymentStatus: 'PAID',
      paymentMethod: 'CREDIT_CARD',
      issueDate: todayStr
    });

    const inv2 = await Invoice.create({
      clinicId: tenantApex._id,
      invoiceNumber: 'INV-9002',
      appointmentId: apt1._id,
      patientId: patient1._id,
      items: [
        { description: 'Specialist Cardiology Consultation', quantity: 1, unitPrice: 150, totalPrice: 150 },
        { description: '12-Lead Electrocardiogram (ECG)', quantity: 1, unitPrice: 75, totalPrice: 75 }
      ],
      subtotal: 225,
      taxAmount: 19.1,
      discountAmount: 0,
      totalAmount: 244.1,
      paidAmount: 0,
      paymentStatus: 'PENDING',
      paymentMethod: 'UNPAID',
      issueDate: todayStr
    });

    console.log('[Seed] Creating Audit Logs...');
    await AuditLog.create({
      clinicId: tenantApex._id,
      userId: receptionist._id,
      userName: 'Receptionist Rita',
      userRole: 'RECEPTIONIST',
      action: 'REGISTER_PATIENT',
      entity: 'PATIENT',
      entityId: patient1._id,
      details: 'Registered patient John Doe (PAT-1001)'
    });

    await AuditLog.create({
      clinicId: tenantApex._id,
      userId: drJames._id,
      userName: 'Dr. James Wilson',
      userRole: 'DOCTOR',
      action: 'ISSUE_PRESCRIPTION',
      entity: 'PRESCRIPTION',
      entityId: rx1._id,
      details: 'Issued prescription RX-5011 for Type 2 Diabetes'
    });

    console.log('\n==================================================');
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('==================================================');
    console.log(`Clinic Code: ${tenantApex.code}`);
    console.log('Demo Login Credentials:');
    console.log(`  Super Admin  : admin@platform.com / admin123`);
    console.log(`  Clinic Admin : clinicadmin@apex.com / admin123`);
    console.log(`  Doctor       : dr.sarah@apex.com / doctor123`);
    console.log(`  Receptionist : receptionist@apex.com / reception123`);
    console.log(`  Patient      : patient@apex.com / patient123`);
    console.log('==================================================\n');

  } catch (err) {
    console.error('[Seed] Database seeding failed:', err);
  } finally {
    await closeDB();
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
