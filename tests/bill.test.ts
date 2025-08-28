import request from "supertest";
import app from "../src/app";
import { sequelize } from "../src/config/db";

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Préparer un provider + customer + batch avant les bills
  await request(app).post("/api/providers").send({
    id: "prov1",
    company_name: "Test Provider",
    business_category: "Energy",
    tax_id: "TX12345",
    contact_email: "prov@test.com",
  });

  await request(app).post("/api/customers").send({
    id: "cust1",
    provider_id: "prov1",
    name: "Client Test",
    email: "client@test.com",
  });

  await request(app).post("/api/bill-batches").send({
    id: "batch1",
    provider_id: "prov1",
    batch_name: "March Bills",
    file_hash: "hash999",
  });
});

describe("Bill API", () => {
  let billId: number;

  it("should create a bill", async () => {
    const res = await request(app).post("/api/bills").send({
      provider_id: "prov1",
      customer_id: "cust1",
      batch_id: "batch1",
      bill_reference: "BILL-001",
      amount: 5000,
      due_date: "2025-12-31",
      billing_period: "2025-03",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.bill_reference).toBe("BILL-001");
    billId = res.body.data.id;
  });

  it("should get all bills", async () => {
    const res = await request(app).get("/api/bills");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should get bill by id", async () => {
    const res = await request(app).get(`/api/bills/${billId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(billId);
  });

  it("should update bill", async () => {
    const res = await request(app).put(`/api/bills/${billId}`).send({
      amount: 6000,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe("6000.00"); // Sequelize retourne DECIMAL en string
  });

  it("should delete bill", async () => {
    const res = await request(app).delete(`/api/bills/${billId}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Bill deleted");
  });
});
