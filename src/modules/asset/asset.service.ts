import mongoose from "mongoose";
import { authRepository } from "../auth/auth.repository";
import { assetRepository } from "./asset.repository";

// ==========================================
// TYPES
// ==========================================

interface CreateAssetData {
  assetId: string;
  name: string;
  category: string;
  description?: string;
  status?: "Available" | "Assigned" | "Maintenance" | "Retired";
  purchaseDate?: Date;
  purchasePrice?: number;
  organizationId: string;
}

interface UpdateAssetData {
  name?: string;
  category?: string;
  description?: string;
  status?: "Available" | "Assigned" | "Maintenance" | "Retired";
  purchaseDate?: Date;
  purchasePrice?: number;
}

// ==========================================
// HELPERS
// ==========================================

const validateObjectId = (
  id: string,
  fieldName: string
): void => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }
};

// ==========================================
// CREATE ASSET
// ==========================================

export const createAsset = async (
  data: CreateAssetData
) => {
  validateObjectId(
    data.organizationId,
    "organization ID"
  );

  const existingAsset = await assetRepository.findOne({
    assetId: data.assetId,
    organizationId: data.organizationId,
  });

  if (existingAsset) {
    throw new Error(
      "An asset with this ID already exists in this organization"
    );
  }

  return assetRepository.create({
    assetId: data.assetId,
    name: data.name,
    category: data.category,
    description: data.description,
    status: data.status || "Available",
    purchaseDate: data.purchaseDate,
    purchasePrice: data.purchasePrice,
    organizationId: new mongoose.Types.ObjectId(
      data.organizationId
    ),
  });
};

// ==========================================
// GET ALL ASSETS
// ==========================================

export const getAssetsByOrganization = async (
  organizationId: string
) => {
  validateObjectId(
    organizationId,
    "organization ID"
  );

  return assetRepository.findAllByOrganization(
    organizationId
  );
};

// ==========================================
// GET ASSET BY ID
// ==========================================

export const getAssetById = async (
  id: string,
  organizationId: string
) => {
  validateObjectId(id, "asset ID");

  validateObjectId(
    organizationId,
    "organization ID"
  );

  return assetRepository.findByIdAndOrganization(
    id,
    organizationId
  );
};

// ==========================================
// UPDATE ASSET
// ==========================================

export const updateAsset = async (
  id: string,
  organizationId: string,
  data: UpdateAssetData
) => {
  validateObjectId(id, "asset ID");

  validateObjectId(
    organizationId,
    "organization ID"
  );

  return assetRepository.updateByIdAndOrganization(
    id,
    organizationId,
    data
  );
};

// ==========================================
// DELETE ASSET
// ==========================================

export const deleteAsset = async (
  id: string,
  organizationId: string
) => {
  validateObjectId(id, "asset ID");

  validateObjectId(
    organizationId,
    "organization ID"
  );

  return assetRepository.deleteByIdAndOrganization(
    id,
    organizationId
  );
};

// ==========================================
// ASSIGN ASSET
// ==========================================

export const assignAsset = async (
  assetId: string,
  employeeId: string,
  organizationId: string
) => {
  validateObjectId(assetId, "asset ID");

  validateObjectId(employeeId, "employee ID");

  validateObjectId(
    organizationId,
    "organization ID"
  );

  // ------------------------------------------
  // Find asset in current organization
  // ------------------------------------------

  const asset = await assetRepository.findOne({
    _id: assetId,
    organizationId,
  });

  if (!asset) {
    throw new Error("Asset not found");
  }

  // ------------------------------------------
  // Asset must be available
  // ------------------------------------------

  if (asset.status !== "Available") {
    throw new Error(
      `Asset cannot be assigned because its status is ${asset.status}`
    );
  }

  // ------------------------------------------
  // Find active employee
  // in the same organization
  // ------------------------------------------

  const employee = await authRepository.findOne({
    _id: employeeId,
    organizationId,
    role: "employee",
    isActive: true,
  });

  if (!employee) {
    throw new Error(
      "Active employee not found in this organization"
    );
  }

  // ------------------------------------------
  // Assign asset through repository
  // ------------------------------------------

  return assetRepository.assign(
    asset._id.toString(),
    employee._id.toString()
  );
};

// ==========================================
// UNASSIGN ASSET
// ==========================================

export const unassignAsset = async (
  assetId: string,
  organizationId: string
) => {
  validateObjectId(assetId, "asset ID");

  validateObjectId(
    organizationId,
    "organization ID"
  );

  // ------------------------------------------
  // Find asset in current organization
  // ------------------------------------------

  const asset = await assetRepository.findOne({
    _id: assetId,
    organizationId,
  });

  if (!asset) {
    throw new Error("Asset not found");
  }

  // ------------------------------------------
  // Asset must currently be assigned
  // ------------------------------------------

  if (!asset.assignedTo) {
    throw new Error(
      "Asset is not currently assigned"
    );
  }

  // ------------------------------------------
  // Unassign asset through repository
  // ------------------------------------------

  return assetRepository.unassign(
    asset._id.toString()
  );
};