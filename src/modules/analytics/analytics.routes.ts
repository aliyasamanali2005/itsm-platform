import { Router } from "express";

import {
  getAnalyticsOverviewController,
} from "./analytics.controller";

import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// ==========================================
// ANALYTICS OVERVIEW
// ==========================================

router.get(
  "/overview",
  authenticate,
  getAnalyticsOverviewController
);

export default router;