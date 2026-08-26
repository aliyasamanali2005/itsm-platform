import mongoose from "mongoose";

import IncidentEscalationPolicy, {
  EscalationLevel,
  EscalationTargetType,
  IncidentPriority,
} from "./incidentEscalation.model";

// ==========================================
// TYPES
// ==========================================

interface CreatePolicyData {
  name: string;
  description?: string;
  organizationId: string;
  priority: IncidentPriority;
  escalationLevel: EscalationLevel;
  thresholdMinutes: number;
  targetType: EscalationTargetType;
  targetUser?: string;
  targetTeam?: string;
  createdBy: string;
}

interface UpdatePolicyData {
  name?: string;
  description?: string;
  priority?: IncidentPriority;
  escalationLevel?: EscalationLevel;
  thresholdMinutes?: number;
  targetType?: EscalationTargetType;
  targetUser?: string;
  targetTeam?: string;
  isActive?: boolean;
}

// ==========================================
// HELPERS
// ==========================================

const isValidObjectId = (id?: string) => {
  return !!id && mongoose.Types.ObjectId.isValid(id);
};

const validateTarget = (
  targetType: EscalationTargetType,
  targetUser?: string,
  targetTeam?: string
) => {
  if (targetType === "User") {
    if (!targetUser) {
      throw new Error(
        "targetUser is required when targetType is User"
      );
    }

    if (!isValidObjectId(targetUser)) {
      throw new Error("Invalid targetUser ID");
    }
  }

  if (targetType === "SupportTeam") {
    if (!targetTeam) {
      throw new Error(
        "targetTeam is required when targetType is SupportTeam"
      );
    }

    if (!isValidObjectId(targetTeam)) {
      throw new Error("Invalid targetTeam ID");
    }
  }
};

const validateThreshold = (
  thresholdMinutes: number
) => {
  if (
    !Number.isFinite(thresholdMinutes) ||
    thresholdMinutes < 1
  ) {
    throw new Error(
      "thresholdMinutes must be at least 1"
    );
  }
};

// ==========================================
// CREATE POLICY
// ==========================================

export const createEscalationPolicy = async (
  data: CreatePolicyData
) => {
  if (!data.name?.trim()) {
    throw new Error("Policy name is required");
  }

  validateThreshold(data.thresholdMinutes);

  validateTarget(
    data.targetType,
    data.targetUser,
    data.targetTeam
  );

  // ------------------------------------------
  // DUPLICATE POLICY CHECK
  // ------------------------------------------

  const existing =
    await IncidentEscalationPolicy.findOne({
      name: data.name.trim(),
      organizationId: data.organizationId,
    });

  if (existing) {
    throw new Error(
      "An escalation policy with this name already exists"
    );
  }

  // ------------------------------------------
  // CREATE
  // ------------------------------------------

  return IncidentEscalationPolicy.create({
    name: data.name.trim(),
    description: data.description?.trim(),
    organizationId: data.organizationId,
    priority: data.priority,
    escalationLevel: data.escalationLevel,
    thresholdMinutes: data.thresholdMinutes,
    targetType: data.targetType,

    targetUser:
      data.targetType === "User"
        ? new mongoose.Types.ObjectId(
            data.targetUser!
          )
        : undefined,

    targetTeam:
      data.targetType === "SupportTeam"
        ? new mongoose.Types.ObjectId(
            data.targetTeam!
          )
        : undefined,

    createdBy: data.createdBy,
  });
};

// ==========================================
// GET ALL POLICIES
// ==========================================

export const getEscalationPolicies = async (
  organizationId: string
) => {
  return IncidentEscalationPolicy.find({
    organizationId,
  })
    .populate(
      "createdBy",
      "name email role"
    )
    .populate(
      "targetUser",
      "name email role"
    )
    .populate(
      "targetTeam",
      "name description"
    )
    .sort({
      priority: 1,
      thresholdMinutes: 1,
      escalationLevel: 1,
    });
};

// ==========================================
// GET POLICY BY ID
// ==========================================

