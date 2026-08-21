import Asset from "./asset.model";
import AuthUser from "../auth/auth.model";

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
// CREATE ASSET
// ==========================================

export const createAsset = async (
  data: CreateAssetData
) => {
  const existingAsset = await Asset.findOne({
    assetId: data.assetId,
    organizationId: data.organizationId,
  });

  if (existingAsset) {
    throw new Error(
      "An asset with this ID already exists in this organization"
    );
  }

  return Asset.create({
    assetId: data.assetId,
    name: data.name,
    category: data.category,
    description: data.description,
    status: data.status || "Available",
    purchaseDate: data.purchaseDate,
    purchasePrice: data.purchasePrice,
    organizationId: data.organizationId,
  });
};

// ==========================================
// GET ALL ASSETS
// ==========================================

export const getAssetsByOrganization = async (
  organizationId: string
) => {
  return Asset.find({
    organizationId,
  })
    .populate("assignedTo", "name email role")
    .sort({ createdAt: -1 });
};

// ==========================================
// GET ASSET BY ID
// ==========================================

export const getAssetById = async (
  id: string,
  organizationId: string
) => {
  return Asset.findOne({
    _id: id,
    organizationId,
  }).populate(
    "assignedTo",
    "name email role"
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
  return Asset.findOneAndUpdate(
    {
      _id: id,
      organizationId,
    },
    data,
    {
      new: true,
      runValidators: true,
    }
  ).populate(
    "assignedTo",
    "name email role"
  );
};

// ==========================================
// DELETE ASSET
// ==========================================

export const deleteAsset = async (
  id: string,
  organizationId: string
) => {
  return Asset.findOneAndDelete({
    _id: id,
    organizationId,
  });
};

// ==========================================
// ASSIGN ASSET
// ==========================================

export const assignAsset = async (
  assetId: string,
  employeeId: string,
  organizationId: string
) => {
  // Find asset inside the current organization
  const asset = await Asset.findOne({
    _id: assetId,
    organizationId,
  });

  if (!asset) {
    throw new Error("Asset not found");
  }

  // Asset must be available
  if (asset.status !== "Available") {
    throw new Error(
      `Asset cannot be assigned because its status is ${asset.status}`
    );
  }

  // Find employee inside the same organization
  const employee = await AuthUser.findOne({
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

  // Assign asset
  asset.assignedTo = employee._id;
  asset.status = "Assigned";

  await asset.save();

  return Asset.findById(asset._id).populate(
    "assignedTo",
    "name email role"
  );
};

// ==========================================
// UNASSIGN ASSET
// ==========================================

export const unassignAsset = async (
  assetId: string,
  organizationId: string
) => {
  const asset = await Asset.findOne({
    _id: assetId,
    organizationId,
  });

  if (!asset) {
    throw new Error("Asset not found");
  }

  if (!asset.assignedTo) {
    throw new Error("Asset is not currently assigned");
  }

  // Remove employee assignment
  asset.assignedTo = undefined;
  asset.status = "Available";

  await asset.save();

  return Asset.findById(asset._id).populate(
    "assignedTo",
    "name email role"
  );
};