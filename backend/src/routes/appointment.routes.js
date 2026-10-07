const express = require('express');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { logAuditAction } = require('../middleware/auditLogger');
const { scheduleAppointmentReminder } = require('../queues/reminderQueue');

const router = express.Router();

router.use(authenticateToken);

// Helper to get socket.io instance
const getIo = (req) => req.app.get('io');

// GET /api/appointments - List appointments
router.get('/', async (req, res, next) => {
  try {
    const { date, status, doctorId, patientId } = req.query;
    let query = { clinicId: req.clinicId };

    if (date) query.appointmentDate = date;
    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'fullName patientCode phone gender dateOfBirth bloodGroup')
      .populate('doctorId', 'name specialization')
      .sort({ appointmentDate: 1, timeSlot: 1 });

    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
});

// GET /api/appointments/live-queue - Live Queue status for Reception & Doctor Desk
router.get('/live-queue', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { doctorId } = req.query;

    let query = {
      clinicId: req.clinicId,
      appointmentDate: today,
      status: { $in: ['CHECKED_IN', 'IN_CONSULTATION', 'SCHEDULED'] }
    };

    if (doctorId) query.doctorId = doctorId;

    const queue = await Appointment.find(query)
      .populate('patientId', 'fullName patientCode phone gender')
      .populate('doctorId', 'name specialization')
      .sort({ status: -1, queueNumber: 1 });

    res.json({ success: true, data: queue });
  } catch (err) {
    next(err);
  }
});

// POST /api/appointments - Book new appointment
router.post('/', async (req, res, next) => {
  try {
    const { patientId, doctorId, appointmentDate, timeSlot, reasonForVisit, notes, followUpDate } = req.body;

    if (!patientId || !doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Patient, doctor, date, and time slot are required.' });
    }

    // Check slot availability
    const existing = await Appointment.findOne({
      clinicId: req.clinicId,
      doctorId,
      appointmentDate,
      timeSlot,
      status: { $ne: 'CANCELLED' }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: `Time slot ${timeSlot} is already booked for this doctor.` });
    }

    // Assign queue number for that date & doctor
    const todayCount = await Appointment.countDocuments({
      clinicId: req.clinicId,
      doctorId,
      appointmentDate
    });
    const queueNumber = todayCount + 1;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const appointmentCode = `APT-${randomNum}`;

    const appointment = await Appointment.create({
      clinicId: req.clinicId,
      appointmentCode,
      patientId,
      doctorId,
      appointmentDate,
      timeSlot,
      reasonForVisit,
      notes,
      followUpDate,
      queueNumber,
      status: 'SCHEDULED'
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'fullName patientCode phone email')
      .populate('doctorId', 'name specialization');

    // Schedule automated BullMQ reminder email (simulate 5s delay for instant test visibility)
    scheduleAppointmentReminder(populatedAppointment, 'APPOINTMENT_24H', 5000);

    // Emit Socket.IO live update event
    const io = getIo(req);
    if (io) {
      io.to(String(req.clinicId)).emit('queue_updated', {
        type: 'APPOINTMENT_CREATED',
        appointment: populatedAppointment
      });
    }

    await logAuditAction({
      req,
      action: 'BOOK_APPOINTMENT',
      entity: 'APPOINTMENT',
      entityId: appointment._id,
      details: `Booked appointment (${appointmentCode}) for date ${appointmentDate} at ${timeSlot}`
    });

    res.status(201).json({ success: true, message: 'Appointment booked successfully.', data: populatedAppointment });
  } catch (err) {
    next(err);
  }
});

// PUT /api/appointments/:id/status - Update Status (CHECKED_IN, IN_CONSULTATION, COMPLETED, CANCELLED)
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['SCHEDULED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment status.' });
    }

    const appointment = await Appointment.findOne({ _id: req.params.id, clinicId: req.clinicId });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    appointment.status = status;
    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate('patientId', 'fullName patientCode phone email')
      .populate('doctorId', 'name specialization');

    // Emit Socket.IO live update event
    const io = getIo(req);
    if (io) {
      io.to(String(req.clinicId)).emit('queue_updated', {
        type: 'STATUS_CHANGED',
        appointment: updated
      });
    }

    await logAuditAction({
      req,
      action: 'UPDATE_APPOINTMENT_STATUS',
      entity: 'APPOINTMENT',
      entityId: appointment._id,
      details: `Updated appointment status to '${status}'`
    });

    res.json({ success: true, message: `Appointment status updated to ${status}`, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
