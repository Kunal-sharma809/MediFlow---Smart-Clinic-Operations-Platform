const express = require('express');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logAuditAction } = require('../middleware/auditLogger');

const router = express.Router();

router.use(authenticateToken);

// GET /api/prescriptions - List prescriptions
router.get('/', async (req, res, next) => {
  try {
    const { patientId, doctorId, appointmentId } = req.query;
    let query = { clinicId: req.clinicId };

    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;
    if (appointmentId) query.appointmentId = appointmentId;

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'fullName patientCode phone dateOfBirth gender bloodGroup')
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'appointmentCode appointmentDate timeSlot')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: prescriptions });
  } catch (err) {
    next(err);
  }
});

// GET /api/prescriptions/:id - Printable view details
router.get('/:id', async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, clinicId: req.clinicId })
      .populate('patientId')
      .populate('doctorId', 'name specialization email phone')
      .populate('clinicId')
      .populate('appointmentId');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }

    res.json({ success: true, data: prescription });
  } catch (err) {
    next(err);
  }
});

// POST /api/prescriptions - Create electronic prescription (Doctors)
router.post('/', authorizeRoles('DOCTOR', 'CLINIC_ADMIN'), async (req, res, next) => {
  try {
    const { appointmentId, patientId, diagnosis, medicines, generalInstructions, followUpDate } = req.body;

    if (!appointmentId || !patientId || !diagnosis || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Appointment, patient, diagnosis, and at least one medicine item are required.'
      });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prescriptionCode = `RX-${randomNum}`;

    const prescription = await Prescription.create({
      clinicId: req.clinicId,
      prescriptionCode,
      appointmentId,
      patientId,
      doctorId: req.user.userId,
      diagnosis,
      medicines,
      generalInstructions,
      followUpDate
    });

    // Mark appointment status as COMPLETED
    await Appointment.findByIdAndUpdate(appointmentId, {
      status: 'COMPLETED',
      followUpDate: followUpDate || undefined
    });

    const populated = await Prescription.findById(prescription._id)
      .populate('patientId', 'fullName patientCode')
      .populate('doctorId', 'name specialization');

    await logAuditAction({
      req,
      action: 'ISSUE_PRESCRIPTION',
      entity: 'PRESCRIPTION',
      entityId: prescription._id,
      details: `Issued digital prescription ${prescriptionCode} for diagnosis '${diagnosis}'`
    });

    res.status(201).json({ success: true, message: 'Prescription issued successfully.', data: populated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
