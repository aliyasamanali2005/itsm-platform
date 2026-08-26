import SLA, {
  SLAPriority,
  SLABusinessHours,
} from "./sla.model";

import Incident from "../incident/incident.model";

// ==========================================
// SLA RULES
// ==========================================

const SLA_RULES: Record<
  SLAPriority,
  {
    responseTimeMinutes: number;
    resolutionTimeMinutes: number;
  }
> = {
  Critical: {
    responseTimeMinutes: 15,
    resolutionTimeMinutes: 120,
  },

  High: {
    responseTimeMinutes: 30,
    resolutionTimeMinutes: 240,
  },

  Medium: {
    responseTimeMinutes: 120,
    resolutionTimeMinutes: 480,
  },

  Low: {
    responseTimeMinutes: 240,
    resolutionTimeMinutes: 1440,
  },
};

// ==========================================
// DEFAULT BUSINESS HOURS
// ==========================================
//
// Monday-Friday
// 09:00 - 17:00
// Asia/Karachi
//
// JavaScript day:
// 0 = Sunday
// 1 = Monday
// 2 = Tuesday
// 3 = Wednesday
// 4 = Thursday
// 5 = Friday
// 6 = Saturday
// ==========================================

const DEFAULT_BUSINESS_HOURS: SLABusinessHours = {
  timezone: "Asia/Karachi",

  startHour: 9,
  startMinute: 0,

  endHour: 17,
  endMinute: 0,

  workingDays: [1, 2, 3, 4, 5],
};

// ==========================================
// GET BUSINESS DAY
// ==========================================

const isBusinessDay = (
  date: Date,
  businessHours: SLABusinessHours
): boolean => {
  const day = date.getDay();

  return businessHours.workingDays.includes(
    day
  );
};

// ==========================================
// GET START OF BUSINESS DAY
// ==========================================

const getBusinessStart = (
  date: Date,
  businessHours: SLABusinessHours
): Date => {
  const result = new Date(date);

  result.setHours(
    businessHours.startHour,
    businessHours.startMinute,
    0,
    0
  );

  return result;
};

// ==========================================
// GET END OF BUSINESS DAY
// ==========================================

const getBusinessEnd = (
  date: Date,
  businessHours: SLABusinessHours
): Date => {
  const result = new Date(date);

  result.setHours(
    businessHours.endHour,
    businessHours.endMinute,
    0,
    0
  );

  return result;
};

// ==========================================
// MOVE TO NEXT BUSINESS DAY
// ==========================================

const moveToNextBusinessDay = (
  date: Date,
  businessHours: SLABusinessHours
): Date => {
  const result = new Date(date);

  result.setDate(result.getDate() + 1);

  result.setHours(
    businessHours.startHour,
    businessHours.startMinute,
    0,
    0
  );

  while (
    !isBusinessDay(
      result,
      businessHours
    )
  ) {
    result.setDate(
      result.getDate() + 1
    );
  }

  return result;
};

// ==========================================
// NORMALIZE TO BUSINESS TIME
// ==========================================
//
// If timestamp is:
// - before business hours -> move to start
// - after business hours -> next business day
// - weekend -> next business day
// - inside business hours -> unchanged
// ==========================================

const normalizeToBusinessTime = (
  date: Date,
  businessHours: SLABusinessHours
): Date => {
  let result = new Date(date);

  while (
    !isBusinessDay(
      result,
      businessHours
    )
  ) {
    result = moveToNextBusinessDay(
      result,
      businessHours
    );
  }

  const start = getBusinessStart(
    result,
    businessHours
  );

  const end = getBusinessEnd(
    result,
    businessHours
  );

  if (result < start) {
    return start;
  }

  if (result >= end) {
    return moveToNextBusinessDay(
      result,
      businessHours
    );
  }

  return result;
};

