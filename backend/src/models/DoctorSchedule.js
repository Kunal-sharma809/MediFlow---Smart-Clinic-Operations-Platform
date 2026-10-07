const mongoose = require('mongoose');

const doctorScheduleSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: { type: String, required: true, default: '09:00' }, // "09:00"
  endTime: { type: String, required: true, default: '17:00' },   // "17:00"
  slotDurationMinutes: { type: Number, default: 20 },
  breakStartTime: { type: String, default: '13:00' },
  breakEndTime: { type: String, default: '14:00' },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

doctorScheduleSchema.index({ clinicId: 1, doctorId: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
