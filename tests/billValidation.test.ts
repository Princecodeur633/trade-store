import request from "supertest";
import app from "../src/app";
import { sequelize } from "../src/config/db";

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Préparer un provider + customer + batch valides
  await request(app).post("/api/providers").send({
    id: "prov1",
    company_name: "Valid Provider",
    business_category: "Energy",
    tax_id: "T123456",
    contact_email: "provider@test.com"
  });

  await request(app).post("/api/customers").send({
    id: "cust1",
    provider_id: "prov1",
    name: "Valid Customer",
    email: "customer@test.com"
  });

  await request(app).post("/api/bill-batches").send({
    id: "batch1",
    provider_id: "prov1",
    batch_name: "Test Batch",
    file_hash: "hash123"
  });
});

describe("Bill Validation", () => {
  it("should reject bill with negative amount", async () => {
    const res = await request(app).post("/api/bills").send({
      provider_id: "prov1",
      customer_id: "cust1",
      batch_id: "batch1",
      bill_reference: "BILL-INVALID",
      amount: -100,
      due_date: "2025-12-31",
      billing_period: "2025-01"
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].message).toContain("Amount must be greater than 0");
  });

  it("should reject bill with invalid due date", async () => {
    const res = await request(app).post("/api/bills").send({
      provider_id: "prov1",
      customer_id: "cust1",
      batch_id: "batch1",
      bill_reference: "BILL-DATE",
      amount: 200,
      due_date: "not-a-date",
      billing_period: "2025-01"
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].message).toContain("Invalid due date");
  });
});
