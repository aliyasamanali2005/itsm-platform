import dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../src/app";
import SupportTeam from "../src/modules/support-team/supportTeam.model";

jest.setTimeout(30000);

describe("Support Team API", () => {
  const organizationId = "6a856a1ea3cc73b2aa648304";

  let createdTeamId: string | undefined;

  // ==========================================
  // DATABASE SETUP
  // ==========================================

  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGO_URI as string
    );
  });

  afterAll(async () => {
    if (createdTeamId) {
      await SupportTeam.findByIdAndDelete(
        createdTeamId
      );
    }

    await mongoose.disconnect();
  });

  // ==========================================
  // EMPLOYEE TOKEN
  // ==========================================

  const employeeToken = jwt.sign(
    {
      id: "test-employee-id",
      email: "employee@test.com",
      role: "employee",
      organizationId,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1h",
    }
  );

  // ==========================================
  // ADMIN TOKEN
  // ==========================================

  const adminToken = jwt.sign(
    {
      id: "test-admin-id",
      email: "admin@test.com",
      role: "admin",
      organizationId,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1h",
    }
  );

  // ==========================================
  // UNAUTHENTICATED GET ALL
  // ==========================================

  it(
    "should reject unauthenticated requests to get support teams",
    async () => {
      const response = await request(app)
        .get("/api/v1/support-teams");

      expect(response.status).toBe(401);

      expect(response.body).toHaveProperty(
        "success",
        false
      );
    }
  );

  // ==========================================
  // UNAUTHENTICATED CREATE
  // ==========================================

  it(
    "should reject unauthenticated support team creation",
    async () => {
      const response = await request(app)
        .post("/api/v1/support-teams")
        .send({
          name: "Test Support Team",
          description: "Test support team",
        });

      expect(response.status).toBe(401);

      expect(response.body).toHaveProperty(
        "success",
        false
      );
    }
  );

  // ==========================================
  // EMPLOYEE CREATE RBAC
  // ==========================================

  it(
    "should prevent employees from creating support teams",
    async () => {
      const response = await request(app)
        .post("/api/v1/support-teams")
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          name: "Employee Test Support Team",
          description: "Should not be created",
        });

      expect(response.status).toBe(403);

      expect(response.body).toHaveProperty(
        "success",
        false
      );

      expect(response.body.message).toBe(
        "You are not authorized to perform this action"
      );
    }
  );

  // ==========================================
  // ADMIN CREATE
  // ==========================================

  it(
    "should allow an admin to create a support team",
    async () => {
      const response = await request(app)
        .post("/api/v1/support-teams")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          name: `Automated Test Support Team ${Date.now()}`,
          description: "Created by automated test",
        });

      console.log(
        "ADMIN CREATE RESPONSE:",
        response.body
      );

      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(response.body).toHaveProperty(
        "message",
        "Support team created successfully"
      );

      expect(response.body.data).toHaveProperty(
        "name"
      );

      expect(response.body.data).toHaveProperty(
        "organizationId",
        organizationId
      );

      createdTeamId =
        response.body.data._id;
    }
  );

  // ==========================================
  // EMPLOYEE GET ALL
  // ==========================================

  it(
    "should allow employees to get support teams",
    async () => {
      const response = await request(app)
        .get("/api/v1/support-teams")
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(response.body).toHaveProperty(
        "data"
      );
    }
  );

  // ==========================================
  // ADMIN GET ALL
  // ==========================================

  it(
    "should allow admins to get support teams",
    async () => {
      const response = await request(app)
        .get("/api/v1/support-teams")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(response.body).toHaveProperty(
        "data"
      );
    }
  );

  // ==========================================
  // EMPLOYEE GET BY ID
  // ==========================================

  it(
    "should allow employees to get a support team by ID",
    async () => {
      const response = await request(app)
        .get(
          `/api/v1/support-teams/${createdTeamId}`
        )
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(response.body.data).toHaveProperty(
        "_id",
        createdTeamId
      );
    }
  );

  // ==========================================
  // ADMIN GET BY ID
  // ==========================================

  it(
    "should allow admins to get a support team by ID",
    async () => {
      const response = await request(app)
        .get(
          `/api/v1/support-teams/${createdTeamId}`
        )
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(response.body.data).toHaveProperty(
        "_id",
        createdTeamId
      );
    }
  );

  // ==========================================
  // EMPLOYEE UPDATE RBAC
  // ==========================================

  it(
    "should prevent employees from updating support teams",
    async () => {
      const response = await request(app)
        .put(
          `/api/v1/support-teams/${createdTeamId}`
        )
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          description: "Employee should not update this",
        });

      expect(response.status).toBe(403);

      expect(response.body).toHaveProperty(
        "success",
        false
      );

      expect(response.body.message).toBe(
        "You are not authorized to perform this action"
      );
    }
  );

  // ==========================================
  // ADMIN UPDATE
  // ==========================================

  it(
    "should allow an admin to update a support team",
    async () => {
      const response = await request(app)
        .put(
          `/api/v1/support-teams/${createdTeamId}`
        )
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          description: "Updated by automated test",
        });

      console.log(
        "ADMIN UPDATE RESPONSE:",
        response.body
      );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(response.body.data).toHaveProperty(
        "_id",
        createdTeamId
      );

      expect(
        response.body.data.description
      ).toBe("Updated by automated test");
    }
  );

  // ==========================================
  // EMPLOYEE DELETE RBAC
  // ==========================================

  it(
    "should prevent employees from deleting support teams",
    async () => {
      const response = await request(app)
        .delete(
          `/api/v1/support-teams/${createdTeamId}`
        )
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        );

      expect(response.status).toBe(403);

      expect(response.body).toHaveProperty(
        "success",
        false
      );

      expect(response.body.message).toBe(
        "You are not authorized to perform this action"
      );
    }
  );

  // ==========================================
  // ADMIN DELETE
  // ==========================================

  it(
    "should allow an admin to delete a support team",
    async () => {
      const response = await request(app)
        .delete(
          `/api/v1/support-teams/${createdTeamId}`
        )
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      console.log(
        "ADMIN DELETE RESPONSE:",
        response.body
      );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(response.body).toHaveProperty(
        "message",
        "Support team deleted successfully"
      );

      createdTeamId = undefined;
    }
  );
});