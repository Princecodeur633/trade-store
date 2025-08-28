import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import { Provider } from "./Provider";

interface CustomerAttributes {
  id: string;
  provider_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  meter_number?: string;
  account_number?: string;
  customer_type?: "government" | "business" | "individual";
  status?: "active" | "inactive" | "suspended";
}

type CustomerCreationAttributes = Optional<CustomerAttributes, "id" | "status" | "customer_type">;

export class Customer extends Model<CustomerAttributes, CustomerCreationAttributes>
  implements CustomerAttributes {
  public id!: string;
  public provider_id!: string;
  public name!: string;
  public phone?: string;
  public email?: string;
  public address?: string;
  public meter_number?: string;
  public account_number?: string;
  public customer_type?: "government" | "business" | "individual";
  public status?: "active" | "inactive" | "suspended";
}

Customer.init(
  {
    id: { type: DataTypes.STRING, primaryKey: true },
    provider_id: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    address: DataTypes.TEXT,
    meter_number: { type: DataTypes.STRING, unique: true },
    account_number: { type: DataTypes.STRING, unique: true },
    customer_type: {
      type: DataTypes.ENUM("government", "business", "individual"),
      defaultValue: "individual",
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "suspended"),
      defaultValue: "active",
    },
  },
  {
    sequelize,
    modelName: "Customer",
    tableName: "customers",
    timestamps: true,
  }
);

// Relation
Provider.hasMany(Customer, { foreignKey: "provider_id" });
Customer.belongsTo(Provider, { foreignKey: "provider_id" });
