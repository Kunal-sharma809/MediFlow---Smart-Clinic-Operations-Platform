const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  prescriptionCode: { type: String, required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  diagnosis: { type: String, required: true },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },       // e.g. "500mg"
    frequency: { type: String, required: true },    // e.g. "1-0-1 (After Meals)"
    duration: { type: String, required: true },     // e.g. "7 Days"
    instructions: { type: String }                  // e.g. "Take with warm water"
  }],
  generalInstructions: { type: String },
  followUpDate: { type: String }
}, { timestamps: true });

prescriptionSchema.index({ clinicId: 1, prescriptionCode: 1 }, { unique: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
