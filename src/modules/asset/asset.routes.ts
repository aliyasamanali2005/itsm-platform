import { Router } from "express";

import {
  createAssetController,
  getAssetsController,
  getAssetController,
  updateAssetController,
  deleteAssetController,
  assignAssetController,
  unassignAssetController,
} from "./asset.controller";

import {
  authenticate,
  authorize,
} from "../../middleware/auth.middleware";

const router = Router();

// ==========================================
// CREATE ASSET — ADMIN ONLY
// ==========================================

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createAssetController
);

// ==========================================
// GET ALL ASSETS — ADMIN + EMPLOYEE
// ==========================================

router.get(
  "/",
  authenticate,
  getAssetsController
);

// ==========================================
// GET ASSET — ADMIN + EMPLOYEE
// ==========================================

router.get(
  "/:id",
  authenticate,
  getAssetController
);

// ==========================================
// UPDATE ASSET — ADMIN ONLY
// ==========================================

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  updateAssetController
);

// ==========================================
// DELETE ASSET — ADMIN ONLY
// ==========================================

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  deleteAssetController
);

// ==========================================
// ASSIGN ASSET — ADMIN ONLY
// ==========================================

router.post(
  "/:id/assign",
  authenticate,
  authorize("admin"),
  assignAssetController
);

// ==========================================
// UNASSIGN ASSET — ADMIN ONLY
// ==========================================

router.post(
  "/:id/unassign",
  authenticate,
  authorize("admin"),
  unassignAssetController
);

export default router;