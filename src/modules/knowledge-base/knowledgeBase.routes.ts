import { Router } from "express";

import {
  createKnowledgeBaseController,
  getKnowledgeBasesController,
  getKnowledgeBaseByIdController,
  updateKnowledgeBaseController,
  deleteKnowledgeBaseController,
} from "./knowledgeBase.controller";

import {
  authenticate,
  authorize,
} from "../../middleware/auth.middleware";

const router = Router();

// ==========================================
// CREATE KNOWLEDGE BASE ARTICLE
// ADMIN ONLY
// ==========================================

router.post(
  "/",
  authenticate,
  authorize("admin"),
  createKnowledgeBaseController
);

// ==========================================
// GET ALL KNOWLEDGE BASE ARTICLES
// ADMIN + EMPLOYEE
// ==========================================

router.get(
  "/",
  authenticate,
  getKnowledgeBasesController
);

// ==========================================
// GET KNOWLEDGE BASE ARTICLE BY ID
// ADMIN + EMPLOYEE
// ==========================================

router.get(
  "/:id",
  authenticate,
  getKnowledgeBaseByIdController
);

// ==========================================
// UPDATE KNOWLEDGE BASE ARTICLE
// ADMIN ONLY
// ==========================================

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  updateKnowledgeBaseController
);

// ==========================================
// DELETE KNOWLEDGE BASE ARTICLE
// ADMIN ONLY
// ==========================================

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  deleteKnowledgeBaseController
);

export default router;