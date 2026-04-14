const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

module.exports = {
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
};
