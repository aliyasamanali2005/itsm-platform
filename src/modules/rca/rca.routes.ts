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
// CREATE RCA
// ==========================================

router.post(
  "/",
  authenticate,
  createRCAController
);

// ==========================================
// GET ALL RCAs
// ==========================================

router.get(
  "/",
  authenticate,
  getRCAsController
);

// ==========================================
// GET RCA BY PROBLEM
// IMPORTANT: Must come before /:id
// ==========================================

router.get(
  "/problem/:problemId",
  authenticate,
  getRCAByProblemController
);

// ==========================================
// GET RCA BY ID
// ==========================================

router.get(
  "/:id",
  authenticate,
  getRCAController
);

// ==========================================
// UPDATE RCA
// ==========================================

router.put(
  "/:id",
  authenticate,
  updateRCAController
);

// ==========================================
// DELETE RCA
// ==========================================

router.delete(
  "/:id",
  authenticate,
  deleteRCAController
);

export default router;