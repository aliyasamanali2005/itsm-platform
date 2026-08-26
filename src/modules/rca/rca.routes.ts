import { Router } from "express";

import {
  createRCAController,
  getRCAsController,
  getRCAController,
  getRCAByProblemController,
  updateRCAController,
  deleteRCAController,
} from "./rca.controller";

import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// ==========================================
// ALL RCA ROUTES REQUIRE AUTHENTICATION
// ==========================================

router.use(authenticate);

// ==========================================
// CREATE RCA
// ==========================================

router.post(
  "/",
  createRCAController
);

// ==========================================
// GET ALL RCAs
// ==========================================

router.get(
  "/",
  getRCAsController
);

// ==========================================
// GET RCA BY PROBLEM
// IMPORTANT:
// This MUST come before /:id
// ==========================================

router.get(
  "/problem/:problemId",
  getRCAByProblemController
);

// ==========================================
// GET RCA BY ID
// ==========================================

router.get(
  "/:id",
  getRCAController
);

// ==========================================
// UPDATE RCA
// ==========================================

router.put(
  "/:id",
  updateRCAController
);

// ==========================================
// DELETE RCA
// ==========================================

router.delete(
  "/:id",
  deleteRCAController
);

export default router;