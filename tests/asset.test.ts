import request from "supertest";
import app from "../src/app";

describe("Asset API", () => {
  it("should reject unauthenticated requests when getting assets", async () => {
    const response = await request(app)
      .get("/api/v1/assets");

    expect(response.status).toBe(401);

    expect(response.body).toHaveProperty(
      "success",
      false
    );
  });

  it("should reject unauthenticated asset creation", async () => {
    const response = await request(app)
      .post("/api/v1/assets")
      .send({
        assetId: "TEST-001",
        name: "Test Laptop",
      });

    expect(response.status).toBe(401);

    expect(response.body).toHaveProperty(
      "success",
      false
    );
  });
});