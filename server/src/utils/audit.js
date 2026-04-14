const { AuditLog } = require('../models/AuditLog');

async function writeAuditLog({ req, action, targetUserId, metadata }) {
  try {
    await AuditLog.create({
      actorUserId: req?.user?._id,
      action,
      targetUserId,
      metadata,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch {
    // Don't block requests if logging fails.
  }
}

module.exports = { writeAuditLog };
