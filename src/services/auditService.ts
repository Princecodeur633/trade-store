import AuditLog from "../models/AuditLog";

const auditService = {
  log: async (entityType: string, entityId: string, action: string, userId: string) => {
    return AuditLog.create({
      entityType,
      entityId,
      action,
      userId,
      userType: "system",
    });
  },
};

export default auditService;
