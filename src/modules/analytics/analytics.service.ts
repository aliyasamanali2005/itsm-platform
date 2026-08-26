import mongoose from "mongoose";

import Incident from "../incident/incident.model";
import Problem from "../problem/problem.model";
import ServiceRequest from "../service-request/serviceRequest.model";
import SLA from "../sla/sla.model";

import {
  AnalyticsOverview,
  IncidentAnalytics,
  ProblemAnalytics,
  ServiceRequestAnalytics,
  SLAAnalytics,
  CountBreakdown,
  IncidentTimeSeries,
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
// BUILD EMPTY DATE RANGE
// ==========================================

const getLast30Days = (): string[] => {
  const dates: string[] = [];

  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);

    date.setHours(0, 0, 0, 0);

    date.setDate(
      today.getDate() - i
    );

    dates.push(
      date.toISOString().split("T")[0]
    );
  }

  return dates;
};

// ==========================================
// INCIDENT ANALYTICS
// ==========================================

const getIncidentAnalytics = async (
  organizationId: string
): Promise<IncidentAnalytics> => {
  const orgId =
    validateOrganizationId(organizationId);

  // ==========================================
  // BASIC COUNTS
  // ==========================================

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

  // ==========================================
  // PRIORITY BREAKDOWN
  // ==========================================

  const priorityAggregation =
    await Incident.aggregate([
      {
        $match: {
          organizationId: orgId,
        },
      },

      {
        $group: {
          _id: "$priority",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

  const byPriority: CountBreakdown = {};

  priorityAggregation.forEach(
    (item) => {
      byPriority[item._id] = item.count;
    }
  );

  // ==========================================
  // SEVERITY BREAKDOWN
  // ==========================================

  const severityAggregation =
    await Incident.aggregate([
      {
        $match: {
          organizationId: orgId,
        },
      },

      {
        $group: {
          _id: "$severity",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

  const bySeverity: CountBreakdown = {};

  severityAggregation.forEach(
    (item) => {
      bySeverity[item._id] = item.count;
    }
  );

  // ==========================================
  // STATUS BREAKDOWN
  // ==========================================

  const statusAggregation =
    await Incident.aggregate([
      {
        $match: {
          organizationId: orgId,
        },
      },

      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

  const byStatus: CountBreakdown = {};

  statusAggregation.forEach(
    (item) => {
      byStatus[item._id] = item.count;
    }
  );

  // ==========================================
  // AVERAGE RESOLUTION TIME
  // ==========================================

  const resolutionAggregation =
    await Incident.aggregate([
      {
        $match: {
          organizationId: orgId,

          resolvedAt: {
            $exists: true,
            $ne: null,
          },
        },
      },

      {
        $project: {
          resolutionTime: {
            $subtract: [
              "$resolvedAt",
              "$createdAt",
            ],
          },
        },
      },

      {
        $group: {
          _id: null,

          averageResolutionTime: {
            $avg: "$resolutionTime",
          },
        },
      },
    ]);

  const averageResolutionTimeMs =
    resolutionAggregation.length > 0
      ? resolutionAggregation[0]
          .averageResolutionTime
      : 0;

  const averageResolutionTimeMinutes =
    Math.round(
      averageResolutionTimeMs /
        (1000 * 60)
    );

  const averageResolutionTimeHours =
    Number(
      (
        averageResolutionTimeMinutes /
        60
      ).toFixed(2)
    );

  // ==========================================
  // INCIDENTS OVER LAST 30 DAYS
  // ==========================================

  const startDate = new Date();

  startDate.setHours(0, 0, 0, 0);

  startDate.setDate(
    startDate.getDate() - 29
  );

  const timeSeriesAggregation =
    await Incident.aggregate([
      {
        $match: {
          organizationId: orgId,

          createdAt: {
            $gte: startDate,
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

  const timeSeriesMap: Record<
    string,
    number
  > = {};

  timeSeriesAggregation.forEach(
    (item) => {
      timeSeriesMap[item._id] =
        item.count;
    }
  );

  const dates = getLast30Days();

  const overTime: IncidentTimeSeries[] =
    dates.map((date) => ({
      date,
      count:
        timeSeriesMap[date] || 0,
    }));

  // ==========================================
  // RETURN INCIDENT ANALYTICS
  // ==========================================

  return {
    total,

    open,
    inProgress,
    pending,
    resolved,
    closed,

    critical,
    highPriority,

    byPriority,
    bySeverity,
    byStatus,

    averageResolutionTimeMinutes,
    averageResolutionTimeHours,

    overTime,
  };
};

// ==========================================
// PROBLEM ANALYTICS
// ==========================================

const getProblemAnalytics = async (
  organizationId: string
): Promise<ProblemAnalytics> => {
  const orgId =
    validateOrganizationId(organizationId);

  // ==========================================
  // BASIC COUNTS
  // ==========================================

  const [
    total,
    open,
    underInvestigation,
    knownError,
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
      status: "Under Investigation",
    }),

    Problem.countDocuments({
      organizationId: orgId,
      status: "Known Error",
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

  // ==========================================
  // PRIORITY BREAKDOWN
  // ==========================================

  const priorityAggregation =
    await Problem.aggregate([
      {
        $match: {
          organizationId: orgId,
        },
      },

      {
        $group: {
          _id: "$priority",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

  const byPriority: CountBreakdown = {};

  priorityAggregation.forEach(
    (item) => {
      byPriority[item._id] =
        item.count;
    }
  );

  // ==========================================
  // STATUS BREAKDOWN
  // ==========================================

  const statusAggregation =
    await Problem.aggregate([
      {
        $match: {
          organizationId: orgId,
        },
      },

      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

  const byStatus: CountBreakdown = {};

  statusAggregation.forEach(
    (item) => {
      byStatus[item._id] =
        item.count;
    }
  );

  // ==========================================
  // RETURN
  // ==========================================

  return {
    total,

    open,
    underInvestigation,
    knownError,
    resolved,
    closed,

    highPriority,

    byPriority,
    byStatus,
  };
};

// ==========================================
// SERVICE REQUEST ANALYTICS
// ==========================================

const getServiceRequestAnalytics =
  async (
    organizationId: string
  ): Promise<ServiceRequestAnalytics> => {
    const orgId =
      validateOrganizationId(
        organizationId
      );

    // ========================================
    // BASIC COUNTS
    // ========================================

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

    // ========================================
    // PRIORITY BREAKDOWN
    // ========================================

    const priorityAggregation =
      await ServiceRequest.aggregate([
        {
          $match: {
            organizationId: orgId,
          },
        },

        {
          $group: {
            _id: "$priority",
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const byPriority: CountBreakdown =
      {};

    priorityAggregation.forEach(
      (item) => {
        byPriority[item._id] =
          item.count;
      }
    );

    // ========================================
    // TYPE BREAKDOWN
    // ========================================

    const typeAggregation =
      await ServiceRequest.aggregate([
        {
          $match: {
            organizationId: orgId,
          },
        },

        {
          $group: {
            _id: "$type",
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const byType: CountBreakdown = {};

    typeAggregation.forEach(
      (item) => {
        byType[item._id] =
          item.count;
      }
    );

    // ========================================
    // STATUS BREAKDOWN
    // ========================================

    const statusAggregation =
      await ServiceRequest.aggregate([
        {
          $match: {
            organizationId: orgId,
          },
        },

        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const byStatus: CountBreakdown =
      {};

    statusAggregation.forEach(
      (item) => {
        byStatus[item._id] =
          item.count;
      }
    );

    // ========================================
    // RETURN
    // ========================================

    return {
      total,

      pending,
      approved,
      inProgress,
      completed,
      rejected,
      cancelled,

      byPriority,
      byType,
      byStatus,
    };
  };

// ==========================================
// SLA ANALYTICS
// ==========================================

const getSLAAnalytics = async (
  organizationId: string
): Promise<SLAAnalytics> => {
  const orgId =
    validateOrganizationId(organizationId);

  // ==========================================
  // BASIC COUNTS
  // ==========================================

  const [
    total,
    active,
    completed,
    responseBreached,
    resolutionBreached,
  ] = await Promise.all([
    SLA.countDocuments({
      organizationId: orgId,
    }),

    SLA.countDocuments({
      organizationId: orgId,
      status: "Active",
    }),

    SLA.countDocuments({
      organizationId: orgId,
      status: "Completed",
    }),

    SLA.countDocuments({
      organizationId: orgId,
      responseBreached: true,
    }),

    SLA.countDocuments({
      organizationId: orgId,
      resolutionBreached: true,
    }),
  ]);

  // ==========================================
  // TOTAL BREACHED
  // ==========================================

  const totalBreached =
    await SLA.countDocuments({
      organizationId: orgId,

      $or: [
        {
          responseBreached: true,
        },
        {
          resolutionBreached: true,
        },
      ],
    });

  // ==========================================
  // COMPLIANCE
  // ==========================================

  const compliant =
    Math.max(
      total - totalBreached,
      0
    );

  const complianceRate =
    total > 0
      ? Number(
          (
            (compliant / total) *
            100
          ).toFixed(2)
        )
      : 100;

  // ==========================================
  // RETURN
  // ==========================================

  return {
    total,

    active,
    completed,

    responseBreached,
    resolutionBreached,

    totalBreached,
    compliant,

    complianceRate,
  };
};

// ==========================================
// ANALYTICS OVERVIEW
// ==========================================

export const getAnalyticsOverview =
  async (
    organizationId: string
  ): Promise<AnalyticsOverview> => {
    const [
      incidents,
      problems,
      serviceRequests,
      sla,
    ] = await Promise.all([
      getIncidentAnalytics(
        organizationId
      ),

      getProblemAnalytics(
        organizationId
      ),

      getServiceRequestAnalytics(
        organizationId
      ),

      getSLAAnalytics(
        organizationId
      ),
    ]);

    return {
      incidents,
      problems,
      serviceRequests,
      sla,
    };
  };