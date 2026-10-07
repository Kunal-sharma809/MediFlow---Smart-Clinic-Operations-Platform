const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false }, // optional for SUPER_ADMIN
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'],
    required: true
  },
  specialization: { type: String }, // For Doctors (e.g. Cardiology, Pediatrics)
  phone: { type: String },
  avatarUrl: { type: String },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String }
}, { timestamps: true });

// Compound index for unique email per clinic
userSchema.index({ email: 1, clinicId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
