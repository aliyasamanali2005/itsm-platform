import mongoose, { Document, Schema } from "mongoose";

// ==========================================
// TYPES
// ==========================================

export type SLAStatus =
  | "Active"
  | "Response Breached"
  | "Resolution Breached"
  | "Completed";

export type SLAPriority =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

// ==========================================
// INTERFACE
// ==========================================

export interface ISLA extends Document {
  incidentId: mongoose.Types.ObjectId;

  organizationId: mongoose.Types.ObjectId;

  priority: SLAPriority;

  responseTimeMinutes: number;

  resolutionTimeMinutes: number;

  responseDueAt: Date;

  resolutionDueAt: Date;

  respondedAt?: Date;

  resolvedAt?: Date;

  status: SLAStatus;

  responseBreached: boolean;

  resolutionBreached: boolean;

  createdAt: Date;

  updatedAt: Date;
}

// ==========================================
// SCHEMA
// ==========================================

const slaSchema = new Schema<ISLA>(
  {
    incidentId: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
      unique: true,
    },

    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    priority: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
        "Critical",
      ],
      required: true,
    },

    responseTimeMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    resolutionTimeMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    responseDueAt: {
      type: Date,
      required: true,
    },

    resolutionDueAt: {
      type: Date,
      required: true,
    },

    respondedAt: {
      type: Date,
    },

    resolvedAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Response Breached",
        "Resolution Breached",
        "Completed",
      ],
      default: "Active",
    },

    responseBreached: {
      type: Boolean,
      default: false,
    },

    resolutionBreached: {
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

slaSchema.index({
  organizationId: 1,
  status: 1,
});

slaSchema.index({
  organizationId: 1,
  responseDueAt: 1,
});

slaSchema.index({
  organizationId: 1,
  resolutionDueAt: 1,
});

// ==========================================
// MODEL
// ==========================================

export default mongoose.model<ISLA>(
  "SLA",
  slaSchema
);