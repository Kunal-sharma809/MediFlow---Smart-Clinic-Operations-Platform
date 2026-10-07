const express = require('express');
const User = require('../models/User');
const DoctorSchedule = require('../models/DoctorSchedule');
const Appointment = require('../models/Appointment');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logAuditAction } = require('../middleware/auditLogger');

const router = express.Router();

router.use(authenticateToken);

// GET /api/doctors - List all doctors in clinic
router.get('/', async (req, res, next) => {
  try {
    const doctors = await User.find({ clinicId: req.clinicId, role: 'DOCTOR' }).select('-password');
    res.json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
});

// GET /api/doctors/schedules - List schedules
router.get('/schedules', async (req, res, next) => {
  try {
    const { doctorId } = req.query;
    let query = { clinicId: req.clinicId };
    if (doctorId) query.doctorId = doctorId;

    const schedules = await DoctorSchedule.find(query).populate('doctorId', 'name specialization');
    res.json({ success: true, data: schedules });
  } catch (err) {
    next(err);
  }
});

// POST /api/doctors/schedules - Configure schedule for doctor
router.post('/schedules', authorizeRoles('CLINIC_ADMIN', 'DOCTOR'), async (req, res, next) => {
  try {
    const { doctorId, dayOfWeek, startTime, endTime, slotDurationMinutes, breakStartTime, breakEndTime, isAvailable } = req.body;

    const targetDoctorId = doctorId || req.user.userId;

    const schedule = await DoctorSchedule.findOneAndUpdate(
      { clinicId: req.clinicId, doctorId: targetDoctorId, dayOfWeek },
      {
        clinicId: req.clinicId,
        doctorId: targetDoctorId,
        dayOfWeek,
        startTime: startTime || '09:00',
        endTime: endTime || '17:00',
        slotDurationMinutes: slotDurationMinutes || 20,
        breakStartTime: breakStartTime || '13:00',
        breakEndTime: breakEndTime || '14:00',
        isAvailable: isAvailable !== undefined ? isAvailable : true
      },
      { upsert: true, new: true }
    );

    await logAuditAction({
      req,
      action: 'UPDATE_DOCTOR_SCHEDULE',
      entity: 'DOCTOR_SCHEDULE',
      entityId: schedule._id,
      details: `Updated schedule for doctor on ${dayOfWeek}`
    });

    res.json({ success: true, message: 'Doctor schedule updated.', data: schedule });
  } catch (err) {
    next(err);
  }
});

// GET /api/doctors/:doctorId/available-slots?date=YYYY-MM-DD
router.get('/:doctorId/available-slots', async (req, res, next) => {
  try {
    const { date } = req.query;
    const { doctorId } = req.params;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter required (YYYY-MM-DD).' });
    }

    const dateObj = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dateObj.getDay()];

    const schedule = await DoctorSchedule.findOne({ clinicId: req.clinicId, doctorId, dayOfWeek: dayName });

    if (!schedule || !schedule.isAvailable) {
      return res.json({ success: true, data: [], message: `Doctor is not available on ${dayName}s.` });
    }

    // Existing booked slots for this doctor on this date
    const bookedAppointments = await Appointment.find({
      clinicId: req.clinicId,
      doctorId,
      appointmentDate: date,
      status: { $ne: 'CANCELLED' }
    });

    const bookedSlots = bookedAppointments.map(a => a.timeSlot);

    // Generate slots
    const slots = [];
    let currentMin = parseTimeToMinutes(schedule.startTime);
    const endMin = parseTimeToMinutes(schedule.endTime);
    const breakStartMin = parseTimeToMinutes(schedule.breakStartTime);
    const breakEndMin = parseTimeToMinutes(schedule.breakEndTime);
    const duration = schedule.slotDurationMinutes || 20;

    while (currentMin + duration <= endMin) {
      // Check if slot falls in break time
      if (currentMin >= breakStartMin && currentMin < breakEndMin) {
        currentMin = breakEndMin;
        continue;
      }

      const slotStr = formatMinutesTo12h(currentMin);
      const isBooked = bookedSlots.includes(slotStr);

      slots.push({
        time: slotStr,
        isAvailable: !isBooked
      });

      currentMin += duration;
    }

    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
});

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutesTo12h(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${period}`;
}

module.exports = router;