export const getEscalationPolicyById = async (
  policyId: string,
  organizationId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(policyId)) {
    throw new Error(
      "Invalid escalation policy ID"
    );
  }

  const policy =
    await IncidentEscalationPolicy.findOne({
      _id: policyId,
      organizationId,
    })
      .populate(
        "createdBy",
        "name email role"
      )
      .populate(
        "targetUser",
        "name email role"
      )
      .populate(
        "targetTeam",
        "name description"
      );

  if (!policy) {
    throw new Error(
      "Escalation policy not found"
    );
  }

  return policy;
};

// ==========================================
// UPDATE POLICY
// ==========================================

export const updateEscalationPolicy = async (
  policyId: string,
  organizationId: string,
  data: UpdatePolicyData
) => {
  if (!mongoose.Types.ObjectId.isValid(policyId)) {
    throw new Error(
      "Invalid escalation policy ID"
    );
  }

  // ------------------------------------------
  // FIND EXISTING POLICY
  // ------------------------------------------

  const existing =
    await IncidentEscalationPolicy.findOne({
      _id: policyId,
      organizationId,
    });

  if (!existing) {
    throw new Error(
      "Escalation policy not found"
    );
  }

  // ------------------------------------------
  // DETERMINE FINAL VALUES
  // ------------------------------------------

  const targetType =
    data.targetType ?? existing.targetType;

  const targetUser =
    data.targetUser ??
    existing.targetUser?.toString();

  const targetTeam =
    data.targetTeam ??
    existing.targetTeam?.toString();

  const thresholdMinutes =
    data.thresholdMinutes ??
    existing.thresholdMinutes;

  // ------------------------------------------
  // VALIDATION
  // ------------------------------------------

  validateThreshold(thresholdMinutes);

  validateTarget(
    targetType,
    targetUser,
    targetTeam
  );

  // ------------------------------------------
  // DUPLICATE NAME CHECK
  // ------------------------------------------

  if (
    data.name &&
    data.name.trim() !== existing.name
  ) {
    const duplicate =
      await IncidentEscalationPolicy.findOne({
        name: data.name.trim(),
        organizationId,
        _id: {
          $ne: policyId,
        },
      });

    if (duplicate) {
      throw new Error(
        "An escalation policy with this name already exists"
      );
    }
  }

  // ------------------------------------------
  // UPDATE BASIC FIELDS
  // ------------------------------------------

  if (data.name !== undefined) {
    existing.name = data.name.trim();
  }

  if (data.description !== undefined) {
    existing.description =
      data.description.trim();
  }

  if (data.priority !== undefined) {
    existing.priority = data.priority;
  }

  if (data.escalationLevel !== undefined) {
    existing.escalationLevel =
      data.escalationLevel;
  }

  existing.thresholdMinutes =
    thresholdMinutes;

  existing.targetType = targetType;

  // ------------------------------------------
  // TARGET USER / TEAM
  // ------------------------------------------

  if (targetType === "User") {
    existing.targetUser =
      new mongoose.Types.ObjectId(targetUser!);

    existing.targetTeam = undefined;
  }

  if (targetType === "SupportTeam") {
    existing.targetTeam =
      new mongoose.Types.ObjectId(targetTeam!);

    existing.targetUser = undefined;
  }

  // ------------------------------------------
  // ACTIVE STATUS
  // ------------------------------------------

  if (data.isActive !== undefined) {
    existing.isActive = data.isActive;
  }

  return existing.save();
};

// ==========================================
// DELETE POLICY
// ==========================================

export const deleteEscalationPolicy = async (
  policyId: string,
  organizationId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(policyId)) {
    throw new Error(
      "Invalid escalation policy ID"
    );
  }

  const policy =
    await IncidentEscalationPolicy.findOneAndDelete(
      {
        _id: policyId,
        organizationId,
      }
    );

  if (!policy) {
    throw new Error(
      "Escalation policy not found"
    );
  }

  return policy;
};

// ==========================================
// FIND APPLICABLE POLICIES
// ==========================================

export const getApplicableEscalationPolicies =
  async (
    organizationId: string,
    priority: IncidentPriority
  ) => {
    return IncidentEscalationPolicy.find({
      organizationId,
      priority,
      isActive: true,
    })
      .populate(
        "targetUser",
        "name email role"
      )
      .populate(
        "targetTeam",
        "name description"
      )
      .sort({
        thresholdMinutes: 1,
        escalationLevel: 1,
      });
  };