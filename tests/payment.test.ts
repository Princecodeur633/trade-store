import request from "supertest";
import app from "../src/app";

describe("Payment API", () => {
  it("✅ should create a new payment", async () => {
    const res = await request(app)
      .post("/api/payments")
      .send({
        id: "pay_test_001",
        billId: 1,
        customerId: "cust_test_1",
        providerId: "prov_test_1",
        amount: 2500,
        currency: "XAF",
        paymentMethod: "mobile_money",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id", "pay_test_001");
    expect(res.body.status).toBe("completed");
  });
});
