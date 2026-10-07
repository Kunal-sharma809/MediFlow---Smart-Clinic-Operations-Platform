const express = require('express');
const Patient = require('../models/Patient');
const { authenticateToken } = require('../middleware/auth');
const { logAuditAction } = require('../middleware/auditLogger');

const router = express.Router();

router.use(authenticateToken);

// GET /api/patients - Get all patients for active clinic
router.get('/', async (req, res, next) => {
  try {
    const clinicId = req.clinicId;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: 'Clinic context is required.' });
    }

    const { search } = req.query;
    let query = { clinicId };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { patientCode: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: patients });
  } catch (err) {
    next(err);
  }
});

// POST /api/patients - Register new patient
router.post('/', async (req, res, next) => {
  try {
    const clinicId = req.clinicId;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: 'Clinic context is required.' });
    }

    const { fullName, dateOfBirth, gender, phone, email, address, bloodGroup, allergies, chronicConditions, emergencyContact, insurance } = req.body;

    if (!fullName || !dateOfBirth || !gender || !phone) {
      return res.status(400).json({ success: false, message: 'Full name, DOB, gender, and phone are required.' });
    }

    // Auto-generate patient code (e.g. PAT-9482)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const patientCode = `PAT-${randomNum}`;

    const patient = await Patient.create({
      clinicId,
      patientCode,
      fullName,
      dateOfBirth,
      gender,
      phone,
      email: email || `${patientCode.toLowerCase()}@patient.clinic`,
      address,
      bloodGroup,
      allergies: allergies || [],
      chronicConditions: chronicConditions || [],
      emergencyContact,
      insurance
    });

    await logAuditAction({
      req,
      action: 'REGISTER_PATIENT',
      entity: 'PATIENT',
      entityId: patient._id,
      details: `Registered new patient '${fullName}' (${patientCode})`
    });

    res.status(201).json({ success: true, message: 'Patient registered successfully.', data: patient });
  } catch (err) {
    next(err);
  }
});

// GET /api/patients/:id - Patient details
router.get('/:id', async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, clinicId: req.clinicId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    await logAuditAction({
      req,
      action: 'VIEW_PATIENT_RECORD',
      entity: 'PATIENT',
      entityId: patient._id,
      details: `Viewed patient EHR for '${patient.fullName}'`
    });

    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
