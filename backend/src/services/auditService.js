const prisma = require("../config/prisma");

const logAuditEvent = async ({ actor, action, entityType, entityId, metadata }) => {
  if (!actor) {
    return null;
  }

  return prisma.auditLog.create({
    data: {
      actorId: actor.id || null,
      actorEmail: actor.email || "unknown",
      actorRole: actor.role || "unknown",
      action,
      entityType,
      entityId: entityId || null,
      metadata,
    },
  });
};

const listAuditLogs = () =>
  prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 250,
  });

module.exports = {
  listAuditLogs,
  logAuditEvent,
};
