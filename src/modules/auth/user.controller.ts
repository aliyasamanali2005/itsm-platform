import { Response } from "express";

import {
  createUser,
  getUsersByOrganization,
  getUserById,
  updateUser,
  deactivateUser,
} from "./user.service";

import { AuthRequest } from "../../middleware/auth.middleware";

// ==========================================
// CREATE USER
// ==========================================

export const createUserController = async (
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

    const user = await createUser({
      ...req.body,
      organizationId: req.user.organizationId,
    });

    const userResponse = user.toObject();

    const { password: _password, ...safeUser } = userResponse;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: safeUser,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET USERS
// ==========================================

export const getUsersController = async (
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

    const users = await getUsersByOrganization(
      req.user.organizationId
    );

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET USER BY ID
// ==========================================

export const getUserController = async (
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

    const user = await getUserById(
      req.params.id as string,
      req.user.organizationId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE USER
// ==========================================

export const updateUserController = async (
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

    const user = await updateUser(
      req.params.id as string,
      req.user.organizationId,
      req.body
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DEACTIVATE USER
// ==========================================

export const deactivateUserController = async (
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

    const user = await deactivateUser(
      req.params.id as string,
      req.user.organizationId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};