import { Response } from "express";

import {
  createAsset,
  getAssetsByOrganization,
  getAssetById,
  updateAsset,
  deleteAsset,
  assignAsset,
  unassignAsset,
} from "./asset.service";

import { AuthRequest } from "../../middleware/auth.middleware";

// ==========================================
// CREATE ASSET
// ==========================================

export const createAssetController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        message: "Organization access is required",
      });
    }

    const asset = await createAsset({
      ...req.body,
      organizationId: req.user.organizationId,
    });

    res.status(201).json({
      success: true,
      message: "Asset created successfully",
      data: asset,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL ASSETS
// ==========================================

export const getAssetsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        message: "Organization access is required",
      });
    }

    const assets = await getAssetsByOrganization(
      req.user.organizationId
    );

    res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ASSET BY ID
// ==========================================

export const getAssetController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        message: "Organization access is required",
      });
    }

    const asset = await getAssetById(
      req.params.id as string,
      req.user.organizationId
    );

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE ASSET
// ==========================================

export const updateAssetController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        message: "Organization access is required",
      });
    }

    const asset = await updateAsset(
      req.params.id as string,
      req.user.organizationId,
      req.body
    );

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset updated successfully",
      data: asset,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE ASSET
// ==========================================

export const deleteAssetController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        message: "Organization access is required",
      });
    }

    const asset = await deleteAsset(
      req.params.id as string,
      req.user.organizationId
    );

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
      data: asset,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ASSIGN ASSET
// ==========================================

export const assignAssetController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        message: "Organization access is required",
      });
    }

    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId is required",
      });
    }

    const asset = await assignAsset(
      req.params.id as string,
      employeeId,
      req.user.organizationId
    );

    res.status(200).json({
      success: true,
      message: "Asset assigned successfully",
      data: asset,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UNASSIGN ASSET
// ==========================================

export const unassignAssetController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        message: "Organization access is required",
      });
    }

    const asset = await unassignAsset(
      req.params.id as string,
      req.user.organizationId
    );

    res.status(200).json({
      success: true,
      message: "Asset unassigned successfully",
      data: asset,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};