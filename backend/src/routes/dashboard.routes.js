const express = require('express');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// GET /api/dashboard/stats - Clinic operational metrics & dashboard analytics
router.get('/stats', async (req, res, next) => {
  try {
    const clinicId = req.clinicId;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: 'Clinic context is required.' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Parallel metric queries
    const [
      totalPatients,
      totalDoctors,
      todayAppointments,
      completedToday,
      checkedInQueue,
      invoices,
      recentAuditLogs
    ] = await Promise.all([
      Patient.countDocuments({ clinicId }),
      User.countDocuments({ clinicId, role: 'DOCTOR' }),
      Appointment.countDocuments({ clinicId, appointmentDate: today }),
      Appointment.countDocuments({ clinicId, appointmentDate: today, status: 'COMPLETED' }),
      Appointment.countDocuments({ clinicId, appointmentDate: today, status: { $in: ['CHECKED_IN', 'IN_CONSULTATION'] } }),
      Invoice.find({ clinicId }),
      AuditLog.find({ clinicId }).sort({ createdAt: -1 }).limit(5)
    ]);

    // Calculate revenue stats
    let totalRevenue = 0;
    let pendingPayments = 0;
    invoices.forEach(inv => {
      totalRevenue += inv.paidAmount || 0;
      if (inv.paymentStatus !== 'PAID') {
        pendingPayments += Math.max(0, inv.totalAmount - inv.paidAmount);
      }
    });

    // Appointment Status breakdown for today
    const statusCounts = await Appointment.aggregate([
      { $match: { clinicId, appointmentDate: today } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusMap = {
      SCHEDULED: 0,
      CHECKED_IN: 0,
      IN_CONSULTATION: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };
    statusCounts.forEach(s => {
      if (s._id) statusMap[s._id] = s.count;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalPatients,
          totalDoctors,
          todayAppointments,
          completedToday,
          checkedInQueue,
          totalRevenue,
          pendingPayments
        },
        statusMap,
        recentAuditLogs
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
