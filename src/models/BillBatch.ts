import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import { Provider } from "./Provider";

interface BillBatchAttributes {
  id: string;
  provider_id: string;
  batch_name: string;
  file_name?: string;
  file_size?: number;
  file_hash: string;
  status?: "pending" | "processed" | "failed" | "completed" | "cancelled";
}

type BillBatchCreationAttributes = Optional<BillBatchAttributes, "id" | "status">;

export class BillBatch extends Model<BillBatchAttributes, BillBatchCreationAttributes>
  implements BillBatchAttributes {
  public id!: string;
  public provider_id!: string;
  public batch_name!: string;
  public file_name?: string;
  public file_size?: number;
  public file_hash!: string;
  public status?: "pending" | "processed" | "failed" | "completed" | "cancelled";
}

BillBatch.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    provider_id: { type: DataTypes.STRING, allowNull: false },
    batch_name: { type: DataTypes.STRING, allowNull: false },
    file_name: DataTypes.STRING,
    file_size: DataTypes.INTEGER,
    file_hash: { type: DataTypes.STRING, unique: true, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "processed", "failed", "completed", "cancelled"),
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    modelName: "BillBatch",
    tableName: "bill_batches",
    timestamps: true,
  }
);

// Relation
Provider.hasMany(BillBatch, { foreignKey: "provider_id" });
BillBatch.belongsTo(Provider, { foreignKey: "provider_id" });