// ==========================================
// ADD BUSINESS MINUTES
// ==========================================
//
// Adds only working/business minutes.
// Weekends and non-working hours are skipped.
// ==========================================

const addBusinessMinutes = (
  startDate: Date,
  minutes: number,
  businessHours: SLABusinessHours
): Date => {
  let current =
    normalizeToBusinessTime(
      startDate,
      businessHours
    );

  let remainingMinutes = minutes;

  while (remainingMinutes > 0) {
    const businessEnd =
      getBusinessEnd(
        current,
        businessHours
      );

    const availableMilliseconds =
      businessEnd.getTime() -
      current.getTime();

    const availableMinutes =
      availableMilliseconds /
      (1000 * 60);

    if (
      remainingMinutes <=
      availableMinutes
    ) {
      current = new Date(
        current.getTime() +
          remainingMinutes *
            60 *
            1000
      );

      remainingMinutes = 0;

      break;
    }

    remainingMinutes -=
      availableMinutes;

    current =
      moveToNextBusinessDay(
        current,
        businessHours
      );
  }

  return current;
};

// ==========================================
// CREATE SLA FOR INCIDENT
// ==========================================

export const createSLAForIncident =
  async (
    incidentId: string,
    organizationId: string
  ) => {
    const incident =
      await Incident.findOne({
        _id: incidentId,
        organizationId,
      });

    if (!incident) {
      throw new Error(
        "Incident not found"
      );
    }

    // ========================================
    // CHECK EXISTING SLA
    // ========================================

    const existingSLA =
      await SLA.findOne({
        incidentId,
        organizationId,
      });

    if (existingSLA) {
      throw new Error(
        "An SLA already exists for this incident"
      );
    }

    // ========================================
    // GET PRIORITY
    // ========================================

    const priority =
      incident.priority as SLAPriority;

    const rule =
      SLA_RULES[priority];

    if (!rule) {
      throw new Error(
        "No SLA rule configured for this priority"
      );
    }

    // ========================================
    // BUSINESS HOURS
    // ========================================

    const businessHours: SLABusinessHours = {
      ...DEFAULT_BUSINESS_HOURS,
      workingDays: [
        ...DEFAULT_BUSINESS_HOURS.workingDays,
      ],
    };

    // ========================================
    // SLA START TIME
    // ========================================

    const now = new Date();

    // ========================================
    // CALCULATE BUSINESS DEADLINES
    // ========================================

    const responseDueAt =
      addBusinessMinutes(
        now,
        rule.responseTimeMinutes,
        businessHours
      );

    const resolutionDueAt =
      addBusinessMinutes(
        now,
        rule.resolutionTimeMinutes,
        businessHours
      );

    // ========================================
    // CREATE SLA
    // ========================================

    return SLA.create({
      incidentId: incident._id,

      organizationId:
        incident.organizationId,

      priority,

      responseTimeMinutes:
        rule.responseTimeMinutes,

      resolutionTimeMinutes:
        rule.resolutionTimeMinutes,

      responseDueAt,

      resolutionDueAt,

      status: "Active",

      responseBreached: false,

      resolutionBreached: false,

      businessHours,
    });
  };

// ==========================================
// GET SLA BY INCIDENT
// ==========================================

export const getSLAByIncident =
  async (
    incidentId: string,
    organizationId: string
  ) => {
    return SLA.findOne({
      incidentId,
      organizationId,
    }).populate(
      "incidentId",
      "incidentId title priority severity status"
    );
  };

// ==========================================
// GET ALL SLAS
// ==========================================

export const getSLAsByOrganization =
  async (
    organizationId: string
  ) => {
    return SLA.find({
      organizationId,
    })
      .populate(
        "incidentId",
        "incidentId title priority severity status"
      )
      .sort({
        createdAt: -1,
      });
  };

// ==========================================
// CHECK SLA BREACH
// ==========================================

