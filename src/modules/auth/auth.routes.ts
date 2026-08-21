import { Router } from "express";

import {
  registerController,
  loginController,
  getCurrentUserController,
} from "./auth.controller";

import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// ==========================================
// AUTH ROUTES
// ==========================================

// REGISTER
router.post(
  "/register",
  registerController
);

// LOGIN
router.post(
  "/login",
  loginController
);

// CURRENT USER
router.get(
  "/me",
  authenticate,
  getCurrentUserController
);

export default router;