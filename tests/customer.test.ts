import request from "supertest";
import app from "../src/app";
import { sequelize } from "../src/config/db";

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe("Customer API", () => {
  let customerId: string;

  it("should create a customer", async () => {
    const res = await request(app).post("/api/customers").send({
      id: "cust1",
      provider_id: "prov1",
      name: "John Doe",
      email: "john@example.com",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("John Doe");
    customerId = res.body.data.id;
  });

  it("should get all customers", async () => {
    const res = await request(app).get("/api/customers");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should get customer by id", async () => {
    const res = await request(app).get(`/api/customers/${customerId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(customerId);
  });

  it("should update customer", async () => {
    const res = await request(app).put(`/api/customers/${customerId}`).send({
      name: "Jane Doe",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Jane Doe");
  });

  it("should delete customer", async () => {
    const res = await request(app).delete(`/api/customers/${customerId}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Customer deleted");
  });
});
