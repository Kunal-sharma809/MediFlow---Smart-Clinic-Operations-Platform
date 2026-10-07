const express = require('express');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// GET /api/audit-logs
router.get('/', authorizeRoles('SUPER_ADMIN', 'CLINIC_ADMIN'), async (req, res, next) => {
  try {
    const { entity, action, search } = req.query;
    let query = {};

    // Clinic Admins can only see their clinic audit logs; SuperAdmins can see all or filter
    if (req.user.role !== 'SUPER_ADMIN' || req.clinicId) {
      query.clinicId = req.clinicId;
    }

    if (entity) query.entity = entity;
    if (action) query.action = action;
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
