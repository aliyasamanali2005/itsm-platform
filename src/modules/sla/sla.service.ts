import SLA, { SLAPriority } from "./sla.model";
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
// CREATE SLA FOR INCIDENT
// ==========================================

export const createSLAForIncident = async (
  incidentId: string,
  organizationId: string
) => {
  const incident = await Incident.findOne({
    _id: incidentId,
    organizationId,
  });

  if (!incident) {
    throw new Error("Incident not found");
  }

  const existingSLA = await SLA.findOne({
    incidentId,
    organizationId,
  });

  if (existingSLA) {
    throw new Error(
      "An SLA already exists for this incident"
    );
  }

  const priority = incident.priority as SLAPriority;

  const rule = SLA_RULES[priority];

  if (!rule) {
    throw new Error(
      "No SLA rule configured for this priority"
    );
  }

  const now = new Date();

  const responseDueAt = new Date(
    now.getTime() +
      rule.responseTimeMinutes * 60 * 1000
  );

  const resolutionDueAt = new Date(
    now.getTime() +
      rule.resolutionTimeMinutes * 60 * 1000
  );

  return SLA.create({
    incidentId: incident._id,
    organizationId: incident.organizationId,
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
  });
};

// ==========================================
// GET SLA BY INCIDENT
// ==========================================

export const getSLAByIncident = async (
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

export const getSLAsByOrganization = async (
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

export const checkSLABreach = async (
  slaId: string,
  organizationId: string
) => {
  const sla = await SLA.findOne({
    _id: slaId,
    organizationId,
  });

  if (!sla) {
    throw new Error("SLA not found");
  }

  const incident = await Incident.findOne({
    _id: sla.incidentId,
    organizationId,
  });

  if (!incident) {
    throw new Error("Incident not found");
  }

  const now = new Date();

  let responseBreached =
    sla.responseBreached;

  let resolutionBreached =
    sla.resolutionBreached;

  // ==========================================
  // RESPONSE BREACH
  // ==========================================

  if (
    !sla.respondedAt &&
    now > sla.responseDueAt
  ) {
    responseBreached = true;
  }

  // ==========================================
  // RESOLUTION BREACH
  // ==========================================

  if (
    !sla.resolvedAt &&
    now > sla.resolutionDueAt &&
    incident.status !== "Resolved" &&
    incident.status !== "Closed"
  ) {
    resolutionBreached = true;
  }

  // ==========================================
  // DETERMINE STATUS
  // ==========================================

  let status = sla.status;

  if (resolutionBreached) {
    status = "Resolution Breached";
  } else if (responseBreached) {
    status = "Response Breached";
  } else if (
    incident.status === "Resolved" ||
    incident.status === "Closed"
  ) {
    status = "Completed";
  } else {
    status = "Active";
  }

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

export const recordSLAResponse = async (
  slaId: string,
  organizationId: string
) => {
  const sla = await SLA.findOne({
    _id: slaId,
    organizationId,
  });

  if (!sla) {
    throw new Error("SLA not found");
  }

  if (sla.respondedAt) {
    return sla;
  }

  const respondedAt = new Date();

  return SLA.findOneAndUpdate(
    {
      _id: slaId,
      organizationId,
    },
    {
      respondedAt,
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

export const recordSLAResolution = async (
  slaId: string,
  organizationId: string
) => {
  const sla = await SLA.findOne({
    _id: slaId,
    organizationId,
  });

  if (!sla) {
    throw new Error("SLA not found");
  }

  if (sla.resolvedAt) {
    return sla;
  }

  const resolvedAt = new Date();

  return SLA.findOneAndUpdate(
    {
      _id: slaId,
      organizationId,
    },
    {
      resolvedAt,
      status: "Completed",
    },
    {
      new: true,
      runValidators: true,
    }
  );
};