const AuditLog = require('../models/AuditLog');

const logAuditAction = async ({ req, action, entity, entityId, details }) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const userName = req.user ? req.user.name : 'System';
    const userRole = req.user ? req.user.role : 'SYSTEM';
    const clinicId = req.clinicId || (req.user ? req.user.clinicId : null);
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await AuditLog.create({
      clinicId,
      userId,
      userName,
      userRole,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress
    });
  } catch (err) {
    console.error('[AuditLogger] Failed to save audit log:', err.message);
  }
};

module.exports = { logAuditAction };
