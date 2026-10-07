const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  subscriptionTier: { type: String, enum: ['BASIC', 'PRO', 'ENTERPRISE'], default: 'PRO' },
  isActive: { type: Boolean, default: true },
  settings: {
    slotDurationMinutes: { type: Number, default: 15 },
    currency: { type: String, default: 'USD' },
    taxPercentage: { type: Number, default: 8.5 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
