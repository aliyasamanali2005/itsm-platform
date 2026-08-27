import mongoose from "mongoose";

import { authRepository } from "../auth/auth.repository";
import { incidentRepository } from "../incident/incident.repository";
import { assetRepository } from "../asset/asset.repository";
import { changeRepository } from "../change/change.repository";

// ==========================================
// TYPES
// ==========================================

export interface TechnicianPerformance {
  technicianId: string;
  technicianName: string;
  email: string;

  totalAssigned: number;
  openIncidents: number;
  inProgressIncidents: number;
  resolvedIncidents: number;
  closedIncidents: number;

  totalResolvedOrClosed: number;
  resolutionRate: number;

  averageResolutionTimeHours: number | null;
}

export interface AssetHealthAnalytics {
  totalAssets: number;

  available: number;
  assigned: number;
  maintenance: number;
  retired: number;

  activeAssets: number;
  healthyAssets: number;

  healthRate: number;
  maintenanceRate: number;
  retiredRate: number;
}

export interface ChangeSuccessRateAnalytics {
  totalChanges: number;

  completed: number;
  failed: number;
  cancelled: number;

  successfulChanges: number;
  unsuccessfulChanges: number;
  evaluatedChanges: number;
  unevaluatedChanges: number;

  successRate: number;
  failureRate: number;
}

// ==========================================
// VALIDATE ORGANIZATION ID
// ==========================================

const validateOrganizationId = (organizationId: string) => {
  if (
    !organizationId ||
    !mongoose.Types.ObjectId.isValid(organizationId)
  ) {
    throw new Error("Invalid organization ID");
  }
};

// ==========================================
// ROUND PERCENTAGE
// ==========================================

const percentage = (
  numerator: number,
  denominator: number
): number => {
  if (denominator === 0) {
    return 0;
  }

  return Number(
    ((numerator / denominator) * 100).toFixed(2)
  );
};

// ==========================================
// TECHNICIAN PERFORMANCE
// ==========================================

export const getTechnicianPerformance = async (
  organizationId: string
): Promise<TechnicianPerformance[]> => {
  validateOrganizationId(organizationId);

  /*
   * Only active employees are technicians.
   *
   * Admins are intentionally excluded because
   * incidents are only assignable to employees.
   */

  const technicians =
    await authRepository.findActiveEmployeesByOrganization(
      organizationId
    );

  const results: TechnicianPerformance[] = [];

  /*
   * Each technician's incidents are retrieved
   * through the repository layer.
   *
   * This keeps database access out of the
   * analytics service.
   */

  for (const technician of technicians) {
    const incidents =
      await incidentRepository.findByTechnician(
        organizationId,
        technician._id.toString()
      );

    const totalAssigned = incidents.length;

    const openIncidents = incidents.filter(
      (incident) =>
        incident.status === "Open"
    ).length;

    const inProgressIncidents = incidents.filter(
      (incident) =>
        incident.status === "In Progress"
    ).length;

    const resolvedIncidents = incidents.filter(
      (incident) =>
        incident.status === "Resolved"
    ).length;

    const closedIncidents = incidents.filter(
      (incident) =>
        incident.status === "Closed"
    ).length;

    const completedIncidents = incidents.filter(
      (incident) =>
        incident.status === "Resolved" ||
        incident.status === "Closed"
    );

    const totalResolvedOrClosed =
      completedIncidents.length;

    const resolutionRate = percentage(
      totalResolvedOrClosed,
      totalAssigned
    );

    // ========================================
    // AVERAGE RESOLUTION TIME
    // ========================================

    const resolutionTimes = completedIncidents
      .map((incident) => {
        /*
         * Prefer resolvedAt.
         *
         * For incidents closed without a
         * previous resolution timestamp,
         * closedAt is used as the completion
         * timestamp.
         */

        const endDate =
          incident.resolvedAt ??
          incident.closedAt;

        if (!endDate) {
          return null;
        }

        const start = new Date(
          incident.createdAt
        ).getTime();

        const end = new Date(
          endDate
        ).getTime();

        if (
          !Number.isFinite(start) ||
          !Number.isFinite(end) ||
          end <= start
        ) {
          return null;
        }

        return (
          (end - start) /
          (1000 * 60 * 60)
        );
      })
      .filter(
        (
          value
        ): value is number =>
          value !== null
      );

    const averageResolutionTimeHours =
      resolutionTimes.length === 0
        ? null
        : Number(
            (
              resolutionTimes.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) /
              resolutionTimes.length
            ).toFixed(2)
          );

    results.push({
      technicianId:
        technician._id.toString(),

      technicianName:
        technician.name,

      email:
        technician.email,

      totalAssigned,

      openIncidents,

      inProgressIncidents,

      resolvedIncidents,

      closedIncidents,

      totalResolvedOrClosed,

      resolutionRate,

      averageResolutionTimeHours,
    });
  }

  /*
   * Highest resolution rate first.
   *
   * If two technicians have the same rate,
   * the one with more resolved/closed incidents
   * comes first.
   */

  return results.sort(
    (a, b) =>
      b.resolutionRate -
        a.resolutionRate ||
      b.totalResolvedOrClosed -
        a.totalResolvedOrClosed
  );
};

