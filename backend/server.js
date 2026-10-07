const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./src/config/db');
const { initRedis } = require('./src/config/redis');
const { initMailer } = require('./src/config/nodemailer');
const errorHandler = require('./src/middleware/errorHandler');

// Import Routes
const authRoutes = require('./src/routes/auth.routes');
const tenantRoutes = require('./src/routes/tenant.routes');
const patientRoutes = require('./src/routes/patient.routes');
const doctorRoutes = require('./src/routes/doctor.routes');
const appointmentRoutes = require('./src/routes/appointment.routes');
const prescriptionRoutes = require('./src/routes/prescription.routes');
const invoiceRoutes = require('./src/routes/invoice.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const auditRoutes = require('./src/routes/audit.routes');

const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

// Socket Connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_clinic', (clinicId) => {
    if (clinicId) {
      socket.join(String(clinicId));
      console.log(`[Socket.IO] Client ${socket.id} joined room for clinic ${clinicId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Multi-Tenant Clinic API',
    timestamp: new Date()
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await initRedis();
  await initMailer();

  server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Multi-Tenant Clinic API Server running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`==================================================\n`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
