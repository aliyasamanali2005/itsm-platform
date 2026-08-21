import mongoose from "mongoose";
import Change, {
  ChangeRisk,
  ChangeType,
  ChangeStatus,
} from "./change.model";
import AuthUser from "../auth/auth.model";
import Asset from "../asset/asset.model";

// ==========================================
// TYPES
// ==========================================

interface CreateChangeData {
  changeId: string;
  title: string;
  description: string;
  type?: ChangeType;
  risk?: ChangeRisk;
  requestedBy: string;
  organizationId: string;
  affectedAssets?: string[];
  plannedStartAt?: Date;
  plannedEndAt?: Date;
  rollbackPlan?: string;
}

interface UpdateChangeData {
  title?: string;
  description?: string;
  type?: ChangeType;
  risk?: ChangeRisk;
  status?: ChangeStatus;
  assignedTo?: string;
  affectedAssets?: string[];
  plannedStartAt?: Date;
  plannedEndAt?: Date;
  rollbackPlan?: string;
  approvalReason?: string;
  failureReason?: string;
}

// ==========================================
// CREATE CHANGE
// ==========================================

export const createChange = async (
  data: CreateChangeData
) => {
  const existingChange = await Change.findOne({
    changeId: data.changeId,
    organizationId: data.organizationId,
  });

  if (existingChange) {
    throw new Error(
      "A change with this ID already exists in this organization"
    );
  }

  const requester = await AuthUser.findOne({
    _id: data.requestedBy,
    organizationId: data.organizationId,
    isActive: true,
  });

  if (!requester) {
    throw new Error(
      "Requester does not belong to this organization"
    );
  }

  // ------------------------------------------
  // VALIDATE AFFECTED ASSETS
  // ------------------------------------------

  let affectedAssets:
    | mongoose.Types.ObjectId[]
    | undefined;

  if (
    data.affectedAssets &&
    data.affectedAssets.length > 0
  ) {
    const assets = await Asset.find({
      _id: {
        $in: data.affectedAssets,
      },
      organizationId: data.organizationId,
    });

    if (
      assets.length !== data.affectedAssets.length
    ) {
      throw new Error(
        "One or more affected assets do not belong to this organization"
      );
    }

    affectedAssets = data.affectedAssets.map(
      (assetId) =>
        new mongoose.Types.ObjectId(assetId)
    );
  }

  // ------------------------------------------
  // VALIDATE SCHEDULE
  // ------------------------------------------

  if (
    data.plannedStartAt &&
    data.plannedEndAt &&
    new Date(data.plannedEndAt) <=
      new Date(data.plannedStartAt)
  ) {
    throw new Error(
      "Planned end time must be after planned start time"
    );
  }

  return Change.create({
    changeId: data.changeId,
    title: data.title,
    description: data.description,
    type: data.type || "Normal",
    risk: data.risk || "Medium",
    status: "Draft",
    requestedBy: data.requestedBy,
    organizationId: data.organizationId,
    affectedAssets,
    plannedStartAt: data.plannedStartAt,
    plannedEndAt: data.plannedEndAt,
    rollbackPlan: data.rollbackPlan,
  });
};

// ==========================================
// GET ALL CHANGES
// ==========================================

export const getChangesByOrganization = async (
  organizationId: string
) => {
  return Change.find({
    organizationId,
  })
    .populate(
      "requestedBy",
      "name email role"
    )
    .populate(
      "assignedTo",
      "name email role"
    )
    .populate(
      "approvedBy",
      "name email role"
    )
    .populate(
      "rejectedBy",
      "name email role"
    )
    .populate(
      "affectedAssets",
      "assetId name category status"
    )
    .sort({
      createdAt: -1,
    });
};

// ==========================================
// GET CHANGE BY ID
// ==========================================

export const getChangeById = async (
  id: string,
  organizationId: string
) => {
  return Change.findOne({
    _id: id,
    organizationId,
  })
    .populate(
      "requestedBy",
      "name email role"
    )
    .populate(
      "assignedTo",
      "name email role"
    )
    .populate(
      "approvedBy",
      "name email role"
    )
    .populate(
      "rejectedBy",
      "name email role"
    )
    .populate(
      "affectedAssets",
      "assetId name category status"
    );
};

// ==========================================
// UPDATE CHANGE
// ==========================================

