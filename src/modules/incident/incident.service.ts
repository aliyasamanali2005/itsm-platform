import Incident, {
  IncidentPriority,
  IncidentSeverity,
  IncidentStatus,
} from "./incident.model";

import AuthUser from "../auth/auth.model";
import SLA from "../sla/sla.model";

import {
  findMatchingAssignmentRule,
} from "../incident-assignment/incidentAssignmentRule.service";

import { notificationQueue } from "../../jobs/queues/notification.queue";

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

  /**
   * User ID of the employee to assign.
   *
   * null / empty string explicitly unassigns.
   */
  assignedTo?: string;

  resolution?: string;
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Convert incident priority into the priority
 * format expected by the notification system.
 */
const getNotificationPriority = (
  priority: IncidentPriority
) => {
  switch (priority) {
    case "Critical":
      return "Critical";

    case "High":
      return "High";

    case "Medium":
      return "Medium";

    default:
      return "Low";
  }
};

/**
 * Extract an ObjectId string from an assignment
 * rule targetUser.
 *
 * targetUser can be:
 *
 * 1. An ObjectId
 * 2. A string ObjectId
 * 3. A populated AuthUser object
 *
 * This prevents:
 *
 * Cast to ObjectId failed for value "[object Object]"
 */
const getTargetUserId = (
  targetUser: any
): string | undefined => {
  if (!targetUser) {
    return undefined;
  }

  // Populated AuthUser document/object
  if (
    typeof targetUser === "object" &&
    targetUser._id
  ) {
    return targetUser._id.toString();
  }

  // ObjectId or string
  return targetUser.toString();
};

/**
 * Queue an incident assignment notification.
 *
 * Notification failure must NEVER cause the
 * main incident operation to fail.
 */
const queueIncidentAssignmentNotification =
  async (
    userId: string,
    organizationId: string,
    incidentId: string,
    incidentMongoId: string,
    priority: IncidentPriority,
    message: string
  ) => {
    try {
      await notificationQueue.add(
        "notification-created",
        {
          userId,
          organizationId,

          title: "Incident Assigned",

          message,

          type: "Incident Assigned",

          entityType: "Incident",

          entityId: incidentMongoId,

          priority:
            getNotificationPriority(priority),
        },
        {
          attempts: 3,

          backoff: {
            type: "exponential",
            delay: 2000,
          },

          removeOnComplete: true,

          removeOnFail: false,
        }
      );

      console.log(
        "=========================================="
      );

      console.log(
        "INCIDENT ASSIGNMENT NOTIFICATION QUEUED"
      );

      console.log(
        "Incident:",
        incidentId
      );

      console.log(
        "Notification recipient:",
        userId
      );

      console.log(
        "=========================================="
      );
    } catch (error: any) {
      console.error(
        "Failed to queue incident assignment notification:",
        error?.message || error
      );
    }
  };

// ==========================================
// CREATE INCIDENT
// ==========================================

