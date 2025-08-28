import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import { Provider } from "./Provider";
import { Customer } from "./Customer";
import { BillBatch } from "./BillBatch";

interface BillAttributes {
  id?: number;
  provider_id: string;
  customer_id: string;
  batch_id?: string;
  bill_reference: string;
  amount: number;
  currency?: string;
  due_date: Date;
  billing_period: string;
  status?: "pending" | "paid" | "overdue" | "cancelled" | "disputed";
}

type BillCreationAttributes = Optional<BillAttributes, "id" | "status" | "currency" | "batch_id">;

export class Bill extends Model<BillAttributes, BillCreationAttributes>
  implements BillAttributes {
  public id?: number;
  public provider_id!: string;
  public customer_id!: string;
  public batch_id?: string;
  public bill_reference!: string;
  public amount!: number;
  public currency?: string;
  public due_date!: Date;
  public billing_period!: string;
  public status?: "pending" | "paid" | "overdue" | "cancelled" | "disputed";
}

Bill.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    provider_id: { type: DataTypes.STRING, allowNull: false },
    customer_id: { type: DataTypes.STRING, allowNull: false },
    batch_id: { type: DataTypes.STRING, allowNull: true },
    bill_reference: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING, defaultValue: "XAF" },
    due_date: { type: DataTypes.DATE, allowNull: false },
    billing_period: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "paid", "overdue", "cancelled", "disputed"),
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    modelName: "Bill",
    tableName: "bills",
    timestamps: true,
  }
);

// Relations
Provider.hasMany(Bill, { foreignKey: "provider_id" });
Bill.belongsTo(Provider, { foreignKey: "provider_id" });

Customer.hasMany(Bill, { foreignKey: "customer_id" });
Bill.belongsTo(Customer, { foreignKey: "customer_id" });

BillBatch.hasMany(Bill, { foreignKey: "batch_id" });
Bill.belongsTo(BillBatch, { foreignKey: "batch_id" });
