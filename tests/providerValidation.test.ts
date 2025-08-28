import request from "supertest";
import app from "../src/app";
import { sequelize } from "../src/config/db";

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe("Provider Validation", () => {
  it("should reject provider with invalid email", async () => {
    const res = await request(app).post("/api/providers").send({
      id: "prov_invalid",
      company_name: "Invalid Provider",
      business_category: "IT",
      tax_id: "T12345",
      contact_email: "not-an-email"
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].message).toContain("Invalid email format");
  });

  it("should reject provider with missing required fields", async () => {
    const res = await request(app).post("/api/providers").send({
      company_name: "",
      business_category: "IT"
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
