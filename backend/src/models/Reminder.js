const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  scheduledFor: { type: Date, required: true },
  reminderType: { type: String, enum: ['APPOINTMENT_24H', 'APPOINTMENT_1H', 'FOLLOW_UP'], default: 'APPOINTMENT_24H' },
  status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
  channel: { type: String, enum: ['EMAIL', 'SMS'], default: 'EMAIL' },
  sentAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
