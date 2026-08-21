import mongoose from "mongoose";
import ServiceCatalog from "./serviceCatalog.model";

// ==========================================
// CREATE SERVICE
// ==========================================

export const createServiceCatalog = async (
  name: string,
  description: string,
  category: string | undefined,
  organizationId: string,
  createdBy: string,
  isActive: boolean = true
) => {
  return await ServiceCatalog.create({
    name,
    description,
    category,
    organizationId: new mongoose.Types.ObjectId(organizationId),
    createdBy: new mongoose.Types.ObjectId(createdBy),
    isActive,
  });
};

// ==========================================
// GET ALL SERVICES
// ==========================================

export const getServiceCatalogs = async (
  organizationId: string
) => {
  return await ServiceCatalog.find({
    organizationId: new mongoose.Types.ObjectId(organizationId),
  })
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });
};

// ==========================================
// GET SERVICE BY ID
// ==========================================

export const getServiceCatalogById = async (
  id: string,
  organizationId: string
) => {
  return await ServiceCatalog.findOne({
    _id: id,
    organizationId: new mongoose.Types.ObjectId(organizationId),
  }).populate("createdBy", "name email");
};

// ==========================================
// UPDATE SERVICE
// ==========================================

export const updateServiceCatalog = async (
  id: string,
  organizationId: string,
  updateData: {
    name?: string;
    description?: string;
    category?: string;
    isActive?: boolean;
  }
) => {
  return await ServiceCatalog.findOneAndUpdate(
    {
      _id: id,
      organizationId: new mongoose.Types.ObjectId(organizationId),
    },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).populate("createdBy", "name email");
};

// ==========================================
// DELETE SERVICE
// ==========================================

export const deleteServiceCatalog = async (
  id: string,
  organizationId: string
) => {
  return await ServiceCatalog.findOneAndDelete({
    _id: id,
    organizationId: new mongoose.Types.ObjectId(organizationId),
  });
};