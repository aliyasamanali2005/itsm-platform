import { Router } from "express";

import {
  createSLAController,
  getSLAController,
  getSLAsController,
  checkSLABreachController,
  recordSLAResponseController,
  recordSLAResolutionController,
} from "./sla.controller";

import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// ==========================================
// CREATE SLA FOR INCIDENT
// ==========================================

router.post(
  "/incidents/:incidentId",
  authenticate,
  createSLAController
);

// ==========================================
// GET SLA BY INCIDENT
// ==========================================

router.get(
  "/incidents/:incidentId",
  authenticate,
  getSLAController
);

// ==========================================
// GET ALL SLAS
// ==========================================

router.get(
  "/",
  authenticate,
  getSLAsController
);

// ==========================================
// CHECK SLA BREACH
// ==========================================

router.patch(
  "/:id/check-breach",
  authenticate,
  checkSLABreachController
);

// ==========================================
// RECORD RESPONSE
// ==========================================

router.patch(
  "/:id/response",
  authenticate,
  recordSLAResponseController
);

// ==========================================
// RECORD RESOLUTION
// ==========================================

router.patch(
  "/:id/resolution",
  authenticate,
  recordSLAResolutionController
);

export default router;