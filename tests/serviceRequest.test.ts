import "dotenv/config";

import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import app from "../src/app";

import AuthUser from "../src/modules/auth/auth.model";
import Organization from "../src/modules/organization/organization.model";
import ServiceRequest from "../src/modules/service-request/serviceRequest.model";

// ==========================================
// JEST CONFIG
// ==========================================

jest.setTimeout(30000);

describe("Service Request Management API", () => {
  // ==========================================
  // TEST VARIABLES
  // ==========================================

  let organizationId: string;

  let adminToken: string;
  let employeeToken: string;
  let secondEmployeeToken: string;

  let adminId: string;
  let employeeId: string;
  let secondEmployeeId: string;

  let serviceRequestId: string;
  let requestId: string;

  // ==========================================
  // SETUP
  // ==========================================

  beforeAll(async () => {
    console.log("Connecting test database...");

    // ------------------------------------------
    // CONNECT TO MONGODB
    // ------------------------------------------

    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGO_URI is not defined in the environment variables."
      );
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    console.log("Test database connected.");

    // ------------------------------------------
    // CREATE ORGANIZATION
    // ------------------------------------------

    const timestamp = Date.now();

    const organization = await Organization.create({
      name: `Service Request Test Organization ${timestamp}`,
      slug: `service-request-test-${timestamp}`,
      description: "Organization for service request tests",
    });

    organizationId = organization._id.toString();

    console.log(
      "Test organization created:",
      organizationId
    );

    // ------------------------------------------
    // CREATE PASSWORD HASH
    // ------------------------------------------

    const password = await bcrypt.hash(
      "TestPassword123",
      10
    );

    // ------------------------------------------
    // CREATE ADMIN
    // ------------------------------------------

    const admin = await AuthUser.create({
      name: "Service Request Admin",
      email: `service.admin.${timestamp}@example.com`,
      password,
      role: "admin",
      organizationId,
      isActive: true,
    });

    adminId = admin._id.toString();

    // ------------------------------------------
    // CREATE EMPLOYEE
    // ------------------------------------------

    const employee = await AuthUser.create({
      name: "Service Request Employee",
      email: `service.employee.${timestamp}@example.com`,
      password,
      role: "employee",
      organizationId,
      isActive: true,
    });

    employeeId = employee._id.toString();

    // ------------------------------------------
    // CREATE SECOND EMPLOYEE
    // ------------------------------------------

    const secondEmployee = await AuthUser.create({
      name: "Second Service Employee",
      email: `service.employee2.${timestamp}@example.com`,
      password,
      role: "employee",
      organizationId,
      isActive: true,
    });

    secondEmployeeId = secondEmployee._id.toString();

    // ==========================================
    // LOGIN ADMIN
    // ==========================================

    console.log("Logging in admin...");

    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: admin.email,
        password: "TestPassword123",
      });

    console.log(
      "Admin login status:",
      adminLogin.status
    );

    console.log(
      "Admin login response:",
      adminLogin.body
    );

    expect(adminLogin.status).toBe(200);

    // Token is returned inside data.token
    expect(adminLogin.body).toHaveProperty(
      "data.token"
    );

    adminToken = adminLogin.body.data.token;

    expect(adminToken).toBeTruthy();

    // ==========================================
    // LOGIN EMPLOYEE
    // ==========================================

    console.log("Logging in employee...");

    const employeeLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: employee.email,
        password: "TestPassword123",
      });

    console.log(
      "Employee login status:",
      employeeLogin.status
    );

    console.log(
      "Employee login response:",
      employeeLogin.body
    );

    expect(employeeLogin.status).toBe(200);

    // Token is returned inside data.token
    expect(employeeLogin.body).toHaveProperty(
      "data.token"
    );

    employeeToken = employeeLogin.body.data.token;

    expect(employeeToken).toBeTruthy();

    // ==========================================
    // LOGIN SECOND EMPLOYEE
    // ==========================================

    console.log(
      "Logging in second employee..."
    );

    const secondEmployeeLogin =
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: secondEmployee.email,
          password: "TestPassword123",
        });

    console.log(
      "Second employee login status:",
      secondEmployeeLogin.status
    );

    console.log(
      "Second employee login response:",
      secondEmployeeLogin.body
    );

    expect(
      secondEmployeeLogin.status
    ).toBe(200);

    // Token is returned inside data.token
    expect(
      secondEmployeeLogin.body
    ).toHaveProperty("data.token");

    secondEmployeeToken =
      secondEmployeeLogin.body.data.token;

    expect(secondEmployeeToken).toBeTruthy();

    console.log(
      "Service Request test setup complete."
    );
  });

  // ==========================================
  // CLEANUP
  // ==========================================

  afterAll(async () => {
    console.log(
      "Cleaning Service Request test data..."
    );

    try {
      // ----------------------------------------
      // DELETE SERVICE REQUESTS
      // ----------------------------------------

      if (organizationId) {
        await ServiceRequest.deleteMany({
          organizationId,
        });

        // --------------------------------------
        // DELETE USERS
        // --------------------------------------

        await AuthUser.deleteMany({
          organizationId,
        });

        // --------------------------------------
        // DELETE ORGANIZATION
        // --------------------------------------

        await Organization.deleteOne({
          _id: organizationId,
        });
      }

      console.log(
        "Service Request test cleanup complete."
      );
    } finally {
      // ----------------------------------------
      // CLOSE MONGODB CONNECTION
      // ----------------------------------------

      if (
        mongoose.connection.readyState !== 0
      ) {
        await mongoose.connection.close();
      }

      console.log(
        "Test database connection closed."
      );
    }
  });

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  it(
    "should reject unauthenticated service request creation",
    async () => {
      const response = await request(app)
        .post("/api/v1/service-requests")
        .send({
          requestId: `SR-UNAUTH-${Date.now()}`,
          title: "Unauthorized Request",
          description:
            "Should not be created",
          type: "VPN Access",
        });

      expect(response.status).toBe(401);

      expect(response.body).toHaveProperty(
        "success",
        false
      );
    }
  );

  // ==========================================
  // CREATE
  // ==========================================

  it(
    "should allow an employee to create a service request",
    async () => {
      requestId = `SR-EMP-${Date.now()}`;

      const response = await request(app)
        .post("/api/v1/service-requests")
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          requestId,
          title: "VPN Access Request",
          description:
            "Employee requires VPN access for remote work.",
          type: "VPN Access",
          priority: "High",
        });

      console.log(
        "CREATE SERVICE REQUEST RESPONSE:",
        response.body
      );

      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(response.body.data).toHaveProperty(
        "requestId",
        requestId
      );

      expect(response.body.data).toHaveProperty(
        "status",
        "Pending"
      );

      expect(
        response.body.data.requestedBy
      ).toBeTruthy();

      expect(
        response.body.data.organizationId
      ).toBe(organizationId);

      serviceRequestId =
        response.body.data._id;

      expect(serviceRequestId).toBeTruthy();
    }
  );

  // ==========================================
  // ADMIN CREATE
  // ==========================================

  it(
    "should allow an admin to create a service request",
    async () => {
      const response = await request(app)
        .post("/api/v1/service-requests")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          requestId: `SR-ADMIN-${Date.now()}`,
          title: "Software Installation",
          description:
            "Install required development software.",
          type: "Software Installation",
          priority: "Medium",
        });

      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(response.body.data).toHaveProperty(
        "status",
        "Pending"
      );
    }
  );

  // ==========================================
  // DUPLICATE REQUEST ID
  // ==========================================

  it(
    "should reject duplicate request IDs within the organization",
    async () => {
      const duplicateId =
        `SR-DUP-${Date.now()}`;

      const first = await request(app)
        .post("/api/v1/service-requests")
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          requestId: duplicateId,
          title: "First Request",
          description: "First request",
          type: "Email Access",
        });

      expect(first.status).toBe(201);

      const second = await request(app)
        .post("/api/v1/service-requests")
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          requestId: duplicateId,
          title: "Duplicate Request",
          description:
            "Duplicate request",
          type: "Email Access",
        });

      expect(second.status).toBe(400);

      expect(second.body).toHaveProperty(
        "success",
        false
      );
    }
  );

  // ==========================================
  // GET ALL
  // ==========================================

  it(
    "should allow employees to get all organization service requests",
    async () => {
      const response = await request(app)
        .get("/api/v1/service-requests")
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

      expect(response.body.data.length).toBeGreaterThan(
        0
      );
    }
  );

  it(
    "should allow admins to get all organization service requests",
    async () => {
      const response = await request(app)
        .get("/api/v1/service-requests")
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
    }
  );

  // ==========================================
  // GET BY ID
  // ==========================================

  it(
    "should allow employees to get a service request by ID",
    async () => {
      const response = await request(app)
        .get(
          `/api/v1/service-requests/${serviceRequestId}`
        )
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        );

      expect(response.status).toBe(200);

      expect(
        response.body.data
      ).toHaveProperty(
        "_id",
        serviceRequestId
      );
    }
  );

  it(
    "should return 404 for a nonexistent service request",
    async () => {
      const fakeId =
        new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .get(
          `/api/v1/service-requests/${fakeId}`
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
    }
  );

  // ==========================================
  // BASIC UPDATE
  // ==========================================

  it(
    "should allow the requester to update basic information",
    async () => {
      const response = await request(app)
        .put(
          `/api/v1/service-requests/${serviceRequestId}`
        )
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          description:
            "Updated VPN access requirements.",
          priority: "Critical",
        });

      console.log(
        "BASIC UPDATE RESPONSE:",
        response.body
      );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(
        response.body.data
      ).toHaveProperty(
        "priority",
        "Critical"
      );

      expect(
        response.body.data
      ).toHaveProperty(
        "description",
        "Updated VPN access requirements."
      );
    }
  );

  // ==========================================
  // EMPLOYEE CANNOT ASSIGN
  // ==========================================

  it(
    "should prevent employees from assigning service requests",
    async () => {
      const response = await request(app)
        .put(
          `/api/v1/service-requests/${serviceRequestId}`
        )
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          assignedTo: secondEmployeeId,
        });

      expect(response.status).toBe(403);

      expect(
        response.body.message
      ).toBe(
        "Employees cannot assign service requests"
      );
    }
  );

  // ==========================================
  // ADMIN ASSIGN
  // ==========================================

  it(
    "should allow an admin to assign a service request to an employee",
    async () => {
      const response = await request(app)
        .put(
          `/api/v1/service-requests/${serviceRequestId}`
        )
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          assignedTo: employeeId,
        });

      console.log(
        "ADMIN ASSIGN RESPONSE:",
        response.body
      );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(
        response.body.data.assignedTo
      ).toBeTruthy();

      expect(
        response.body.data.assignedTo._id
      ).toBe(employeeId);
    }
  );

  // ==========================================
  // EMPLOYEE CANNOT APPROVE
  // ==========================================

  it(
    "should prevent employees from approving service requests",
    async () => {
      const response = await request(app)
        .put(
          `/api/v1/service-requests/${serviceRequestId}`
        )
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          status: "Approved",
        });

      expect(response.status).toBe(403);

      expect(
        response.body.message
      ).toBe(
        "Employees cannot approve service requests"
      );
    }
  );

  // ==========================================
  // ADMIN APPROVAL
  // ==========================================

  it(
    "should allow an admin to approve a service request",
    async () => {
      const response = await request(app)
        .put(
          `/api/v1/service-requests/${serviceRequestId}`
        )
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          status: "Approved",
        });

      console.log(
        "ADMIN APPROVAL RESPONSE:",
        response.body
      );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(
        response.body.data
      ).toHaveProperty(
        "status",
        "Approved"
      );

      expect(
        response.body.data.approvedBy
      ).toBeTruthy();

      expect(
        response.body.data.approvedBy._id
      ).toBe(adminId);

      expect(
        response.body.data.approvedAt
      ).toBeTruthy();
    }
  );

  // ==========================================
  // START REQUEST
  // ==========================================

  it(
    "should allow the assigned employee to move an approved request to In Progress",
    async () => {
      const response = await request(app)
        .put(
          `/api/v1/service-requests/${serviceRequestId}`
        )
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          status: "In Progress",
        });

      console.log(
        "IN PROGRESS RESPONSE:",
        response.body
      );

      expect(response.status).toBe(200);

      expect(
        response.body.data
      ).toHaveProperty(
        "status",
        "In Progress"
      );

      expect(
        response.body.data.assignedTo
      ).toBeTruthy();

      expect(
        response.body.data.assignedTo._id
      ).toBe(employeeId);
    }
  );

  // ==========================================
  // COMPLETE REQUEST
  // ==========================================

  it(
    "should allow the assigned employee to complete the request",
    async () => {
      const response = await request(app)
        .put(
          `/api/v1/service-requests/${serviceRequestId}`
        )
        .set(
          "Authorization",
          `Bearer ${employeeToken}`
        )
        .send({
          status: "Completed",
        });

      console.log(
        "COMPLETED RESPONSE:",
        response.body
      );

      expect(response.status).toBe(200);

      expect(
        response.body.data
      ).toHaveProperty(
        "status",
        "Completed"
      );

      expect(
        response.body.data.completedAt
      ).toBeTruthy();
    }
  );

  // ==========================================
  // DELETE
  // ==========================================

  it(
    "should prevent employees from deleting service requests",
    async () => {
      const response = await request(app)
        .delete(
          `/api/v1/service-requests/${serviceRequestId}`
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

  it(
    "should allow admins to delete service requests",
    async () => {
      const response = await request(app)
        .delete(
          `/api/v1/service-requests/${serviceRequestId}`
        )
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      console.log(
        "DELETE RESPONSE:",
        response.body
      );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty(
        "success",
        true
      );

      expect(response.body.message).toBe(
        "Service request deleted successfully"
      );

      // ----------------------------------------
      // VERIFY DELETION
      // ----------------------------------------

      const verifyDeleted =
        await request(app)
          .get(
            `/api/v1/service-requests/${serviceRequestId}`
          )
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

      expect(
        verifyDeleted.status
      ).toBe(404);

      expect(
        verifyDeleted.body
      ).toHaveProperty(
        "success",
        false
      );
    }
  );
});