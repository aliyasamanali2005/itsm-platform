import { Response } from "express";

import { AuthRequest } from "../../middleware/auth.middleware";

import {
  getAnalyticsOverview,
} from "./analytics.service";

// ==========================================
// GET ANALYTICS OVERVIEW
// ==========================================

export const getAnalyticsOverviewController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // ==========================================
    // AUTHENTICATION CHECK
    // ==========================================

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ==========================================
    // ORGANIZATION CHECK
    // ==========================================

    const { organizationId } = req.user;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    // ==========================================
    // GET ANALYTICS
    // ==========================================

    const analytics = await getAnalyticsOverview(
      organizationId
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error(
      "Get analytics overview error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch analytics",
    });
  }
};