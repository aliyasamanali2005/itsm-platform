import request from "supertest";
import app from "../src/app";

describe("Organization API", () => {
  it("should reject unauthenticated requests", async () => {
    const response = await request(app)
      .get("/api/v1/organizations");

    expect(response.status).toBe(401);

    expect(response.body).toHaveProperty(
      "success",
      false
    );
  });

  it("should reject unauthenticated organization creation", async () => {
    const response = await request(app)
      .post("/api/v1/organizations")
      .send({
        name: "Test Organization",
        description: "Test organization",
      });

    expect(response.status).toBe(401);

    expect(response.body).toHaveProperty(
      "success",
      false
    );
  });
});