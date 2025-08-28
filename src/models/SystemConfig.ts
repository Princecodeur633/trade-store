import { DataTypes, Model } from "sequelize";
import {sequelize} from "../config/db";

class SystemConfig extends Model {}

SystemConfig.init({
  key: { type: DataTypes.STRING, primaryKey: true },
  value: { type: DataTypes.TEXT, allowNull: false },
  dataType: {
    type: DataTypes.ENUM("string","integer","boolean","json","decimal"),
    defaultValue: "string",
  },
  isSensitive: { type: DataTypes.BOOLEAN, defaultValue: false },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, modelName: "system_config" });

export default SystemConfig;
