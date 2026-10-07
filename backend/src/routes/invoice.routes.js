const express = require('express');
const Invoice = require('../models/Invoice');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { logAuditAction } = require('../middleware/auditLogger');

const router = express.Router();

router.use(authenticateToken);

// GET /api/invoices - List invoices
router.get('/', async (req, res, next) => {
  try {
    const { status, patientId } = req.query;
    let query = { clinicId: req.clinicId };

    if (status) query.paymentStatus = status;
    if (patientId) query.patientId = patientId;

    const invoices = await Invoice.find(query)
      .populate('patientId', 'fullName patientCode phone email')
      .populate('appointmentId', 'appointmentCode appointmentDate')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: invoices });
  } catch (err) {
    next(err);
  }
});

// GET /api/invoices/:id - Single invoice detail for printing
router.get('/:id', async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, clinicId: req.clinicId })
      .populate('patientId')
      .populate('clinicId')
      .populate('appointmentId');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

// POST /api/invoices - Generate invoice
router.post('/', authorizeRoles('RECEPTIONIST', 'CLINIC_ADMIN'), async (req, res, next) => {
  try {
    const { patientId, appointmentId, items, discountAmount, taxAmount } = req.body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient and at least one item line are required.' });
    }

    let subtotal = 0;
    const processedItems = items.map(item => {
      const qty = item.quantity || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const totalPrice = qty * unitPrice;
      subtotal += totalPrice;
      return {
        description: item.description,
        quantity: qty,
        unitPrice,
        totalPrice
      };
    });

    const tax = Number(taxAmount) || 0;
    const discount = Number(discountAmount) || 0;
    const totalAmount = Math.max(0, subtotal + tax - discount);

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const invoiceNumber = `INV-${randomNum}`;
    const today = new Date().toISOString().split('T')[0];

    const invoice = await Invoice.create({
      clinicId: req.clinicId,
      invoiceNumber,
      patientId,
      appointmentId: appointmentId || undefined,
      items: processedItems,
      subtotal,
      taxAmount: tax,
      discountAmount: discount,
      totalAmount,
      paidAmount: 0,
      paymentStatus: 'PENDING',
      paymentMethod: 'UNPAID',
      issueDate: today
    });

    const populated = await Invoice.findById(invoice._id).populate('patientId', 'fullName patientCode');

    await logAuditAction({
      req,
      action: 'GENERATE_INVOICE',
      entity: 'INVOICE',
      entityId: invoice._id,
      details: `Generated invoice ${invoiceNumber} for amount $${totalAmount}`
    });

    res.status(201).json({ success: true, message: 'Invoice generated successfully.', data: populated });
  } catch (err) {
    next(err);
  }
});

// PUT /api/invoices/:id/payment - Collect/Record Payment
router.put('/:id/payment', authorizeRoles('RECEPTIONIST', 'CLINIC_ADMIN'), async (req, res, next) => {
  try {
    const { amountPaid, paymentMethod } = req.body;

    if (amountPaid === undefined || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Amount paid and payment method are required.' });
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, clinicId: req.clinicId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const newPaidTotal = invoice.paidAmount + Number(amountPaid);
    invoice.paidAmount = newPaidTotal;
    invoice.paymentMethod = paymentMethod;

    if (newPaidTotal >= invoice.totalAmount) {
      invoice.paymentStatus = 'PAID';
    } else if (newPaidTotal > 0) {
      invoice.paymentStatus = 'PARTIAL';
    }

    await invoice.save();

    await logAuditAction({
      req,
      action: 'RECORD_PAYMENT',
      entity: 'INVOICE',
      entityId: invoice._id,
      details: `Recorded payment of $${amountPaid} via ${paymentMethod} for invoice ${invoice.invoiceNumber}. New Status: ${invoice.paymentStatus}`
    });

    res.json({ success: true, message: `Payment recorded. Status is now ${invoice.paymentStatus}`, data: invoice });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
