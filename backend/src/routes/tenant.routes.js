const express = require('express');
const Tenant = require('../models/Tenant');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logAuditAction } = require('../middleware/auditLogger');

const router = express.Router();

// GET /api/tenants - List all clinics (SuperAdmin or public list for demo)
router.get('/', async (req, res, next) => {
  try {
    const tenants = await Tenant.find({ isActive: true }).select('-settings.taxPercentage');
    res.json({ success: true, data: tenants });
  } catch (err) {
    next(err);
  }
});

// POST /api/tenants - Create new Clinic (SuperAdmin)
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { name, code, email, phone, address, settings } = req.body;

    if (!name || !code || !email) {
      return res.status(400).json({ success: false, message: 'Name, code, and email are required.' });
    }

    const existingCode = await Tenant.findOne({ code: code.toLowerCase() });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Clinic code is already taken.' });
    }

    const tenant = await Tenant.create({
      name,
      code: code.toLowerCase(),
      email,
      phone,
      address,
      settings
    });

    await logAuditAction({
      req,
      action: 'CREATE_TENANT',
      entity: 'TENANT',
      entityId: tenant._id,
      details: `Created new clinic tenant '${name}' [${code}]`
    });

    res.status(201).json({ success: true, message: 'Clinic tenant created successfully.', data: tenant });
  } catch (err) {
    next(err);
  }
});

// GET /api/tenants/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Clinic not found.' });
    }
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