// ==========================================
// ASSET HEALTH
// ==========================================

export const getAssetHealth = async (
  organizationId: string
): Promise<AssetHealthAnalytics> => {
  validateOrganizationId(organizationId);

  const assets =
    await assetRepository.findByOrganization(
      organizationId
    );

  const totalAssets = assets.length;

  const available = assets.filter(
    (asset) =>
      asset.status === "Available"
  ).length;

  const assigned = assets.filter(
    (asset) =>
      asset.status === "Assigned"
  ).length;

  const maintenance = assets.filter(
    (asset) =>
      asset.status === "Maintenance"
  ).length;

  const retired = assets.filter(
    (asset) =>
      asset.status === "Retired"
  ).length;

  /*
   * Active assets are assets currently
   * available for use or assigned to users.
   */

  const activeAssets =
    available + assigned;

  /*
   * Healthy assets are active assets.
   *
   * Maintenance and retired assets are
   * considered unhealthy/inactive.
   */

  const healthyAssets =
    activeAssets;

  const healthRate = percentage(
    healthyAssets,
    totalAssets
  );

  const maintenanceRate = percentage(
    maintenance,
    totalAssets
  );

  const retiredRate = percentage(
    retired,
    totalAssets
  );

  return {
    totalAssets,

    available,

    assigned,

    maintenance,

    retired,

    activeAssets,

    healthyAssets,

    healthRate,

    maintenanceRate,

    retiredRate,
  };
};

// ==========================================
// CHANGE SUCCESS RATE
// ==========================================

export const getChangeSuccessRate = async (
  organizationId: string
): Promise<ChangeSuccessRateAnalytics> => {
  validateOrganizationId(organizationId);

  const changes =
    await changeRepository.findByOrganization(
      organizationId
    );

  const totalChanges = changes.length;

  const completed = changes.filter(
    (change) =>
      change.status === "Completed"
  ).length;

  const failed = changes.filter(
    (change) =>
      change.status === "Failed"
  ).length;

  const cancelled = changes.filter(
    (change) =>
      change.status === "Cancelled"
  ).length;

  /*
   * Completed changes are successful.
   */

  const successfulChanges =
    completed;

  /*
   * Failed and cancelled changes are
   * unsuccessful.
   */

  const unsuccessfulChanges =
    failed + cancelled;

  /*
   * Only completed, failed, and cancelled
   * changes have a final outcome.
   */

  const evaluatedChanges =
    successfulChanges +
    unsuccessfulChanges;

  /*
   * Draft, Pending Approval, Approved,
   * Scheduled, In Progress, and Rejected
   * changes are not yet counted as a
   * success/failure outcome.
   */

  const unevaluatedChanges =
    totalChanges -
    evaluatedChanges;

  const successRate = percentage(
    successfulChanges,
    evaluatedChanges
  );

  const failureRate = percentage(
    unsuccessfulChanges,
    evaluatedChanges
  );

  return {
    totalChanges,

    completed,

    failed,

    cancelled,

    successfulChanges,

    unsuccessfulChanges,

    evaluatedChanges,

    unevaluatedChanges,

    successRate,

    failureRate,
  };
};