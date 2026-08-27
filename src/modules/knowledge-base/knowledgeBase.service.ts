import mongoose from "mongoose";

import { knowledgeBaseRepository } from "./knowledgeBase.repository";

// ==========================================
// CREATE KNOWLEDGE BASE ARTICLE
// ==========================================

export const createKnowledgeBase = async (
  title: string,
  content: string,
  category: string | undefined,
  organizationId: string,
  createdBy: string,
  isPublished: boolean = false
) => {
  return knowledgeBaseRepository.create({
    title,
    content,
    category,

    organizationId: new mongoose.Types.ObjectId(
      organizationId
    ),

    createdBy: new mongoose.Types.ObjectId(
      createdBy
    ),

    isPublished,
  });
};

// ==========================================
// GET ALL KNOWLEDGE BASE ARTICLES
// ==========================================

export const getKnowledgeBases = async (
  organizationId: string
) => {
  return knowledgeBaseRepository.findAllByOrganization(
    organizationId
  );
};

// ==========================================
// GET KNOWLEDGE BASE ARTICLE BY ID
// ==========================================

export const getKnowledgeBaseById = async (
  id: string,
  organizationId: string
) => {
  // ------------------------------------------
  // VALIDATE OBJECT ID
  // ------------------------------------------

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  // ------------------------------------------
  // FIND ARTICLE THROUGH REPOSITORY
  // ------------------------------------------

  return knowledgeBaseRepository.findByIdAndOrganization(
    id,
    organizationId
  );
};

// ==========================================
// UPDATE KNOWLEDGE BASE ARTICLE
// ==========================================

export const updateKnowledgeBase = async (
  id: string,
  organizationId: string,
  updateData: {
    title?: string;
    content?: string;
    category?: string;
    isPublished?: boolean;
  }
) => {
  // ------------------------------------------
  // VALIDATE OBJECT ID
  // ------------------------------------------

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  // ------------------------------------------
  // UPDATE THROUGH REPOSITORY
  // ------------------------------------------

  return knowledgeBaseRepository.updateByIdAndOrganization(
    id,
    organizationId,
    updateData
  );
};

// ==========================================
// DELETE KNOWLEDGE BASE ARTICLE
// ==========================================

export const deleteKnowledgeBase = async (
  id: string,
  organizationId: string
) => {
  // ------------------------------------------
  // VALIDATE OBJECT ID
  // ------------------------------------------

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  // ------------------------------------------
  // DELETE THROUGH REPOSITORY
  // ------------------------------------------

  return knowledgeBaseRepository.deleteByIdAndOrganization(
    id,
    organizationId
  );
};