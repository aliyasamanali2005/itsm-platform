import request from "supertest";
import app from "../src/app";

describe("Authentication API", () => {
  it("should reject login when credentials are missing", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({});

    expect(response.status).toBe(401);

    expect(response.body).toHaveProperty(
      "success",
      false
    );

    expect(response.body).toHaveProperty(
      "message"
    );
  });
});