import request from "supertest";
import mongoose from "mongoose";

import app from "../src/app";
import { connectDB } from "../src/config/db";

import AuthUser from "../src/modules/auth/auth.model";
import Organization from "../src/modules/organization/organization.model";
import Problem from "../src/modules/problem/problem.model";
import Incident from "../src/modules/incident/incident.model";
import RCA from "../src/modules/rca/rca.model";

jest.setTimeout(30000);

describe("RCA Preventive Actions Integration Tests", () => {
  let adminToken: string;
  let employeeToken: string;

  let organizationId: string;
  let adminId: string;
  let employeeId: string;

  let problemId: string;
  let incidentId: string;
  let rcaId: string;

  beforeAll(async () => {
    console.log("==========================================");
    console.log("RCA PREVENTIVE ACTIONS TEST SETUP");
    console.log("==========================================");

    await connectDB();

    // ==========================================
    // CREATE ORGANIZATION
    // ==========================================

    const organization = await Organization.create({
      name: `RCA Preventive Action Org ${Date.now()}`,
      slug: `rca-preventive-action-org-${Date.now()}`,
      description: "Organization for RCA preventive action tests",
      isActive: true,
    });

    organizationId = organization._id.toString();

    // ==========================================
    // CREATE ADMIN
    // ==========================================

    const adminEmail =
      `rca.preventive.admin.${Date.now()}@example.com`;

    const adminRegister = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "RCA Preventive Admin",
        email: adminEmail,
        password: "Password123!",
        role: "admin",
        organizationId,
      });

    expect(adminRegister.status).toBe(201);
    expect(adminRegister.body.success).toBe(true);

    adminId = adminRegister.body.data.user.id;

    // ==========================================
    // CREATE EMPLOYEE
    // ==========================================

    const employeeEmail =
      `rca.preventive.employee.${Date.now()}@example.com`;

    const employeeRegister = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "RCA Preventive Employee",
        email: employeeEmail,
        password: "Password123!",
        role: "employee",
        organizationId,
      });

    expect(employeeRegister.status).toBe(201);
    expect(employeeRegister.body.success).toBe(true);

    employeeId = employeeRegister.body.data.user.id;

    // ==========================================
    // LOGIN ADMIN
    // ==========================================

    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: adminEmail,
        password: "Password123!",
      });

    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.success).toBe(true);

    adminToken = adminLogin.body.data.token;

    // ==========================================
    // LOGIN EMPLOYEE
    // ==========================================

    const employeeLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: employeeEmail,
        password: "Password123!",
      });

    expect(employeeLogin.status).toBe(200);
    expect(employeeLogin.body.success).toBe(true);

    employeeToken = employeeLogin.body.data.token;

    // ==========================================
    // CREATE PROBLEM
    // ==========================================

    const problem = await Problem.create({
      problemId: `PRB-RCA-PREV-${Date.now()}`,
      title: "Recurring network switch failure",
      description:
        "Network switch repeatedly fails and causes outages",
      priority: "High",
      impact: "High",
      urgency: "High",
      status: "Open",
      reportedBy: adminId,
      organizationId,
    });

    problemId = problem._id.toString();

    // ==========================================
    // CREATE INCIDENT
    // ==========================================

    const incident = await Incident.create({
      incidentId: `INC-RCA-PREV-${Date.now()}`,
      title: "Network outage caused by switch",
      description:
        "Network outage related to faulty switch",
      priority: "High",
      severity: "Major",
      status: "Resolved",
      reportedBy: adminId,
      assignedTo: employeeId,
      organizationId,
      resolution: "Faulty switch identified",
    });

    incidentId = incident._id.toString();

    console.log("Admin:", adminId);
    console.log("Employee:", employeeId);
    console.log("Problem:", problemId);
    console.log("Incident:", incidentId);

    console.log("==========================================");
  });

  // ==========================================
  // CREATE RCA WITH PREVENTIVE ACTIONS
  // ==========================================

  test(
    "should create an RCA with preventive actions",
    async () => {
      const response = await request(app)
        .post("/api/v1/rcas")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          rcaId: `RCA-PREV-${Date.now()}`,
          problem: problemId,
          rootCause:
            "Faulty network switch hardware",
          investigation:
            "Network logs and hardware diagnostics identified the faulty switch",
          contributingFactors: [
            "Old hardware",
            "No proactive hardware replacement",
          ],
          correctiveActions: [
            "Replace the faulty network switch",
            "Verify network configuration",
          ],
          preventiveActions: [
            "Introduce periodic network hardware checks",
            "Create proactive hardware replacement schedule",
          ],
          identifiedBy: adminId,
          relatedIncidents: [incidentId],
          status: "Draft",
        });

      console.log(
        "CREATE RCA RESPONSE:",
        response.body
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(
        response.body.data.preventiveActions
      ).toEqual([
        "Introduce periodic network hardware checks",
        "Create proactive hardware replacement schedule",
      ]);

      rcaId = response.body.data._id;

      expect(rcaId).toBeDefined();
    }
  );

  // ==========================================
  // GET RCA
  // ==========================================

  test(
    "should return preventive actions when retrieving an RCA",
    async () => {
      const response = await request(app)
        .get(`/api/v1/rcas/${rcaId}`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      console.log(
        "GET RCA RESPONSE:",
        response.body
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(
        response.body.data.preventiveActions
      ).toHaveLength(2);

      expect(
        response.body.data.preventiveActions
      ).toContain(
        "Introduce periodic network hardware checks"
      );

      expect(
        response.body.data.preventiveActions
      ).toContain(
        "Create proactive hardware replacement schedule"
      );
    }
  );

  // ==========================================
  // UPDATE PREVENTIVE ACTIONS
  // ==========================================

  test(
    "should update preventive actions",
    async () => {
      const response = await request(app)
        .put(`/api/v1/rcas/${rcaId}`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          preventiveActions: [
            "Introduce periodic network hardware checks",
            "Create proactive hardware replacement schedule",
            "Monitor switch health monthly",
          ],
        });

      console.log(
        "UPDATE PREVENTIVE ACTIONS RESPONSE:",
        response.body
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(
        response.body.data.preventiveActions
      ).toEqual([
        "Introduce periodic network hardware checks",
        "Create proactive hardware replacement schedule",
        "Monitor switch health monthly",
      ]);
    }
  );

  // ==========================================
  // EMPLOYEE UPDATE
  // ==========================================

  test(
    "should allow authenticated employee to update preventive actions",
    async () => {
      const response = await request(app)
        .put(`/api/v1/rcas/${rcaId}`)
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          preventiveActions: [
            "Introduce periodic network hardware checks",
            "Create proactive hardware replacement schedule",
            "Monitor switch health monthly",
            "Review hardware lifecycle quarterly",
          ],
        });

      console.log(
        "EMPLOYEE UPDATE RESPONSE:",
        response.body
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(
        response.body.data.preventiveActions
      ).toHaveLength(4);
    }
  );

  // ==========================================
  // INVALID PREVENTIVE ACTION
  // ==========================================

  test(
    "should handle invalid preventive action values",
    async () => {
      const response = await request(app)
        .put(`/api/v1/rcas/${rcaId}`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          preventiveActions: [""],
        });

      console.log(
        "EMPTY PREVENTIVE ACTION RESPONSE:",
        response.body
      );

      expect([200, 400]).toContain(
        response.status
      );
    }
  );

  // ==========================================
  // UNAUTHENTICATED UPDATE
  // ==========================================

  test(
    "should not allow an unauthenticated user to update preventive actions",
    async () => {
      const response = await request(app)
        .put(`/api/v1/rcas/${rcaId}`)
        .send({
          preventiveActions: [
            "Unauthorized preventive action",
          ],
        });

      expect(response.status).toBe(401);
    }
  );

  // ==========================================
  // COMPLETE RCA
  // ==========================================

  test(
    "should complete the RCA",
    async () => {
      const response = await request(app)
        .put(`/api/v1/rcas/${rcaId}`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          status: "Completed",
          rootCause:
            "Faulty network switch hardware",
          investigation:
            "Hardware diagnostics confirmed the faulty switch",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(
        "Completed"
      );
    }
  );

  // ==========================================
  // APPROVE RCA
  // ==========================================

  test(
    "should approve the RCA",
    async () => {
      const response = await request(app)
        .put(`/api/v1/rcas/${rcaId}`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          status: "Approved",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(
        "Approved"
      );
    }
  );

  // ==========================================
  // APPROVED RCA IMMUTABILITY
  // ==========================================

  test(
    "should prevent preventive action modification after RCA approval",
    async () => {
      const response = await request(app)
        .put(`/api/v1/rcas/${rcaId}`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          preventiveActions: [
            "Attempted modification after approval",
          ],
        });

      console.log(
        "APPROVED RCA UPDATE RESPONSE:",
        response.body
      );

      expect(response.status).toBe(400);

      expect(response.body.message).toBe(
        "Approved RCA cannot be modified"
      );
    }
  );

  // ==========================================
  // PRESERVE PREVENTIVE ACTIONS
  // ==========================================

  test(
    "should preserve preventive actions after approval",
    async () => {
      const response = await request(app)
        .get(`/api/v1/rcas/${rcaId}`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(
        response.body.data.preventiveActions
      ).toEqual([
        "Introduce periodic network hardware checks",
        "Create proactive hardware replacement schedule",
        "Monitor switch health monthly",
        "Review hardware lifecycle quarterly",
      ]);
    }
  );

  // ==========================================
  // CLEANUP
  // ==========================================

  afterAll(async () => {
    console.log(
      "RCA preventive actions test cleanup started."
    );

    if (rcaId) {
      await RCA.deleteOne({
        _id: rcaId,
      });
    }

    if (incidentId) {
      await Incident.deleteOne({
        _id: incidentId,
      });
    }

    if (problemId) {
      await Problem.deleteOne({
        _id: problemId,
      });
    }

    if (employeeId) {
      await AuthUser.deleteOne({
        _id: employeeId,
      });
    }

    if (adminId) {
      await AuthUser.deleteOne({
        _id: adminId,
      });
    }

    if (organizationId) {
      await Organization.deleteOne({
        _id: organizationId,
      });
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    console.log(
      "RCA preventive actions MongoDB connection closed."
    );
  });
});