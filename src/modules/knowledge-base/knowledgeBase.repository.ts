import mongoose from "mongoose";

import KnowledgeBase, {
  IKnowledgeBase,
} from "./knowledgeBase.model";

// ==========================================
// KNOWLEDGE BASE REPOSITORY
// ==========================================

export const knowledgeBaseRepository = {
  // ==========================================
  // CREATE
  // ==========================================

  create: async (
    data: Partial<IKnowledgeBase>
  ): Promise<IKnowledgeBase> => {
    return KnowledgeBase.create(data);
  },

  // ==========================================
  // FIND ALL BY ORGANIZATION
  // ==========================================

  findAllByOrganization: async (
    organizationId: string
  ): Promise<IKnowledgeBase[]> => {
    return KnowledgeBase.find({
      organizationId: new mongoose.Types.ObjectId(
        organizationId
      ),
    }).sort({
      createdAt: -1,
    });
  },

  // ==========================================
  // FIND BY ID + ORGANIZATION
  // ==========================================

  findByIdAndOrganization: async (
    id: string,
    organizationId: string
  ): Promise<IKnowledgeBase | null> => {
    return KnowledgeBase.findOne({
      _id: id,
      organizationId: new mongoose.Types.ObjectId(
        organizationId
      ),
    });
  },

  // ==========================================
  // UPDATE BY ID + ORGANIZATION
  // ==========================================

  updateByIdAndOrganization: async (
    id: string,
    organizationId: string,
    updateData: Partial<IKnowledgeBase>
  ): Promise<IKnowledgeBase | null> => {
    return KnowledgeBase.findOneAndUpdate(
      {
        _id: id,
        organizationId: new mongoose.Types.ObjectId(
          organizationId
        ),
      },
      updateData,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );
  },

  // ==========================================
  // DELETE BY ID + ORGANIZATION
  // ==========================================

  deleteByIdAndOrganization: async (
    id: string,
    organizationId: string
  ): Promise<IKnowledgeBase | null> => {
    return KnowledgeBase.findOneAndDelete({
      _id: id,
      organizationId: new mongoose.Types.ObjectId(
        organizationId
      ),
    });
  },
};