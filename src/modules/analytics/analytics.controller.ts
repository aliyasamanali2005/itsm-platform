import { Response } from "express";

import {
  getTechnicianPerformance,
  getAssetHealth,
  getChangeSuccessRate,
} from "./analytics.service";

import { AuthRequest } from "../../middleware/auth.middleware";

// ==========================================
// TECHNICIAN PERFORMANCE
// ==========================================

export const getTechnicianPerformanceController =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const organizationId =
        req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message:
            "Organization ID is required",
        });
      }

      const data =
        await getTechnicianPerformance(
          organizationId
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error(
        "Technician Performance Analytics Error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to retrieve technician performance analytics",
      });
    }
  };

// ==========================================
// ASSET HEALTH
// ==========================================

export const getAssetHealthController =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const organizationId =
        req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message:
            "Organization ID is required",
        });
      }

      const data =
        await getAssetHealth(
          organizationId
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error(
        "Asset Health Analytics Error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to retrieve asset health analytics",
      });
    }
  };

// ==========================================
// CHANGE SUCCESS RATE
// ==========================================

export const getChangeSuccessRateController =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const organizationId =
        req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message:
            "Organization ID is required",
        });
      }

      const data =
        await getChangeSuccessRate(
          organizationId
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error(
        "Change Success Rate Analytics Error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to retrieve change success rate analytics",
      });
    }
  };