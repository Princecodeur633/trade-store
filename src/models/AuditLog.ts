import { DataTypes, Model } from "sequelize";
import {sequelize} from "../config/db";

class AuditLog extends Model {}

AuditLog.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  entityType: { type: DataTypes.STRING, allowNull: false },
  entityId: { type: DataTypes.STRING, allowNull: false },
  action: { type: DataTypes.ENUM("create","update","delete","view"), allowNull: false },
  userId: { type: DataTypes.STRING },
  userType: { type: DataTypes.ENUM("admin","customer","provider","system") },
  changes: { type: DataTypes.JSONB },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, modelName: "audit_log" });

export default AuditLog;
