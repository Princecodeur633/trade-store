import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app";

const SECRET = process.env.JWT_SECRET || "secret";

describe("Auth Middleware", () => {
  it("❌ should deny access without token", async () => {
    const res = await request(app).get("/api/payments");
    expect(res.status).toBe(401);
  });

  it("✅ should allow access with valid token", async () => {
    const token = jwt.sign({ userId: "test_user", role: "admin" }, SECRET, { expiresIn: "1h" });

    const res = await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201, 204]).toContain(res.status); // tolère selon ta route
  });
});
