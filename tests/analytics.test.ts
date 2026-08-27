import request from "supertest";
import app from "../src/app";
import Organization from "../src/modules/organization/organization.model";

describe("Analytics Module", () => {
  let token: string;
  let organizationId: string;

  // ==========================================
  // TEST SETUP
  // ==========================================

  beforeAll(async () => {
    const timestamp = Date.now();

    // ========================================
    // CREATE TEST ORGANIZATION
    // ========================================

    const organization = await Organization.create({
      name: `Analytics Test Organization ${timestamp}`,
      slug: `analytics-test-${timestamp}`,
      description: "Organization used for analytics tests",
    });

    organizationId = organization._id.toString();

    expect(organizationId).toBeDefined();

    // ========================================
    // REGISTER ADMIN
    // ========================================

    const email = `analytics-${timestamp}@test.com`;
    const password = "password123";

    const registerResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Analytics Test Admin",
        email,
        password,
        role: "admin",
        organizationId,
      });

    expect(registerResponse.status).toBeLessThan(300);

    // ========================================
    // LOGIN ADMIN
    // ========================================

    const loginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email,
        password,
      });

    expect(loginResponse.status).toBe(200);

    token =
      loginResponse.body.token ||
      loginResponse.body.data?.token;

    expect(token).toBeDefined();
  }, 20000);

  // ==========================================
  // TEST CLEANUP
  // ==========================================

  afterAll(async () => {
    if (organizationId) {
      await Organization.findByIdAndDelete(
        organizationId
      );
    }
  });

  // ==========================================
  // TECHNICIAN PERFORMANCE
  // ==========================================

  it(
    "should return technician performance analytics",
    async () => {
      const response = await request(app)
        .get(
          "/api/v1/analytics/technician-performance"
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(
        Array.isArray(response.body.data)
      ).toBe(true);
    }
  );

  // ==========================================
  // ASSET HEALTH
  // ==========================================

  it(
    "should return asset health analytics",
    async () => {
      const response = await request(app)
        .get(
          "/api/v1/analytics/asset-health"
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(response.body.data).toHaveProperty(
        "totalAssets"
      );

      expect(response.body.data).toHaveProperty(
        "available"
      );

      expect(response.body.data).toHaveProperty(
        "assigned"
      );

      expect(response.body.data).toHaveProperty(
        "maintenance"
      );

      expect(response.body.data).toHaveProperty(
        "retired"
      );

      expect(response.body.data).toHaveProperty(
        "healthRate"
      );

      expect(response.body.data).toHaveProperty(
        "maintenanceRate"
      );

      expect(response.body.data).toHaveProperty(
        "retiredRate"
      );
    }
  );

  // ==========================================
  // CHANGE SUCCESS RATE
  // ==========================================

  it(
    "should return change success rate analytics",
    async () => {
      const response = await request(app)
        .get(
          "/api/v1/analytics/change-success-rate"
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(response.body.data).toHaveProperty(
        "totalChanges"
      );

      expect(response.body.data).toHaveProperty(
        "completed"
      );

      expect(response.body.data).toHaveProperty(
        "failed"
      );

      expect(response.body.data).toHaveProperty(
        "cancelled"
      );

      expect(response.body.data).toHaveProperty(
        "successfulChanges"
      );

      expect(response.body.data).toHaveProperty(
        "unsuccessfulChanges"
      );

      expect(response.body.data).toHaveProperty(
        "evaluatedChanges"
      );

      expect(response.body.data).toHaveProperty(
        "unevaluatedChanges"
      );

      expect(response.body.data).toHaveProperty(
        "successRate"
      );

      expect(response.body.data).toHaveProperty(
        "failureRate"
      );
    }
  );

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  it(
    "should reject unauthenticated analytics requests",
    async () => {
      const response = await request(app)
        .get(
          "/api/v1/analytics/asset-health"
        );

      expect(response.status).toBe(401);
    }
  );
});