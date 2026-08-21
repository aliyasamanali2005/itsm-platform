import { Response } from "express";

import {
  createRCA,
  getRCAsByOrganization,
  getRCAById,
  getRCAByProblem,
  updateRCA,
  deleteRCA,
} from "./rca.service";

import { AuthRequest } from "../../middleware/auth.middleware";

// ==========================================
// CREATE RCA
// ==========================================

export const createRCAController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const organizationId = req.user.organizationId;

    const rca = await createRCA({
      ...req.body,
      organizationId,
    });

    return res.status(201).json({
      success: true,
      message: "RCA created successfully",
      data: rca,
    });
  } catch (error: any) {
    console.error("Create RCA Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL RCAs
// ==========================================

export const getRCAsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const organizationId = req.user.organizationId;

    const rcas = await getRCAsByOrganization(
      organizationId
    );

    return res.status(200).json({
      success: true,
      count: rcas.length,
      data: rcas,
    });
  } catch (error: any) {
    console.error("Get RCAs Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET RCA BY ID
// ==========================================

export const getRCAController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const id = String(req.params.id);

    const organizationId = req.user.organizationId;

    const rca = await getRCAById(
      id,
      organizationId
    );

    if (!rca) {
      return res.status(404).json({
        success: false,
        message: "RCA not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: rca,
    });
  } catch (error: any) {
    console.error("Get RCA Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET RCA BY PROBLEM
// ==========================================

export const getRCAByProblemController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const problemId = String(
      req.params.problemId
    );

    const organizationId = req.user.organizationId;

    const rca = await getRCAByProblem(
      problemId,
      organizationId
    );

    if (!rca) {
      return res.status(404).json({
        success: false,
        message: "No RCA found for this problem",
      });
    }

    return res.status(200).json({
      success: true,
      data: rca,
    });
  } catch (error: any) {
    console.error(
      "Get RCA By Problem Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE RCA
// ==========================================

export const updateRCAController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const id = String(req.params.id);

    const organizationId = req.user.organizationId;

    const rca = await updateRCA(
      id,
      organizationId,
      req.body
    );

    if (!rca) {
      return res.status(404).json({
        success: false,
        message: "RCA not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "RCA updated successfully",
      data: rca,
    });
  } catch (error: any) {
    console.error("Update RCA Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE RCA
// ==========================================

export const deleteRCAController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const id = String(req.params.id);

    const organizationId = req.user.organizationId;

    const deletedRCA = await deleteRCA(
      id,
      organizationId
    );

    if (!deletedRCA) {
      return res.status(404).json({
        success: false,
        message: "RCA not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "RCA deleted successfully",
      data: deletedRCA,
    });
  } catch (error: any) {
    console.error("Delete RCA Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};