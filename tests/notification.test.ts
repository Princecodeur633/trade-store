import request from "supertest";
import app from "../src/app";

describe("Notification API", () => {
  it("✅ should send a notification", async () => {
    const res = await request(app)
      .post("/api/notifications")
      .send({
        customerId: "cust_1",
        billId: 1,
        providerId: "prov_1",
        type: "payment_confirmation",
        channel: "email",
        message: "Votre paiement a bien été reçu",
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("sent");
  });

  it("✅ should retrieve all notifications", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
