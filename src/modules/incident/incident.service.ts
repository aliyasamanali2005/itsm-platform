import Incident, {
  IncidentPriority,
  IncidentSeverity,
  IncidentStatus,
} from "./incident.model";

import AuthUser from "../auth/auth.model";
import SLA from "../sla/sla.model";

// ==========================================
// TYPES
// ==========================================

interface CreateIncidentData {
  incidentId: string;
  title: string;
  description: string;
  priority?: IncidentPriority;
  severity?: IncidentSeverity;
  reportedBy: string;
  organizationId: string;
}

interface UpdateIncidentData {
  title?: string;
  description?: string;
  priority?: IncidentPriority;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  assignedTo?: string;
  resolution?: string;
}

// ==========================================
// CREATE INCIDENT
// ==========================================

export const createIncident = async (
  data: CreateIncidentData
) => {
  const existingIncident = await Incident.findOne({
    incidentId: data.incidentId,
    organizationId: data.organizationId,
  });

  if (existingIncident) {
    throw new Error(
      "An incident with this ID already exists in this organization"
    );
  }

  const reporter = await AuthUser.findOne({
    _id: data.reportedBy,
    organizationId: data.organizationId,
    isActive: true,
  });

  if (!reporter) {
    throw new Error(
      "Reporter does not belong to this organization"
    );
  }

  return Incident.create({
    incidentId: data.incidentId,
    title: data.title,
    description: data.description,
    priority: data.priority || "Medium",
    severity: data.severity || "Minor",
    status: "Open",
    reportedBy: data.reportedBy,
    organizationId: data.organizationId,
  });
};

// ==========================================
// GET ALL INCIDENTS
// ==========================================

export const getIncidentsByOrganization = async (
  organizationId: string
) => {
  return Incident.find({
    organizationId,
  })
    .populate(
      "reportedBy",
      "name email role"
    )
    .populate(
      "assignedTo",
      "name email role"
    )
    .sort({
      createdAt: -1,
    });
};

// ==========================================
// GET INCIDENT BY ID
// ==========================================

export const getIncidentById = async (
  id: string,
  organizationId: string
) => {
  return Incident.findOne({
    _id: id,
    organizationId,
  })
    .populate(
      "reportedBy",
      "name email role"
    )
    .populate(
      "assignedTo",
      "name email role"
    );
};

// ==========================================
// UPDATE INCIDENT
// ==========================================

export const updateIncident = async (
  id: string,
  organizationId: string,
  data: UpdateIncidentData
) => {
  const updateData: any = {
    ...data,
  };

  // ------------------------------------------
  // ASSIGNMENT VALIDATION
  // ------------------------------------------

  if (data.assignedTo) {
    const employee = await AuthUser.findOne({
      _id: data.assignedTo,
      organizationId,
      isActive: true,
    });

    if (!employee) {
      throw new Error(
        "Assigned user does not belong to this organization"
      );
    }

    if (employee.role !== "employee") {
      throw new Error(
        "Incidents can only be assigned to employees"
      );
    }

    updateData.assignedTo = employee._id;
  }

  // ------------------------------------------
  // RESOLUTION TRACKING
  // ------------------------------------------

  if (data.status === "Resolved") {
    if (!data.resolution) {
      throw new Error(
        "Resolution is required when resolving an incident"
      );
    }

    updateData.resolvedAt = new Date();
  }

  // ------------------------------------------
  // CLOSED INCIDENT
  // ------------------------------------------

  if (data.status === "Closed") {
    updateData.closedAt = new Date();
  }

  // ------------------------------------------
  // UPDATE INCIDENT
  // ------------------------------------------

  const incident = await Incident.findOneAndUpdate(
    {
      _id: id,
      organizationId,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate(
      "reportedBy",
      "name email role"
    )
    .populate(
      "assignedTo",
      "name email role"
    );

  if (!incident) {
    return null;
  }

  // ==========================================
  // SLA AUTOMATION
  // ==========================================

  const sla = await SLA.findOne({
    incidentId: id,
    organizationId,
  });

  if (sla) {
    // ----------------------------------------
    // FIRST RESPONSE
    // ----------------------------------------

    if (
      data.status === "In Progress" &&
      !sla.respondedAt
    ) {
      sla.respondedAt = new Date();
    }

    // ----------------------------------------
    // INCIDENT RESOLVED
    // ----------------------------------------

    if (
      data.status === "Resolved" &&
      !sla.resolvedAt
    ) {
      sla.resolvedAt = new Date();
      sla.status = "Completed";
    }

    // ----------------------------------------
    // INCIDENT CLOSED
    // ----------------------------------------

    if (
      data.status === "Closed" &&
      !sla.resolvedAt
    ) {
      sla.resolvedAt = new Date();
      sla.status = "Completed";
    }

    await sla.save();
  }

  return incident;
};

// ==========================================
// DELETE INCIDENT
// ==========================================

export const deleteIncident = async (
  id: string,
  organizationId: string
) => {
  return Incident.findOneAndDelete({
    _id: id,
    organizationId,
  });
};