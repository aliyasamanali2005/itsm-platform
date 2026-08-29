
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app";
import Organization from "../src/modules/organization/organization.model";
import { connectDB } from "../src/config/db";

describe("Analytics Module", () => {
  let token: string;
  let organizationId: string;

  // ==========================================
  // TEST SETUP
  // ==========================================

  beforeAll(async () => {
    const timestamp = Date.now();

    // Make sure MongoDB is connected before using models
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Wait until MongoDB connection is actually ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new Error(
              "MongoDB connection timeout during analytics test setup"
            )
          );
        }, 30000);

        mongoose.connection.once("connected", () => {
          clearTimeout(timeout);
          resolve();
        });

        mongoose.connection.once("error", (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    }

    expect(mongoose.connection.readyState).toBe(1);

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
      })
      .timeout(30000);

    console.log(
      "ANALYTICS REGISTER STATUS:",
      registerResponse.status
    );

    console.log(
      "ANALYTICS REGISTER RESPONSE:",
      registerResponse.body
    );

    expect(registerResponse.status).toBeLessThan(300);

    // ========================================
    // LOGIN ADMIN
    // ========================================

    const loginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email,
        password,
      })
      .timeout(30000);

    console.log(
      "ANALYTICS LOGIN STATUS:",
      loginResponse.status
    );

    console.log(
      "ANALYTICS LOGIN RESPONSE:",
      loginResponse.body
    );

    expect(loginResponse.status).toBe(200);

    token =
      loginResponse.body.token ||
      loginResponse.body.data?.token;

    expect(token).toBeDefined();
  }, 60000);

  // ==========================================
  // TEST CLEANUP
  // ==========================================

  afterAll(async () => {
    try {
      if (
        organizationId &&
        mongoose.connection.readyState === 1
      ) {
        await Organization.findByIdAndDelete(
          organizationId
        );
      }
    } catch (error) {
      console.error(
        "Analytics cleanup error:",
        error
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
        )
        .timeout(30000);

      console.log(
        "TECHNICIAN PERFORMANCE STATUS:",
        response.status
      );

      console.log(
        "TECHNICIAN PERFORMANCE RESPONSE:",
        response.body
      );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(
        Array.isArray(response.body.data)
      ).toBe(true);
    },
    40000
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
        )
        .timeout(30000);

      console.log(
        "ASSET HEALTH STATUS:",
        response.status
      );

      console.log(
        "ASSET HEALTH RESPONSE:",
        response.body
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
    },
    40000
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
        )
        .timeout(30000);

      console.log(
        "CHANGE SUCCESS RATE STATUS:",
        response.status
      );

      console.log(
        "CHANGE SUCCESS RATE RESPONSE:",
        response.body
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
    },
    40000
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
        )
        .timeout(30000);

      expect(response.status).toBe(401);
    },
    40000
  );
});
