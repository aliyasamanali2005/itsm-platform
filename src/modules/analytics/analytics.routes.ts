import { Router } from "express";

import {
  getTechnicianPerformanceController,
  getAssetHealthController,
  getChangeSuccessRateController,
} from "./analytics.controller";

import {
  authenticate,
} from "../../middleware/auth.middleware";

const router = Router();

// ==========================================
// TECHNICIAN PERFORMANCE
// ADMIN + EMPLOYEE
// ==========================================

router.get(
  "/technician-performance",
  authenticate,
  getTechnicianPerformanceController
);

// ==========================================
// ASSET HEALTH
// ADMIN + EMPLOYEE
// ==========================================

router.get(
  "/asset-health",
  authenticate,
  getAssetHealthController
);

// ==========================================
// CHANGE SUCCESS RATE
// ADMIN + EMPLOYEE
// ==========================================

router.get(
  "/change-success-rate",
  authenticate,
  getChangeSuccessRateController
);

export default router;