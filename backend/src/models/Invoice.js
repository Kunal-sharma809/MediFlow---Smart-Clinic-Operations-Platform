const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  invoiceNumber: { type: String, required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'PARTIAL', 'REFUNDED'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CREDIT_CARD', 'INSURANCE', 'ONLINE_TRANSFER', 'UNPAID'],
    default: 'UNPAID'
  },
  issueDate: { type: String, required: true }, // "YYYY-MM-DD"
  dueDate: { type: String }
}, { timestamps: true });

invoiceSchema.index({ clinicId: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