export const createIncident = async (
  data: CreateIncidentData
) => {
  // ==========================================
  // DUPLICATE INCIDENT CHECK
  // ==========================================

  const existingIncident =
    await Incident.findOne({
      incidentId: data.incidentId,
      organizationId: data.organizationId,
    });

  if (existingIncident) {
    throw new Error(
      "An incident with this ID already exists in this organization"
    );
  }

  // ==========================================
  // VALIDATE REPORTER
  // ==========================================

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

  // ==========================================
  // DETERMINE PRIORITY
  // ==========================================

  const incidentPriority: IncidentPriority =
    data.priority || "Medium";

  // ==========================================
  // DETERMINE SEVERITY
  // ==========================================

  const incidentSeverity: IncidentSeverity =
    data.severity || "Minor";

  // ==========================================
  // AUTOMATIC ASSIGNMENT
  // ==========================================

  let assignedTo: string | undefined;

  try {
    console.log(
      "=========================================="
    );

    console.log(
      "CHECKING INCIDENT ASSIGNMENT RULES"
    );

    console.log(
      "Incident:",
      data.incidentId
    );

    console.log(
      "Organization:",
      data.organizationId
    );

    console.log(
      "Priority:",
      incidentPriority
    );

    console.log(
      "Severity:",
      incidentSeverity
    );

    console.log(
      "=========================================="
    );

    const matchingRule =
      await findMatchingAssignmentRule(
        data.organizationId,
        incidentPriority,
        incidentSeverity
      );

    if (matchingRule) {
      console.log(
        "=========================================="
      );

      console.log(
        "INCIDENT ASSIGNMENT RULE MATCHED"
      );

      console.log(
        "Rule:",
        matchingRule.name
      );

      console.log(
        "Rule Order:",
        matchingRule.ruleOrder
      );

      console.log(
        "Target User:",
        matchingRule.targetUser
      );

      console.log(
        "=========================================="
      );

      // ========================================
      // EXTRACT TARGET USER ID CORRECTLY
      // ========================================

      const targetUserId =
        getTargetUserId(
          matchingRule.targetUser
        );

      if (targetUserId) {
        // --------------------------------------
        // Make sure the target employee still
        // exists and belongs to this organization.
        // --------------------------------------

        const targetEmployee =
          await AuthUser.findOne({
            _id: targetUserId,

            organizationId:
              data.organizationId,

            role: "employee",

            isActive: true,
          });

        if (!targetEmployee) {
          console.warn(
            "Assignment rule matched, but target employee is invalid."
          );

          assignedTo = undefined;
        } else {
          // IMPORTANT:
          // Store only the ObjectId string.
          //
          // Do NOT store the populated targetUser
          // object in Incident.assignedTo.

          assignedTo =
            targetEmployee._id.toString();

          console.log(
            "AUTOMATIC ASSIGNMENT SUCCESSFUL"
          );

          console.log(
            "Assigned employee:",
            targetEmployee.name
          );

          console.log(
            "Assigned employee ID:",
            assignedTo
          );
        }
      }
    } else {
      console.log(
        `No assignment rule matched incident ${data.incidentId}`
      );
    }
  } catch (error: any) {
    // ==========================================
    // IMPORTANT
    // ==========================================
    //
    // Assignment rule problems must NOT prevent
    // incident creation.
    //

    console.error(
      "Failed to apply incident assignment rule:",
      error?.message || error
    );

    assignedTo = undefined;
  }

  // ==========================================
  // CREATE INCIDENT
  // ==========================================

  const incident = await Incident.create({
    incidentId: data.incidentId,

    title: data.title,

    description: data.description,

    priority: incidentPriority,

    severity: incidentSeverity,

    status: "Open",

    reportedBy: data.reportedBy,

    // This is now guaranteed to be an ObjectId
    // string, not a populated object.
    assignedTo,

    organizationId:
      data.organizationId,
  });

  // ==========================================
  // AUTOMATIC ASSIGNMENT NOTIFICATION
  // ==========================================

  if (assignedTo) {
    await queueIncidentAssignmentNotification(
      assignedTo,

      data.organizationId,

      incident.incidentId,

      incident._id.toString(),

      incident.priority,

      `Incident ${incident.incidentId} has been automatically assigned to you.`
    );
  }

  // ==========================================
  // RETURN POPULATED INCIDENT
  // ==========================================

  return Incident.findById(
    incident._id
  )
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
// GET ALL INCIDENTS
// ==========================================

export const getIncidentsByOrganization =
  async (
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
  // ==========================================
  // FIND EXISTING INCIDENT
  // ==========================================

  const existingIncident =
    await Incident.findOne({
      _id: id,
      organizationId,
    });

  if (!existingIncident) {
    return null;
  }

  // ==========================================
  // REMEMBER PREVIOUS ASSIGNEE
  // ==========================================

  const previousAssignedTo =
    existingIncident.assignedTo
      ? existingIncident.assignedTo.toString()
      : undefined;

  // ==========================================
  // PREPARE UPDATE DATA
  // ==========================================

  const updateData: Record<string, any> = {
    ...data,
  };

  // ==========================================
  // ASSIGNMENT VALIDATION
  // ==========================================

  let assignedEmployee: any = null;

  if (
    data.assignedTo !== undefined &&
    data.assignedTo !== null &&
    data.assignedTo !== ""
  ) {
    assignedEmployee =
      await AuthUser.findOne({
        _id: data.assignedTo,

        organizationId,

        isActive: true,
      });

    if (!assignedEmployee) {
      throw new Error(
        "Assigned user does not belong to this organization"
      );
    }

    if (
      assignedEmployee.role !==
      "employee"
    ) {
      throw new Error(
        "Incidents can only be assigned to employees"
      );
    }

    // Store ObjectId only.
    updateData.assignedTo =
      assignedEmployee._id;
  }

  // ==========================================
  // OPTIONAL UNASSIGN
  // ==========================================

  if (
    data.assignedTo === null ||
    data.assignedTo === ""
  ) {
    updateData.assignedTo = null;
  }

  // ==========================================
  // RESOLUTION TRACKING
  // ==========================================

  if (data.status === "Resolved") {
    if (
      !data.resolution ||
      data.resolution.trim() === ""
    ) {
      throw new Error(
        "Resolution is required when resolving an incident"
      );
    }

    updateData.resolvedAt =
      existingIncident.resolvedAt ||
      new Date();
  }

  // ==========================================
  // CLOSED INCIDENT
  // ==========================================

  if (data.status === "Closed") {
    updateData.closedAt =
      existingIncident.closedAt ||
      new Date();

    // If the incident is closed without
    // previously being resolved, mark the
    // resolution timestamp as well.

    if (!existingIncident.resolvedAt) {
      updateData.resolvedAt =
        new Date();
    }
  }

  // ==========================================
  // UPDATE INCIDENT
  // ==========================================

  const incident =
    await Incident.findOneAndUpdate(
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
      sla.respondedAt =
        new Date();
    }

    // ----------------------------------------
    // INCIDENT RESOLVED
    // ----------------------------------------

    if (
      data.status === "Resolved" &&
      !sla.resolvedAt
    ) {
      sla.resolvedAt =
        new Date();

      sla.status =
        "Completed";
    }

    // ----------------------------------------
    // INCIDENT CLOSED
    // ----------------------------------------

    if (
      data.status === "Closed" &&
      !sla.resolvedAt
    ) {
      sla.resolvedAt =
        new Date();

      sla.status =
        "Completed";
    }

    await sla.save();
  }

  // ==========================================
  // DETERMINE WHETHER ASSIGNMENT CHANGED
  // ==========================================

  const newAssignedTo =
    assignedEmployee
      ? assignedEmployee._id.toString()
      : undefined;

  const isNewAssignment =
    Boolean(newAssignedTo) &&
    previousAssignedTo !==
      newAssignedTo;

  // ==========================================
  // MANUAL ASSIGNMENT NOTIFICATION
  // ==========================================

  if (
    isNewAssignment &&
    assignedEmployee
  ) {
    await queueIncidentAssignmentNotification(
      assignedEmployee._id.toString(),

      organizationId,

      incident.incidentId,

      incident._id.toString(),

      incident.priority,

      `Incident ${incident.incidentId} has been assigned to you.`
    );
  }

  // ==========================================
  // RETURN UPDATED INCIDENT
  // ==========================================

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