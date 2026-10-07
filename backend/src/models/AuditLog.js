const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true }, // e.g. "CREATE_PATIENT", "ISSUE_PRESCRIPTION", "UPDATE_PAYMENT"
  entity: { type: String, required: true }, // e.g. "PATIENT", "APPOINTMENT", "PRESCRIPTION", "INVOICE"
  entityId: { type: String },
  details: { type: String },
  ipAddress: { type: String }
}, { timestamps: true });

auditLogSchema.index({ clinicId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
