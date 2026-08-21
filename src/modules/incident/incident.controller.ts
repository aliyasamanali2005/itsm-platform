import { Response } from "express";

import {
  createIncident,
  getIncidentsByOrganization,
  getIncidentById,
  updateIncident,
  deleteIncident,
} from "./incident.service";

import { AuthRequest } from "../../middleware/auth.middleware";

// ==========================================
// CREATE INCIDENT
// ==========================================

export const createIncidentController = async (
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

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "User authentication is required",
      });
    }

    const incident = await createIncident({
      ...req.body,
      reportedBy: req.user.id,
      organizationId: req.user.organizationId,
    });

    res.status(201).json({
      success: true,
      message: "Incident created successfully",
      data: incident,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL INCIDENTS
// ==========================================

export const getIncidentsController = async (
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

    const incidents = await getIncidentsByOrganization(
      req.user.organizationId
    );

    res.status(200).json({
      success: true,
      data: incidents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET INCIDENT BY ID
// ==========================================

export const getIncidentController = async (
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

    const incident = await getIncidentById(
      req.params.id as string,
      req.user.organizationId
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE INCIDENT
// ==========================================

export const updateIncidentController = async (
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

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "User authentication is required",
      });
    }

    // ==========================================
    // GET EXISTING INCIDENT
    // ==========================================

    const existingIncident = await getIncidentById(
      req.params.id as string,
      req.user.organizationId
    );

    if (!existingIncident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    // ==========================================
    // ADMIN
    // ==========================================

    if (req.user.role === "admin") {
      const incident = await updateIncident(
        req.params.id as string,
        req.user.organizationId,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: "Incident updated successfully",
        data: incident,
      });
    }

    // ==========================================
    // EMPLOYEE AUTHORIZATION
    // ==========================================

    const assignedTo = existingIncident.assignedTo as
      | {
          _id?: unknown;
        }
      | undefined;

    const assignedUserId =
      assignedTo?._id?.toString();

    const isAssignedEmployee =
      assignedUserId === req.user.id;

    // ==========================================
    // EMPLOYEE CANNOT ASSIGN / REASSIGN
    // ==========================================

    if (req.body.assignedTo !== undefined) {
      return res.status(403).json({
        success: false,
        message:
          "Employees cannot assign or reassign incidents",
      });
    }

    // ==========================================
    // EMPLOYEE MUST BE ASSIGNED
    // ==========================================

    if (!isAssignedEmployee) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to manage this incident",
      });
    }

    // ==========================================
    // EMPLOYEE STATUS PERMISSIONS
    // ==========================================

    const allowedEmployeeStatuses = [
      "In Progress",
      "Resolved",
    ];

    if (
      req.body.status &&
      !allowedEmployeeStatuses.includes(
        req.body.status
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Employees cannot set this incident status",
      });
    }

    // ==========================================
    // UPDATE INCIDENT
    // ==========================================

    const incident = await updateIncident(
      req.params.id as string,
      req.user.organizationId,
      req.body
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Incident updated successfully",
      data: incident,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE INCIDENT
// ==========================================

export const deleteIncidentController = async (
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

    const incident = await deleteIncident(
      req.params.id as string,
      req.user.organizationId
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Incident deleted successfully",
      data: incident,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};