export const updateChange = async (
  id: string,
  organizationId: string,
  userId: string,
  data: UpdateChangeData
) => {
  const change = await Change.findOne({
    _id: id,
    organizationId,
  });

  if (!change) {
    return null;
  }

  const updateData: any = {
    ...data,
  };

  // ==========================================
  // NORMALIZE CURRENT STATUS
  // ==========================================

  const currentStatus = String(
    change.status
  ).trim();

  const requestedStatus = data.status
    ? String(data.status).trim()
    : undefined;

  if (requestedStatus) {
    updateData.status = requestedStatus;
  }

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
        "Changes can only be assigned to employees"
      );
    }

    updateData.assignedTo = employee._id;
  }

  // ------------------------------------------
  // AFFECTED ASSET VALIDATION
  // ------------------------------------------

  if (data.affectedAssets) {
    const assets = await Asset.find({
      _id: {
        $in: data.affectedAssets,
      },
      organizationId,
    });

    if (
      assets.length !== data.affectedAssets.length
    ) {
      throw new Error(
        "One or more affected assets do not belong to this organization"
      );
    }

    updateData.affectedAssets =
      data.affectedAssets.map(
        (assetId) =>
          new mongoose.Types.ObjectId(assetId)
      );
  }

  // ------------------------------------------
  // SCHEDULE VALIDATION
  // ------------------------------------------

  const startDate =
    data.plannedStartAt ||
    change.plannedStartAt;

  const endDate =
    data.plannedEndAt ||
    change.plannedEndAt;

  if (
    startDate &&
    endDate &&
    new Date(endDate) <= new Date(startDate)
  ) {
    throw new Error(
      "Planned end time must be after planned start time"
    );
  }

  // ==========================================
  // APPROVAL
  // ==========================================

  if (requestedStatus === "Approved") {
    updateData.approvedBy = userId;
    updateData.approvedAt = new Date();
  }

  // ==========================================
  // REJECTION
  // ==========================================

  if (requestedStatus === "Rejected") {
    if (!data.approvalReason) {
      throw new Error(
        "A reason is required when rejecting a change"
      );
    }

    updateData.rejectedBy = userId;
    updateData.rejectedAt = new Date();
  }

  // ==========================================
  // START CHANGE
  // ==========================================

  if (requestedStatus === "In Progress") {
    if (
      currentStatus !== "Approved" &&
      currentStatus !== "Scheduled"
    ) {
      throw new Error(
        `Only approved or scheduled changes can be started. Current status: ${currentStatus}`
      );
    }

    updateData.startedAt = new Date();
  }

  // ==========================================
  // COMPLETE CHANGE
  // ==========================================

  if (requestedStatus === "Completed") {
    if (currentStatus !== "In Progress") {
      throw new Error(
        "Only changes in progress can be completed"
      );
    }

    updateData.completedAt = new Date();
  }

  // ==========================================
  // FAILED CHANGE
  // ==========================================

  if (requestedStatus === "Failed") {
    if (currentStatus !== "In Progress") {
      throw new Error(
        "Only changes in progress can be marked as failed"
      );
    }

    if (!data.failureReason) {
      throw new Error(
        "Failure reason is required when marking a change as failed"
      );
    }

    updateData.failedAt = new Date();
  }

  // ==========================================
  // CANCELLED CHANGE
  // ==========================================

  if (requestedStatus === "Cancelled") {
    if (
      currentStatus === "Completed" ||
      currentStatus === "Failed"
    ) {
      throw new Error(
        "Completed or failed changes cannot be cancelled"
      );
    }

    updateData.cancelledAt = new Date();
  }

  // ==========================================
  // UPDATE DATABASE
  // ==========================================

  return Change.findOneAndUpdate(
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
      "requestedBy",
      "name email role"
    )
    .populate(
      "assignedTo",
      "name email role"
    )
    .populate(
      "approvedBy",
      "name email role"
    )
    .populate(
      "rejectedBy",
      "name email role"
    )
    .populate(
      "affectedAssets",
      "assetId name category status"
    );
};

// ==========================================
// DELETE CHANGE
// ==========================================

export const deleteChange = async (
  id: string,
  organizationId: string
) => {
  return Change.findOneAndDelete({
    _id: id,
    organizationId,
  });
};