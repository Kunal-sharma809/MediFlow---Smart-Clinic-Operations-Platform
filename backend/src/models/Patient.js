const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  patientCode: { type: String, required: true },
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  allergies: [{ type: String }],
  chronicConditions: [{ type: String }],
  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String }
  },
  insurance: {
    provider: { type: String },
    policyNumber: { type: String }
  }
}, { timestamps: true });

patientSchema.index({ clinicId: 1, patientCode: 1 }, { unique: true });

module.exports = mongoose.model('Patient', patientSchema);
