import { DataTypes, Model } from "sequelize";
import { sequelize }from "../config/db";

class Payment extends Model {}

Payment.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  billId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  providerId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: "XAF",
  },
  paymentMethod: {
    type: DataTypes.ENUM("credit_card","bank_transfer","mobile_money","cash"),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending","completed","failed","refunded"),
    defaultValue: "pending",
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, { sequelize, modelName: "payment" });

export default Payment;
