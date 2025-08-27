import { DataTypes, Model } from "sequelize";
import {sequelize} from "../config/db";

class Notification extends Model {}

Notification.init({
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  customerId: { type: DataTypes.STRING, allowNull: false },
  billId: { type: DataTypes.BIGINT, allowNull: false },
  type: {
    type: DataTypes.ENUM("new_bill","reminder","payment_confirmation","payment_failure"),
    allowNull: false,
  },
  channel: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM("pending","sent","failed","delivered"),
    defaultValue: "pending",
  },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, modelName: "notification" });

export default Notification;
