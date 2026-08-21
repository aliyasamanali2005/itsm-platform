import mongoose, { Document, Schema } from "mongoose";

// ==========================================
// TYPES
// ==========================================

export interface IKnowledgeBase extends Document {
  title: string;
  content: string;
  category?: string;

  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;

  isPublished: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// SCHEMA
// ==========================================

const knowledgeBaseSchema =
  new Schema<IKnowledgeBase>(
    {
      // ------------------------------------------
      // TITLE
      // ------------------------------------------

      title: {
        type: String,
        required: true,
        trim: true,
      },

      // ------------------------------------------
      // CONTENT
      // ------------------------------------------

      content: {
        type: String,
        required: true,
        trim: true,
      },

      // ------------------------------------------
      // CATEGORY
      // ------------------------------------------

      category: {
        type: String,
        trim: true,
      },

      // ------------------------------------------
      // ORGANIZATION
      // ------------------------------------------

      organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
      },

      // ------------------------------------------
      // CREATED BY
      // ------------------------------------------

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "AuthUser",
        required: true,
      },

      // ------------------------------------------
      // PUBLISHED STATUS
      // ------------------------------------------

      isPublished: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

// ==========================================
// INDEXES
// ==========================================

// Helps queries that retrieve articles
// belonging to a specific organization.
knowledgeBaseSchema.index({
  organizationId: 1,
});

// Helps organization-based filtering
// by published status.
knowledgeBaseSchema.index({
  organizationId: 1,
  isPublished: 1,
});

// Helps sorting articles by newest first
// within an organization.
knowledgeBaseSchema.index({
  organizationId: 1,
  createdAt: -1,
});

// ==========================================
// MODEL
// ==========================================

const KnowledgeBase =
  mongoose.model<IKnowledgeBase>(
    "KnowledgeBase",
    knowledgeBaseSchema
  );

export default KnowledgeBase;