import mongoose, { Document, Schema } from "mongoose";

// ==========================================
// TYPES
// ==========================================

export type RCAStatus =
  | "Draft"
  | "Under Investigation"
  | "Completed"
  | "Approved";

// ==========================================
// INTERFACE
// ==========================================

export interface IRCA extends Document {
  rcaId: string;

  problem: mongoose.Types.ObjectId;

  rootCause: string;

  investigation: string;

  contributingFactors: string[];

  correctiveActions: string[];

  preventiveActions: string[];

  identifiedBy: mongoose.Types.ObjectId;

  relatedIncidents: mongoose.Types.ObjectId[];

  organizationId: mongoose.Types.ObjectId;

  status: RCAStatus;

  createdAt: Date;

  updatedAt: Date;
}

// ==========================================
// SCHEMA
// ==========================================

const rcaSchema = new Schema<IRCA>(
  {
    rcaId: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // PROBLEM REFERENCE
    // ==========================================

    problem: {
      type: Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },

    // ==========================================
    // ROOT CAUSE
    // ==========================================

    rootCause: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // INVESTIGATION
    // ==========================================

    investigation: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // CONTRIBUTING FACTORS
    // ==========================================

    contributingFactors: {
      type: [String],
      default: [],
    },

    // ==========================================
    // CORRECTIVE ACTIONS
    // ==========================================

    correctiveActions: {
      type: [String],
      default: [],
    },

    // ==========================================
    // PREVENTIVE ACTIONS
    // ==========================================

    preventiveActions: {
      type: [String],
      default: [],
    },

    // ==========================================
    // IDENTIFIED BY
    // ==========================================

    identifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      required: true,
    },

    // ==========================================
    // RELATED INCIDENTS
    // ==========================================

    relatedIncidents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Incident",
      },
    ],

    // ==========================================
    // ORGANIZATION
    // ==========================================

    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    // ==========================================
    // RCA STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "Draft",
        "Under Investigation",
        "Completed",
        "Approved",
      ],
      default: "Draft",
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// UNIQUE RCA ID PER ORGANIZATION
// ==========================================

rcaSchema.index(
  {
    rcaId: 1,
    organizationId: 1,
  },
  {
    unique: true,
  }
);

// ==========================================
// ONE RCA PER PROBLEM
// ==========================================

rcaSchema.index(
  {
    problem: 1,
    organizationId: 1,
  },
  {
    unique: true,
  }
);

// ==========================================
// TENANT + STATUS
// ==========================================

rcaSchema.index({
  organizationId: 1,
  status: 1,
});

// ==========================================
// TENANT + CREATED DATE
// ==========================================

rcaSchema.index({
  organizationId: 1,
  createdAt: -1,
});

// ==========================================
// MODEL
// ==========================================

export default mongoose.model<IRCA>(
  "RCA",
  rcaSchema
);