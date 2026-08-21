import mongoose from "mongoose";

import KnowledgeBase from "./knowledgeBase.model";

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
  return await KnowledgeBase.create({
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
  return await KnowledgeBase.find({
    organizationId: new mongoose.Types.ObjectId(
      organizationId
    ),
  }).sort({
    createdAt: -1,
  });
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
  // FIND ARTICLE
  // ------------------------------------------

  return await KnowledgeBase.findOne({
    _id: id,
    organizationId: new mongoose.Types.ObjectId(
      organizationId
    ),
  });
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
  // UPDATE ARTICLE
  // ------------------------------------------

  return await KnowledgeBase.findOneAndUpdate(
    {
      _id: id,
      organizationId: new mongoose.Types.ObjectId(
        organizationId
      ),
    },

    updateData,

    {
      new: true,
      runValidators: true,
    }
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
  // DELETE ARTICLE
  // ------------------------------------------

  return await KnowledgeBase.findOneAndDelete({
    _id: id,
    organizationId: new mongoose.Types.ObjectId(
      organizationId
    ),
  });
};