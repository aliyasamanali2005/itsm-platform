import mongoose, { Document, Schema } from "mongoose";

export interface IAsset extends Document {
  assetId: string;
  name: string;
  category: string;
  description?: string;

  status:
    | "Available"
    | "Assigned"
    | "Maintenance"
    | "Retired";

  purchaseDate?: Date;
  purchasePrice?: number;

  assignedTo?: mongoose.Types.ObjectId;

  organizationId: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const assetSchema = new Schema<IAsset>(
  {
    assetId: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Available",
        "Assigned",
        "Maintenance",
        "Retired",
      ],
      default: "Available",
    },

    purchaseDate: {
      type: Date,
    },

    purchasePrice: {
      type: Number,
      min: 0,
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
    },

    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Asset IDs must be unique inside an organization
assetSchema.index(
  {
    assetId: 1,
    organizationId: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model<IAsset>(
  "Asset",
  assetSchema
);