import mongoose from "mongoose";

import RCA, {
  IRCA,
  RCAStatus,
} from "./rca.model";

import Problem from "../problem/problem.model";
import Incident from "../incident/incident.model";
import AuthUser from "../auth/auth.model";

// ==========================================
// TYPES
// ==========================================

interface CreateRCAData {
  rcaId: string;
  problem: string;
  rootCause: string;
  investigation: string;
  contributingFactors?: string[];
  correctiveActions?: string[];
  preventiveActions?: string[];
  identifiedBy: string;
  relatedIncidents?: string[];
  organizationId: string;
  status?: RCAStatus;
}

interface UpdateRCAData {
  problem?: string;
  rootCause?: string;
  investigation?: string;
  contributingFactors?: string[];
  correctiveActions?: string[];
  preventiveActions?: string[];
  identifiedBy?: string;
  relatedIncidents?: string[];
  status?: RCAStatus;
}

// ==========================================
// HELPERS
// ==========================================

const isValidObjectId = (
  id: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// RCA STATUS WORKFLOW
// ==========================================

const validateRCAStatusTransition = (
  currentStatus: RCAStatus,
  newStatus: RCAStatus,
  userRole: "admin" | "employee"
) => {
  // ----------------------------------------
  // APPROVED RCA IS IMMUTABLE
  // ----------------------------------------

  if (currentStatus === "Approved") {
    throw new Error(
      "Approved RCA cannot be modified"
    );
  }

  // ----------------------------------------
  // APPROVAL IS ADMIN ONLY
  // ----------------------------------------

  if (newStatus === "Approved") {
    if (userRole !== "admin") {
      throw new Error(
        "Only administrators can approve an RCA"
      );
    }

    if (currentStatus !== "Completed") {
      throw new Error(
        "Only completed RCAs can be approved"
      );
    }

    return;
  }

  // ----------------------------------------
  // ALLOWED WORKFLOW
  // ----------------------------------------

  const allowedTransitions: Record<
    RCAStatus,
    RCAStatus[]
  > = {
    Draft: [
      "Under Investigation",
    ],

    "Under Investigation": [
      "Draft",
      "Completed",
    ],

    Completed: [
      "Under Investigation",
    ],

    Approved: [],
  };

  // Same status is allowed.
  if (newStatus === currentStatus) {
    return;
  }

  const allowed =
    allowedTransitions[currentStatus];

  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid RCA status transition: ${currentStatus} → ${newStatus}`
    );
  }
};

// ==========================================
// CREATE RCA
// ==========================================

export const createRCA = async (
  data: CreateRCAData
): Promise<IRCA> => {
  const {
    rcaId,
    problem,
    rootCause,
    investigation,
    contributingFactors = [],
    correctiveActions = [],
    preventiveActions = [],
    identifiedBy,
    relatedIncidents = [],
    organizationId,
    status = "Draft",
  } = data;

  // ==========================================
  // VALIDATE ORGANIZATION ID
  // ==========================================

  if (!isValidObjectId(organizationId)) {
    throw new Error(
      "Invalid organization ID"
    );
  }

  // ==========================================
  // VALIDATE PROBLEM ID
  // ==========================================

  if (!isValidObjectId(problem)) {
    throw new Error(
      "Invalid problem ID"
    );
  }

  // ==========================================
  // VALIDATE IDENTIFIED BY
  // ==========================================

  if (!isValidObjectId(identifiedBy)) {
    throw new Error(
      "Invalid identifiedBy user ID"
    );
  }

  // ==========================================
  // VALIDATE INITIAL STATUS
  // ==========================================

  if (
    status !== "Draft"
  ) {
    throw new Error(
      "A new RCA must start in Draft status"
    );
  }

  // ==========================================
  // CHECK PROBLEM
  // ==========================================

  const existingProblem =
    await Problem.findOne({
      _id: problem,
      organizationId,
    });

  if (!existingProblem) {
    throw new Error(
      "Problem not found or does not belong to this organization"
    );
  }

  // ==========================================
  // CHECK IDENTIFYING USER
  // ==========================================

  const identifyingUser =
    await AuthUser.findOne({
      _id: identifiedBy,
      organizationId,
      isActive: true,
    });

  if (!identifyingUser) {
    throw new Error(
      "Identifying user not found, inactive, or does not belong to this organization"
    );
  }

  // ==========================================
  // VALIDATE RELATED INCIDENTS
  // ==========================================

  if (
    relatedIncidents.length > 0
  ) {
    const invalidIncidentId =
      relatedIncidents.find(
        (incidentId) =>
          !isValidObjectId(
            incidentId
          )
      );

    if (invalidIncidentId) {
      throw new Error(
        `Invalid incident ID: ${invalidIncidentId}`
      );
    }

    const incidents =
      await Incident.find({
        _id: {
          $in: relatedIncidents,
        },
        organizationId,
      });

    if (
      incidents.length !==
      relatedIncidents.length
    ) {
      throw new Error(
        "One or more related incidents were not found or do not belong to this organization"
      );
    }
  }

  // ==========================================
  // CHECK DUPLICATE RCA ID
  // ==========================================

  const existingRCA =
    await RCA.findOne({
      rcaId,
      organizationId,
    });

  if (existingRCA) {
    throw new Error(
      "An RCA with this RCA ID already exists in this organization"
    );
  }

  // ==========================================
  // CHECK EXISTING RCA FOR PROBLEM
  // ==========================================

  const existingProblemRCA =
    await RCA.findOne({
      problem,
      organizationId,
    });

  if (existingProblemRCA) {
    throw new Error(
      "An RCA already exists for this problem"
    );
  }

  // ==========================================
  // CREATE RCA
  // ==========================================

  const rca = await RCA.create({
    rcaId,
    problem,
    rootCause,
    investigation,
    contributingFactors,
    correctiveActions,
    preventiveActions,
    identifiedBy,
    relatedIncidents,
    organizationId,
    status: "Draft",
  });

  return rca;
};

// ==========================================
// GET ALL RCAs BY ORGANIZATION
// ==========================================

export const getRCAsByOrganization =
  async (
    organizationId: string
  ): Promise<IRCA[]> => {
    if (
      !isValidObjectId(
        organizationId
      )
    ) {
      throw new Error(
        "Invalid organization ID"
      );
    }

    const rcas = await RCA.find({
      organizationId,
    })
      .populate({
        path: "problem",
        select:
          "problemId title description priority impact urgency status",
      })
      .populate({
        path: "identifiedBy",
        select:
          "name email role",
      })
      .populate({
        path: "relatedIncidents",
        select:
          "incidentId title priority severity status",
      })
      .sort({
        createdAt: -1,
      });

    return rcas;
  };

// ==========================================
// GET RCA BY ID
// ==========================================

export const getRCAById = async (
  rcaId: string,
  organizationId: string
): Promise<IRCA | null> => {
  if (
    !isValidObjectId(rcaId)
  ) {
    throw new Error(
      "Invalid RCA ID"
    );
  }

  if (
    !isValidObjectId(
      organizationId
    )
  ) {
    throw new Error(
      "Invalid organization ID"
    );
  }

  const rca = await RCA.findOne({
    _id: rcaId,
    organizationId,
  })
    .populate({
      path: "problem",
      select:
        "problemId title description priority impact urgency status rootCause",
    })
    .populate({
      path: "identifiedBy",
      select:
        "name email role",
    })
    .populate({
      path: "relatedIncidents",
      select:
        "incidentId title description priority severity status resolution",
    });

  return rca;
};

// ==========================================
// GET RCA BY PROBLEM
// ==========================================

export const getRCAByProblem =
  async (
    problemId: string,
    organizationId: string
  ): Promise<IRCA | null> => {
    if (
      !isValidObjectId(
        problemId
      )
    ) {
      throw new Error(
        "Invalid problem ID"
      );
    }

    if (
      !isValidObjectId(
        organizationId
      )
    ) {
      throw new Error(
        "Invalid organization ID"
      );
    }

    const rca = await RCA.findOne({
      problem: problemId,
      organizationId,
    })
      .populate({
        path: "problem",
        select:
          "problemId title description priority impact urgency status rootCause",
      })
      .populate({
        path: "identifiedBy",
        select:
          "name email role",
      })
      .populate({
        path: "relatedIncidents",
        select:
          "incidentId title description priority severity status resolution",
      });

    return rca;
  };

// ==========================================
// UPDATE RCA
// ==========================================

export const updateRCA = async (
  rcaId: string,
  organizationId: string,
  data: UpdateRCAData,
  userRole: "admin" | "employee"
): Promise<IRCA | null> => {
  if (
    !isValidObjectId(rcaId)
  ) {
    throw new Error(
      "Invalid RCA ID"
    );
  }

  if (
    !isValidObjectId(
      organizationId
    )
  ) {
    throw new Error(
      "Invalid organization ID"
    );
  }

  // ==========================================
  // FIND RCA
  // ==========================================

  const existingRCA =
    await RCA.findOne({
      _id: rcaId,
      organizationId,
    });

  if (!existingRCA) {
    throw new Error(
      "RCA not found or does not belong to this organization"
    );
  }

  // ==========================================
  // APPROVED RCA IMMUTABILITY
  // ==========================================

  if (
    existingRCA.status ===
    "Approved"
  ) {
    throw new Error(
      "Approved RCA cannot be modified"
    );
  }

  // ==========================================
  // STATUS VALIDATION
  // ==========================================

  if (
    data.status !== undefined
  ) {
    validateRCAStatusTransition(
      existingRCA.status,
      data.status,
      userRole
    );
  }

  // ==========================================
  // PREVENT IDENTIFIED BY MANIPULATION
  // ==========================================

  const updateData: UpdateRCAData =
    {
      ...data,
    };

  // The creator/identifier should not
  // be changed through a normal update.
  delete updateData.identifiedBy;

  // ==========================================
  // VALIDATE CHANGED PROBLEM
  // ==========================================

  if (
    data.problem !== undefined
  ) {
    if (
      !isValidObjectId(
        data.problem
      )
    ) {
      throw new Error(
        "Invalid problem ID"
      );
    }

    const problem =
      await Problem.findOne({
        _id: data.problem,
        organizationId,
      });

    if (!problem) {
      throw new Error(
        "Problem not found or does not belong to this organization"
      );
    }

    // ----------------------------------------
    // PREVENT DUPLICATE RCA
    // ----------------------------------------

    if (
      data.problem !==
      existingRCA.problem.toString()
    ) {
      const problemRCA =
        await RCA.findOne({
          problem: data.problem,
          organizationId,
          _id: {
            $ne: rcaId,
          },
        });

      if (problemRCA) {
        throw new Error(
          "An RCA already exists for the selected problem"
        );
      }
    }
  }

  // ==========================================
  // VALIDATE RELATED INCIDENTS
  // ==========================================

  if (
    data.relatedIncidents !==
    undefined
  ) {
    const invalidIncidentId =
      data.relatedIncidents.find(
        (incidentId) =>
          !isValidObjectId(
            incidentId
          )
      );

    if (invalidIncidentId) {
      throw new Error(
        `Invalid incident ID: ${invalidIncidentId}`
      );
    }

    if (
      data.relatedIncidents.length >
      0
    ) {
      const incidents =
        await Incident.find({
          _id: {
            $in:
              data.relatedIncidents,
          },
          organizationId,
        });

      if (
        incidents.length !==
        data.relatedIncidents.length
      ) {
        throw new Error(
          "One or more related incidents were not found or do not belong to this organization"
        );
      }
    }
  }

  // ==========================================
  // VALIDATE STATUS-SPECIFIC DATA
  // ==========================================

  if (
    data.status === "Completed" ||
    data.status === "Approved"
  ) {
    const rootCause =
      data.rootCause ??
      existingRCA.rootCause;

    const investigation =
      data.investigation ??
      existingRCA.investigation;

    if (
      !rootCause?.trim()
    ) {
      throw new Error(
        "Root cause is required before completing an RCA"
      );
    }

    if (
      !investigation?.trim()
    ) {
      throw new Error(
        "Investigation is required before completing an RCA"
      );
    }
  }

  // ==========================================
  // UPDATE RCA
  // ==========================================

  const updatedRCA =
    await RCA.findOneAndUpdate(
      {
        _id: rcaId,
        organizationId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate({
        path: "problem",
        select:
          "problemId title description priority impact urgency status rootCause",
      })
      .populate({
        path: "identifiedBy",
        select:
          "name email role",
      })
      .populate({
        path: "relatedIncidents",
        select:
          "incidentId title description priority severity status resolution",
      });

  return updatedRCA;
};

// ==========================================
// DELETE RCA
// ==========================================

export const deleteRCA = async (
  rcaId: string,
  organizationId: string
): Promise<IRCA | null> => {
  if (
    !isValidObjectId(rcaId)
  ) {
    throw new Error(
      "Invalid RCA ID"
    );
  }

  if (
    !isValidObjectId(
      organizationId
    )
  ) {
    throw new Error(
      "Invalid organization ID"
    );
  }

  // ==========================================
  // FIND RCA
  // ==========================================

  const existingRCA =
    await RCA.findOne({
      _id: rcaId,
      organizationId,
    });

  if (!existingRCA) {
    return null;
  }

  // ==========================================
  // PREVENT DELETING APPROVED RCA
  // ==========================================

  if (
    existingRCA.status ===
    "Approved"
  ) {
    throw new Error(
      "Approved RCA cannot be deleted"
    );
  }

  // ==========================================
  // DELETE
  // ==========================================

  const deletedRCA =
    await RCA.findOneAndDelete({
      _id: rcaId,
      organizationId,
    });

  return deletedRCA;
};