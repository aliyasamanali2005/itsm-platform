import express from "express";
import cors from "cors";

// ==========================================
// ROUTES
// ==========================================

import authRoutes from "./modules/auth/auth.routes";
import organizationRoutes from "./modules/organization/organization.routes";
import userRoutes from "./modules/auth/user.routes";
import assetRoutes from "./modules/asset/asset.routes";
import incidentRoutes from "./modules/incident/incident.routes";
import slaRoutes from "./modules/sla/sla.routes";
import serviceRequestRoutes from "./modules/service-request/serviceRequest.routes";
import changeRoutes from "./modules/change/change.routes";
import problemRoutes from "./modules/problem/problem.routes";
import rcaRoutes from "./modules/rca/rca.routes";
import departmentRoutes from "./modules/department/department.routes";
import supportTeamRoutes from "./modules/support-team/supportTeam.routes";
import knowledgeBaseRoutes from "./modules/knowledge-base/knowledgeBase.routes";
import serviceCatalogRoutes from "./modules/service-catalog/serviceCatalog.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import notificationRoutes from "./modules/notification/notification.routes";

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/v1/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "ITSM API is running",
  });
});

// ==========================================
// AUTH ROUTES
// ==========================================

app.use("/api/v1/auth", authRoutes);

// ==========================================
// ORGANIZATION ROUTES
// ==========================================

app.use(
  "/api/v1/organizations",
  organizationRoutes
);

// ==========================================
// USER ROUTES
// ==========================================

app.use("/api/v1/users", userRoutes);

// ==========================================
// ASSET ROUTES
// ==========================================

app.use(
  "/api/v1/assets",
  assetRoutes
);

// ==========================================
// INCIDENT ROUTES
// ==========================================

app.use(
  "/api/v1/incidents",
  incidentRoutes
);

// ==========================================
// SLA ROUTES
// ==========================================

app.use(
  "/api/v1/slas",
  slaRoutes
);

// ==========================================
// SERVICE REQUEST ROUTES
// ==========================================

app.use(
  "/api/v1/service-requests",
  serviceRequestRoutes
);

// ==========================================
// CHANGE MANAGEMENT ROUTES
// ==========================================

app.use(
  "/api/v1/changes",
  changeRoutes
);

// ==========================================
// PROBLEM MANAGEMENT ROUTES
// ==========================================

app.use(
  "/api/v1/problems",
  problemRoutes
);

// ==========================================
// ROOT CAUSE ANALYSIS ROUTES
// ==========================================

app.use(
  "/api/v1/rca",
  rcaRoutes
);

// ==========================================
// DEPARTMENT MANAGEMENT ROUTES
// ==========================================

app.use(
  "/api/v1/departments",
  departmentRoutes
);

// ==========================================
// SUPPORT TEAM ROUTES
// ==========================================

app.use(
  "/api/v1/support-teams",
  supportTeamRoutes
);

// ==========================================
// KNOWLEDGE BASE ROUTES
// ==========================================

app.use(
  "/api/v1/knowledge-base",
  knowledgeBaseRoutes
);

// ==========================================
// SERVICE CATALOG ROUTES
// ==========================================

app.use(
  "/api/v1/service-catalog",
  serviceCatalogRoutes
);

// ==========================================
// ANALYTICS ROUTES
// ==========================================

app.use(
  "/api/v1/analytics",
  analyticsRoutes
);

// ==========================================
// NOTIFICATION ROUTES
// ==========================================

app.use(
  "/api/v1/notifications",
  notificationRoutes
);

// ==========================================
// EXPORT
// ==========================================

export default app;