import mongoose from "mongoose";

import Incident from "../incident/incident.model";
import Problem from "../problem/problem.model";
import ServiceRequest from "../service-request/serviceRequest.model";

import {
  AnalyticsOverview,
  IncidentAnalytics,
  ProblemAnalytics,
  ServiceRequestAnalytics,
} from "./analytics.types";

// ==========================================
// ORGANIZATION ID VALIDATION
// ==========================================

const validateOrganizationId = (
  organizationId: string
): mongoose.Types.ObjectId => {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new Error("Invalid organization ID");
  }

  return new mongoose.Types.ObjectId(organizationId);
};

// ==========================================
// INCIDENT ANALYTICS
// ==========================================

const getIncidentAnalytics = async (
  organizationId: string
): Promise<IncidentAnalytics> => {
  const orgId = validateOrganizationId(organizationId);

  const [
    total,
    open,
    inProgress,
    pending,
    resolved,
    closed,
    critical,
    highPriority,
  ] = await Promise.all([
    Incident.countDocuments({
      organizationId: orgId,
    }),

    Incident.countDocuments({
      organizationId: orgId,
      status: "Open",
    }),

    Incident.countDocuments({
      organizationId: orgId,
      status: "In Progress",
    }),

    Incident.countDocuments({
      organizationId: orgId,
      status: "Pending",
    }),

    Incident.countDocuments({
      organizationId: orgId,
      status: "Resolved",
    }),

    Incident.countDocuments({
      organizationId: orgId,
      status: "Closed",
    }),

    Incident.countDocuments({
      organizationId: orgId,
      severity: "Critical",
    }),

    Incident.countDocuments({
      organizationId: orgId,
      priority: "High",
    }),
  ]);

  return {
    total,
    open,
    inProgress,
    pending,
    resolved,
    closed,
    critical,
    highPriority,
  };
};

// ==========================================
// PROBLEM ANALYTICS
// ==========================================

const getProblemAnalytics = async (
  organizationId: string
): Promise<ProblemAnalytics> => {
  const orgId = validateOrganizationId(organizationId);

  const [
    total,
    open,
    resolved,
    closed,
    highPriority,
  ] = await Promise.all([
    Problem.countDocuments({
      organizationId: orgId,
    }),

    Problem.countDocuments({
      organizationId: orgId,
      status: "Open",
    }),

    Problem.countDocuments({
      organizationId: orgId,
      status: "Resolved",
    }),

    Problem.countDocuments({
      organizationId: orgId,
      status: "Closed",
    }),

    Problem.countDocuments({
      organizationId: orgId,
      priority: "High",
    }),
  ]);

  return {
    total,
    open,
    resolved,
    closed,
    highPriority,
  };
};

// ==========================================
// SERVICE REQUEST ANALYTICS
// ==========================================

const getServiceRequestAnalytics = async (
  organizationId: string
): Promise<ServiceRequestAnalytics> => {
  const orgId = validateOrganizationId(organizationId);

  const [
    total,
    pending,
    approved,
    inProgress,
    completed,
    rejected,
    cancelled,
  ] = await Promise.all([
    ServiceRequest.countDocuments({
      organizationId: orgId,
    }),

    ServiceRequest.countDocuments({
      organizationId: orgId,
      status: "Pending",
    }),

    ServiceRequest.countDocuments({
      organizationId: orgId,
      status: "Approved",
    }),

    ServiceRequest.countDocuments({
      organizationId: orgId,
      status: "In Progress",
    }),

    ServiceRequest.countDocuments({
      organizationId: orgId,
      status: "Completed",
    }),

    ServiceRequest.countDocuments({
      organizationId: orgId,
      status: "Rejected",
    }),

    ServiceRequest.countDocuments({
      organizationId: orgId,
      status: "Cancelled",
    }),
  ]);

  return {
    total,
    pending,
    approved,
    inProgress,
    completed,
    rejected,
    cancelled,
  };
};

// ==========================================
// ANALYTICS OVERVIEW
// ==========================================

export const getAnalyticsOverview = async (
  organizationId: string
): Promise<AnalyticsOverview> => {
  const [
    incidents,
    problems,
    serviceRequests,
  ] = await Promise.all([
    getIncidentAnalytics(organizationId),
    getProblemAnalytics(organizationId),
    getServiceRequestAnalytics(organizationId),
  ]);

  return {
    incidents,
    problems,
    serviceRequests,
  };
};