import request from "supertest";
import app from "../src/app";
import { sequelize } from "../src/config/db";

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe("BillBatch API", () => {
  let batchId: string;

  it("should create a bill batch", async () => {
    const res = await request(app).post("/api/bill-batches").send({
      id: "batch1",
      provider_id: "prov1",
      batch_name: "January Bills",
      file_hash: "hash123",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.batch_name).toBe("January Bills");
    batchId = res.body.data.id;
  });

  it("should get all bill batches", async () => {
    const res = await request(app).get("/api/bill-batches");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should get bill batch by id", async () => {
    const res = await request(app).get(`/api/bill-batches/${batchId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(batchId);
  });

  it("should update bill batch", async () => {
    const res = await request(app).put(`/api/bill-batches/${batchId}`).send({
      batch_name: "February Bills",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.batch_name).toBe("February Bills");
  });

  it("should delete bill batch", async () => {
    const res = await request(app).delete(`/api/bill-batches/${batchId}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("BillBatch deleted");
  });
});
