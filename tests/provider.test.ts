import request from "supertest";
import app from "../src/app";
import { sequelize } from "../src/config/db";

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe("Provider API", () => {
  let providerId: string;

  it("should create a provider", async () => {
    const res = await request(app).post("/api/providers").send({
      id: "prov1",
      company_name: "Test Company",
      business_category: "IT",
      tax_id: "TX123",
      contact_email: "test@example.com",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.company_name).toBe("Test Company");
    providerId = res.body.data.id;
  });

  it("should get all providers", async () => {
    const res = await request(app).get("/api/providers");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should get provider by id", async () => {
    const res = await request(app).get(`/api/providers/${providerId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(providerId);
  });

  it("should update provider", async () => {
    const res = await request(app).put(`/api/providers/${providerId}`).send({
      company_name: "Updated Company",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.company_name).toBe("Updated Company");
  });

  it("should delete provider", async () => {
    const res = await request(app).delete(`/api/providers/${providerId}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Provider deleted");
  });
});
