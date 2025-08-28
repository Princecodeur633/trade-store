import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

interface ProviderAttributes {
  id: string;
  company_name: string;
  business_category: string;
  tax_id: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  status?: "active" | "inactive" | "suspended";
}

type ProviderCreationAttributes = Optional<ProviderAttributes, "id" | "status">;

export class Provider extends Model<ProviderAttributes, ProviderCreationAttributes>
  implements ProviderAttributes {
  public id!: string;
  public company_name!: string;
  public business_category!: string;
  public tax_id!: string;
  public contact_email!: string;
  public contact_phone?: string;
  public address?: string;
  public status?: "active" | "inactive" | "suspended";
}

Provider.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    business_category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tax_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contact_phone: DataTypes.STRING,
    address: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM("active", "inactive", "suspended"),
      defaultValue: "active",
    },
  },
  {
    sequelize,
    modelName: "Provider",
    tableName: "providers",
    timestamps: true,
  }
);