export const checkSLABreach =
  async (
    slaId: string,
    organizationId: string
  ) => {
    const sla =
      await SLA.findOne({
        _id: slaId,
        organizationId,
      });

    if (!sla) {
      throw new Error(
        "SLA not found"
      );
    }

    const incident =
      await Incident.findOne({
        _id: sla.incidentId,
        organizationId,
      });

    if (!incident) {
      throw new Error(
        "Incident not found"
      );
    }

    const now = new Date();

    let responseBreached =
      sla.responseBreached;

    let resolutionBreached =
      sla.resolutionBreached;

    // ========================================
    // RESPONSE BREACH
    // ========================================

    if (
      !sla.respondedAt &&
      now > sla.responseDueAt
    ) {
      responseBreached = true;
    }

    // ========================================
    // RESOLUTION BREACH
    // ========================================

    if (
      !sla.resolvedAt &&
      now > sla.resolutionDueAt &&
      incident.status !== "Resolved" &&
      incident.status !== "Closed"
    ) {
      resolutionBreached = true;
    }

    // ========================================
    // DETERMINE STATUS
    // ========================================

    let status =
      sla.status;

    if (resolutionBreached) {
      status =
        "Resolution Breached";
    } else if (responseBreached) {
      status =
        "Response Breached";
    } else if (
      incident.status ===
        "Resolved" ||
      incident.status ===
        "Closed"
    ) {
      status =
        "Completed";
    } else {
      status = "Active";
    }

    // ========================================
    // UPDATE
    // ========================================

    return SLA.findOneAndUpdate(
      {
        _id: slaId,
        organizationId,
      },
      {
        responseBreached,

        resolutionBreached,

        status,
      },
      {
        new: true,

        runValidators: true,
      }
    );
  };

// ==========================================
// RECORD RESPONSE
// ==========================================

export const recordSLAResponse =
  async (
    slaId: string,
    organizationId: string
  ) => {
    const sla =
      await SLA.findOne({
        _id: slaId,
        organizationId,
      });

    if (!sla) {
      throw new Error(
        "SLA not found"
      );
    }

    // ========================================
    // IDEMPOTENCY
    // ========================================

    if (sla.respondedAt) {
      return sla;
    }

    const respondedAt =
      new Date();

    // ========================================
    // DETERMINE IF RESPONSE WAS LATE
    // ========================================

    const responseBreached =
      respondedAt >
      sla.responseDueAt;

    let status =
      sla.status;

    if (
      responseBreached
    ) {
      status =
        "Response Breached";
    }

    // ========================================
    // UPDATE
    // ========================================

    return SLA.findOneAndUpdate(
      {
        _id: slaId,
        organizationId,
      },
      {
        respondedAt,

        responseBreached,

        status,
      },
      {
        new: true,

        runValidators: true,
      }
    );
  };

// ==========================================
// RECORD RESOLUTION
// ==========================================

export const recordSLAResolution =
  async (
    slaId: string,
    organizationId: string
  ) => {
    const sla =
      await SLA.findOne({
        _id: slaId,
        organizationId,
      });

    if (!sla) {
      throw new Error(
        "SLA not found"
      );
    }

    // ========================================
    // IDEMPOTENCY
    // ========================================

    if (sla.resolvedAt) {
      return sla;
    }

    const resolvedAt =
      new Date();

    // ========================================
    // DETERMINE IF RESOLUTION WAS LATE
    // ========================================

    const resolutionBreached =
      resolvedAt >
      sla.resolutionDueAt;

    let status =
      "Completed" as
        | "Completed"
        | "Resolution Breached";

    if (
      resolutionBreached
    ) {
      status =
        "Resolution Breached";
    }

    // ========================================
    // UPDATE
    // ========================================

    return SLA.findOneAndUpdate(
      {
        _id: slaId,
        organizationId,
      },
      {
        resolvedAt,

        resolutionBreached,

        status,
      },
      {
        new: true,

        runValidators: true,
      }
    );
  };