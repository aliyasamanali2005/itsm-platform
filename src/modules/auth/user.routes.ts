import { Router } from "express";

import {
  createUserController,
  getUsersController,
  getUserController,
  updateUserController,
  deactivateUserController,
} from "./user.controller";

import {
  authenticate,
  authorize,
} from "../../middleware/auth.middleware";

const router = Router();

// ==========================================
// USER MANAGEMENT ROUTES
// ==========================================

// CREATE USER — Admin only
router.post(
  "/",
  authenticate,
  authorize("admin"),
  createUserController
);

// GET ALL USERS — Admin only
router.get(
  "/",
  authenticate,
  authorize("admin"),
  getUsersController
);

// GET ONE USER — Admin only
router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  getUserController
);

// UPDATE USER — Admin only
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  updateUserController
);

// DEACTIVATE USER — Admin only
router.patch(
  "/:id/deactivate",
  authenticate,
  authorize("admin"),
  deactivateUserController
);

export default router;