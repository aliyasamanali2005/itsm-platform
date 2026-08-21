import dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import app from "../src/app";
import { connectDB } from "../src/config/db";
import KnowledgeBase from "../src/modules/knowledge-base/knowledgeBase.model";

jest.setTimeout(60000);

describe("Knowledge Base API", () => {
  // ==========================================
  // TEST ORGANIZATION
  // ==========================================

  const organizationId =
    "6a856a1ea3cc73b2aa648304";

  // Different organization for multi-tenant testing
  const otherOrganizationId =
    "6a856a1ea3cc73b2aa648307";

  // ==========================================
  // TEST USERS
  // ==========================================

  const employeeId =
    "6a855db2efe3dd908daacfdb";

  const adminId =
    "6a855a67e2cfd0a0d0752e84";

  let createdArticleId: string | undefined;

  // ==========================================
  // DATABASE SETUP
  // ==========================================

  beforeAll(async () => {
    console.log("=================================");
    console.log("CONNECTING TO MONGODB...");
    console.log("=================================");

    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    console.log("=================================");
    console.log(
      "MONGODB CONNECTION STATE:",
      mongoose.connection.readyState
    );
    console.log("=================================");

    if (mongoose.connection.readyState !== 1) {
      throw new Error(
        "MongoDB connection was not established."
      );
    }
  }, 60000);

  // ==========================================
  // DATABASE CLEANUP
  // ==========================================

  afterAll(async () => {
    if (createdArticleId) {
      console.log(
        "Cleaning up created knowledge base article..."
      );

      await KnowledgeBase.findByIdAndDelete(
        createdArticleId
      );
    }

    if (mongoose.connection.readyState !== 0) {
      console.log(
        "Closing MongoDB connection..."
      );

      await mongoose.connection.close();

      console.log(
        "MongoDB connection closed."
      );
    }
  }, 30000);

  // ==========================================
  // EMPLOYEE TOKEN
  // ==========================================

  const employeeToken = jwt.sign(
    {
      id: employeeId,
      email: "employee.test@example.com",
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
      id: adminId,
      email: "aliya.admin@example.com",
      role: "admin",
      organizationId,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1h",
    }
  );

  // ==========================================
  // OTHER ORGANIZATION ADMIN TOKEN
  // ==========================================

  const otherOrganizationAdminToken = jwt.sign(
    {
      id: new mongoose.Types.ObjectId().toString(),
      email: "other.admin@example.com",
      role: "admin",
      organizationId: otherOrganizationId,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1h",
    }
  );

  // ==========================================
  // UNAUTHENTICATED GET
  // ==========================================

  it(
    "should reject unauthenticated requests to get knowledge base articles",
    async () => {
      const response = await request(app).get(
        "/api/v1/knowledge-base"
      );

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
    "should reject unauthenticated knowledge base creation",
    async () => {
      const response = await request(app)
        .post("/api/v1/knowledge-base")
        .send({
          title: "Test Knowledge Article",
          content:
            "Test knowledge base content",
        });

      expect(response.status).toBe(401);

      expect(response.body).toHaveProperty(
        "success",
        false
      );
    }
  );

  // ==========================================
  // EMPLOYEE CREATE - RBAC
  // ==========================================

  it(
    "should prevent employees from creating knowledge base articles",
    async () => {
      const response = await request(app)
        .post("/api/v1/knowledge-base")
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          title: "Employee Test Article",
          content:
            "Should not be created",
        });

      expect(response.status).toBe(403);

      expect(response.body).toHaveProperty(
        "success",
        false
      );
    }
  );

  // ==========================================
  // ADMIN CREATE
  // ==========================================

  it(
    "should allow an admin to create a knowledge base article",
    async () => {
      const response = await request(app)
        .post("/api/v1/knowledge-base")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          title: `Automated Test Article ${Date.now()}`,
          content:
            "Created by automated test",
          category: "Technical",
          isPublished: true,
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
        "Knowledge base article created successfully"
      );

      expect(response.body.data).toBeDefined();

      expect(response.body.data.title).toBeDefined();

      expect(response.body.data.content).toBe(
        "Created by automated test"
      );

      expect(
        response.body.data.organizationId
      ).toBe(organizationId);

      expect(
        response.body.data.isPublished
      ).toBe(true);

      expect(
        response.body.data._id
      ).toBeDefined();

      createdArticleId =
        response.body.data._id;
    }
  );

  // ==========================================
  // CREATE - MISSING TITLE
  // ==========================================

  it(
    "should reject knowledge base creation without a title",
    async () => {
      const response = await request(app)
        .post("/api/v1/knowledge-base")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          content:
            "Article without a title",
        });

      expect(response.status).toBe(400);

      expect(response.body).toHaveProperty(
        "success",
        false
      );

      expect(response.body.message).toBe(
        "Title and content are required"
      );
    }
  );

  // ==========================================
  // CREATE - MISSING CONTENT
  // ==========================================

  it(
    "should reject knowledge base creation without content",
    async () => {
      const response = await request(app)
        .post("/api/v1/knowledge-base")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          title:
            "Article without content",
        });

      expect(response.status).toBe(400);

      expect(response.body).toHaveProperty(
        "success",
        false
      );

      expect(response.body.message).toBe(
        "Title and content are required"
      );
    }
  );

  // ==========================================
  // EMPLOYEE GET ALL
  // ==========================================

  it(
    "should allow employees to get knowledge base articles",
    async () => {
      const response = await request(app)
        .get("/api/v1/knowledge-base")
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(
        Array.isArray(response.body.data)
      ).toBe(true);

      expect(
        response.body.data.length
      ).toBeGreaterThan(0);
    }
  );

  // ==========================================
  // ADMIN GET ALL
  // ==========================================

  it(
    "should allow admins to get knowledge base articles",
    async () => {
      const response = await request(app)
        .get("/api/v1/knowledge-base")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(
        Array.isArray(response.body.data)
      ).toBe(true);

      expect(
        response.body.data.length
      ).toBeGreaterThan(0);
    }
  );

  // ==========================================
  // EMPLOYEE GET BY ID
  // ==========================================

  it(
    "should allow employees to get a knowledge base article by ID",
    async () => {
      expect(createdArticleId).toBeDefined();

      const response = await request(app)
        .get(
          `/api/v1/knowledge-base/${createdArticleId}`
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

      expect(response.body.data).toBeDefined();

      expect(response.body.data._id).toBe(
        createdArticleId
      );
    }
  );

  // ==========================================
  // ADMIN GET BY ID
  // ==========================================

  it(
    "should allow admins to get a knowledge base article by ID",
    async () => {
      expect(createdArticleId).toBeDefined();

      const response = await request(app)
        .get(
          `/api/v1/knowledge-base/${createdArticleId}`
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

      expect(response.body.data._id).toBe(
        createdArticleId
      );
    }
  );

  // ==========================================
  // INVALID ARTICLE ID
  // ==========================================

  it(
    "should return 404 for an invalid knowledge base article ID",
    async () => {
      const response = await request(app)
        .get(
          "/api/v1/knowledge-base/invalid-id"
        )
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        );

      expect(response.status).toBe(404);

      expect(response.body).toHaveProperty(
        "success",
        false
      );

      expect(response.body.message).toBe(
        "Knowledge base article not found"
      );
    }
  );

  // ==========================================
  // NONEXISTENT ARTICLE
  // ==========================================

  it(
    "should return 404 for a nonexistent knowledge base article",
    async () => {
      const nonexistentId =
        new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .get(
          `/api/v1/knowledge-base/${nonexistentId}`
        )
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        );

      expect(response.status).toBe(404);

      expect(response.body).toHaveProperty(
        "success",
        false
      );

      expect(response.body.message).toBe(
        "Knowledge base article not found"
      );
    }
  );

  // ==========================================
  // MULTI-TENANT ISOLATION - GET BY ID
  // ==========================================

  it(
    "should prevent another organization from accessing the article",
    async () => {
      expect(createdArticleId).toBeDefined();

      const response = await request(app)
        .get(
          `/api/v1/knowledge-base/${createdArticleId}`
        )
        .set(
          "Authorization",
          `Bearer ${otherOrganizationAdminToken}`
        );

      expect(response.status).toBe(404);

      expect(response.body).toHaveProperty(
        "success",
        false
      );
    }
  );

  // ==========================================
  // EMPLOYEE UPDATE - RBAC
  // ==========================================

  it(
    "should prevent employees from updating knowledge base articles",
    async () => {
      expect(createdArticleId).toBeDefined();

      const response = await request(app)
        .put(
          `/api/v1/knowledge-base/${createdArticleId}`
        )
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          content:
            "Employee should not update this",
        });

      expect(response.status).toBe(403);

      expect(response.body).toHaveProperty(
        "success",
        false
      );
    }
  );

  // ==========================================
  // ADMIN UPDATE
  // ==========================================

  it(
    "should allow an admin to update a knowledge base article",
    async () => {
      expect(createdArticleId).toBeDefined();

      const response = await request(app)
        .put(
          `/api/v1/knowledge-base/${createdArticleId}`
        )
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          content:
            "Updated by automated test",
          isPublished: false,
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

      expect(response.body).toHaveProperty(
        "message",
        "Knowledge base article updated successfully"
      );

      expect(
        response.body.data.content
      ).toBe(
        "Updated by automated test"
      );

      expect(
        response.body.data.isPublished
      ).toBe(false);
    }
  );

  // ==========================================
  // MULTI-TENANT ISOLATION - UPDATE
  // ==========================================

  it(
    "should prevent another organization from updating the article",
    async () => {
      expect(createdArticleId).toBeDefined();

      const response = await request(app)
        .put(
          `/api/v1/knowledge-base/${createdArticleId}`
        )
        .set(
          "Authorization",
          `Bearer ${otherOrganizationAdminToken}`
        )
        .send({
          content:
            "Other organization attempted update",
        });

      expect(response.status).toBe(404);

      expect(response.body).toHaveProperty(
        "success",
        false
      );
    }
  );

  // ==========================================
  // EMPLOYEE DELETE - RBAC
  // ==========================================

  it(
    "should prevent employees from deleting knowledge base articles",
    async () => {
      expect(createdArticleId).toBeDefined();

      const response = await request(app)
        .delete(
          `/api/v1/knowledge-base/${createdArticleId}`
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
    }
  );

  // ==========================================
  // MULTI-TENANT ISOLATION - DELETE
  // ==========================================

  it(
    "should prevent another organization from deleting the article",
    async () => {
      expect(createdArticleId).toBeDefined();

      const response = await request(app)
        .delete(
          `/api/v1/knowledge-base/${createdArticleId}`
        )
        .set(
          "Authorization",
          `Bearer ${otherOrganizationAdminToken}`
        );

      expect(response.status).toBe(404);

      expect(response.body).toHaveProperty(
        "success",
        false
      );
    }
  );

  // ==========================================
  // ADMIN DELETE
  // ==========================================

  it(
    "should allow an admin to delete a knowledge base article",
    async () => {
      expect(createdArticleId).toBeDefined();

      const response = await request(app)
        .delete(
          `/api/v1/knowledge-base/${createdArticleId}`
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
        "Knowledge base article deleted successfully"
      );

      expect(response.body.data).toBeDefined();

      createdArticleId = undefined;
    }
  );
});