const http = require('http');

const PORT = process.env.PORT || 8000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const request = (path, method = 'GET', body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n==================================================');
  console.log('🧪 RUNNING COMPREHENSIVE BACKEND API TEST SUITE');
  console.log('==================================================\n');

  let doctorToken = '';
  let recepToken = '';
  let clinicId = '';
  let patientId = '';
  let doctorId = '';
  let appointmentId = '';

  try {
    // 1. Health Check
    console.log('1. Testing /api/health...');
    const health = await request('/api/health');
    if (health.status !== 200) throw new Error(`Health check failed: ${JSON.stringify(health)}`);
    console.log('   ✅ Health check passed.');

    // 2. Auth - Doctor Login
    console.log('2. Testing Doctor Login (/api/auth/login)...');
    const docLogin = await request('/api/auth/login', 'POST', {
      email: 'dr.sarah@apex.com',
      password: 'doctor123',
      clinicCode: 'apex'
    });
    if (docLogin.status !== 200 || !docLogin.body.data.accessToken) {
      throw new Error(`Doctor login failed: ${JSON.stringify(docLogin)}`);
    }
    doctorToken = docLogin.body.data.accessToken;
    clinicId = docLogin.body.data.user.clinic.id;
    doctorId = docLogin.body.data.user.id;
    console.log('   ✅ Doctor login passed. Token acquired.');

    // 3. Auth - Receptionist Login
    console.log('3. Testing Receptionist Login (/api/auth/login)...');
    const recepLogin = await request('/api/auth/login', 'POST', {
      email: 'receptionist@apex.com',
      password: 'reception123',
      clinicCode: 'apex'
    });
    if (recepLogin.status !== 200 || !recepLogin.body.data.accessToken) {
      throw new Error(`Receptionist login failed: ${JSON.stringify(recepLogin)}`);
    }
    recepToken = recepLogin.body.data.accessToken;
    console.log('   ✅ Receptionist login passed.');

    // 4. Patient Registration
    console.log('4. Testing Patient Registration (/api/patients)...');
    const newPatient = await request('/api/patients', 'POST', {
      fullName: 'Verification Patient',
      dateOfBirth: '1990-05-15',
      gender: 'Female',
      phone: '+1 555-0192',
      email: 'verify.patient@example.com',
      bloodGroup: 'B+'
    }, { Authorization: `Bearer ${recepToken}`, 'X-Tenant-ID': clinicId });

    if (newPatient.status !== 201 || !newPatient.body.data._id) {
      throw new Error(`Patient registration failed: ${JSON.stringify(newPatient)}`);
    }
    patientId = newPatient.body.data._id;
    console.log(`   ✅ Patient registered successfully (ID: ${patientId}).`);

    // 5. Query Doctor Available Slots
    console.log('5. Testing Doctor Available Slots (/api/doctors/:id/available-slots)...');
    const today = new Date().toISOString().split('T')[0];
    const slots = await request(`/api/doctors/${doctorId}/available-slots?date=${today}`, 'GET', null, {
      Authorization: `Bearer ${recepToken}`,
      'X-Tenant-ID': clinicId
    });
    if (slots.status !== 200 || !Array.isArray(slots.body.data)) {
      throw new Error(`Query available slots failed: ${JSON.stringify(slots)}`);
    }
    console.log(`   ✅ Query slots passed. Found ${slots.body.data.length} slot times.`);

    // 6. Book Appointment
    console.log('6. Testing Book Appointment (/api/appointments)...');
    const availableSlot = slots.body.data.find(s => s.isAvailable);
    const timeSlotToBook = availableSlot ? availableSlot.time : '04:40 PM';

    const bookApt = await request('/api/appointments', 'POST', {
      patientId,
      doctorId,
      appointmentDate: today,
      timeSlot: timeSlotToBook,
      reasonForVisit: 'API Verification Checkup'
    }, { Authorization: `Bearer ${recepToken}`, 'X-Tenant-ID': clinicId });

    if (bookApt.status !== 201 || !bookApt.body.data._id) {
      throw new Error(`Appointment booking failed: ${JSON.stringify(bookApt)}`);
    }
    appointmentId = bookApt.body.data._id;
    console.log(`   ✅ Appointment booked successfully (ID: ${appointmentId}, Queue #${bookApt.body.data.queueNumber}).`);

    // 7. Update Status (CHECKED_IN -> IN_CONSULTATION)
    console.log('7. Testing Live Queue Status Update (/api/appointments/:id/status)...');
    const statusUpdate = await request(`/api/appointments/${appointmentId}/status`, 'PUT', {
      status: 'IN_CONSULTATION'
    }, { Authorization: `Bearer ${doctorToken}`, 'X-Tenant-ID': clinicId });

    if (statusUpdate.status !== 200 || statusUpdate.body.data.status !== 'IN_CONSULTATION') {
      throw new Error(`Status update failed: ${JSON.stringify(statusUpdate)}`);
    }
    console.log('   ✅ Live queue status update passed.');

    // 8. Issue Electronic Prescription
    console.log('8. Testing Digital Prescription Creation (/api/prescriptions)...');
    const newRx = await request('/api/prescriptions', 'POST', {
      appointmentId,
      patientId,
      diagnosis: 'Acute Seasonal Allergy',
      medicines: [
        { name: 'Cetirizine 10mg', dosage: '10mg', frequency: '0-0-1 (Night)', duration: '5 Days', instructions: 'Take after food' },
        { name: 'Fluticasone Nasal Spray', dosage: '50mcg', frequency: '1-0-1', duration: '7 Days', instructions: 'Use 2 sprays per nostril' }
      ],
      generalInstructions: 'Avoid allergen exposure.'
    }, { Authorization: `Bearer ${doctorToken}`, 'X-Tenant-ID': clinicId });

    if (newRx.status !== 201 || !newRx.body.data._id) {
      throw new Error(`Prescription creation failed: ${JSON.stringify(newRx)}`);
    }
    console.log(`   ✅ Prescription created (Rx Code: ${newRx.body.data.prescriptionCode}).`);

    // 9. Generate Invoice & Record Payment
    console.log('9. Testing Invoice Billing & Payment Collection (/api/invoices)...');
    const newInvoice = await request('/api/invoices', 'POST', {
      patientId,
      appointmentId,
      items: [
        { description: 'Allergy Consultation Fee', quantity: 1, unitPrice: 100 },
        { description: 'Allergy Panel Testing', quantity: 1, unitPrice: 50 }
      ],
      discountAmount: 10,
      taxAmount: 5
    }, { Authorization: `Bearer ${recepToken}`, 'X-Tenant-ID': clinicId });

    if (newInvoice.status !== 201 || !newInvoice.body.data._id) {
      throw new Error(`Invoice generation failed: ${JSON.stringify(newInvoice)}`);
    }
    const invoiceId = newInvoice.body.data._id;
    const totalAmount = newInvoice.body.data.totalAmount;

    // Record Payment
    const payInvoice = await request(`/api/invoices/${invoiceId}/payment`, 'PUT', {
      amountPaid: totalAmount,
      paymentMethod: 'CASH'
    }, { Authorization: `Bearer ${recepToken}`, 'X-Tenant-ID': clinicId });

    if (payInvoice.status !== 200 || payInvoice.body.data.paymentStatus !== 'PAID') {
      throw new Error(`Payment recording failed: ${JSON.stringify(payInvoice)}`);
    }
    console.log(`   ✅ Invoice generated & full payment of $${totalAmount} recorded.`);

    // 10. Query Dashboard Operational Stats & Audit Logs
    console.log('10. Testing Dashboard Stats & Audit Trail (/api/dashboard/stats & /api/audit-logs)...');
    const stats = await request('/api/dashboard/stats', 'GET', null, {
      Authorization: `Bearer ${recepToken}`,
      'X-Tenant-ID': clinicId
    });
    if (stats.status !== 200 || !stats.body.data.summary) {
      throw new Error(`Dashboard stats failed: ${JSON.stringify(stats)}`);
    }

    // Login as Clinic Admin for Audit Logs test
    const adminLogin = await request('/api/auth/login', 'POST', {
      email: 'clinicadmin@apex.com',
      password: 'admin123',
      clinicCode: 'apex'
    });
    const adminToken = adminLogin.body.data.accessToken;

    const audit = await request('/api/audit-logs', 'GET', null, {
      Authorization: `Bearer ${adminToken}`,
      'X-Tenant-ID': clinicId
    });
    if (audit.status !== 200 || !Array.isArray(audit.body.data)) {
      throw new Error(`Audit log fetch failed: ${JSON.stringify(audit)}`);
    }

    console.log(`   ✅ Dashboard stats & Audit Trail verified. Audit log count: ${audit.body.data.length}`);

    console.log('\n==================================================');
    console.log('🎉 ALL BACKEND API ENDPOINTS TESTED & PASSED 100%!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  }
};

runTests();
