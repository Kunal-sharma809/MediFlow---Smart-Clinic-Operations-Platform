const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  appointmentCode: { type: String, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  appointmentDate: { type: String, required: true }, // "YYYY-MM-DD"
  timeSlot: { type: String, required: true }, // e.g. "10:20 AM"
  status: {
    type: String,
    enum: ['SCHEDULED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'SCHEDULED',
    index: true
  },
  reasonForVisit: { type: String },
  queueNumber: { type: Number },
  notes: { type: String },
  followUpDate: { type: String }, // "YYYY-MM-DD"
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

appointmentSchema.index({ clinicId: 1, appointmentCode: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
