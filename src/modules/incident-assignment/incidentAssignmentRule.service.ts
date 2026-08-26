import mongoose from "mongoose";

import IncidentAssignmentRule, {
  IncidentPriority,
  IncidentSeverity,
  IIncidentAssignmentRule,
} from "./incidentAssignmentRule.model";

import AuthUser from "../auth/auth.model";

// ==========================================
// TYPES
// ==========================================

interface CreateAssignmentRuleData {
  name: string;
  description?: string;
  ruleOrder: number;
  incidentPriority?: IncidentPriority;
  severity?: IncidentSeverity;
  targetUser: string;
  organizationId: string;
  createdBy: string;
}

interface UpdateAssignmentRuleData {
  name?: string;
  description?: string;
  ruleOrder?: number;
  incidentPriority?: IncidentPriority;
  severity?: IncidentSeverity;
  targetUser?: string;
  isActive?: boolean;
}

// ==========================================
// CREATE
// ==========================================

export const createAssignmentRule =
  async (
    data: CreateAssignmentRuleData
  ): Promise<IIncidentAssignmentRule> => {
    // --------------------------------------
    // Validate rule order
    // --------------------------------------

    if (
      !Number.isInteger(data.ruleOrder) ||
      data.ruleOrder < 1
    ) {
      throw new Error(
        "Rule order must be a positive integer"
      );
    }

    // --------------------------------------
    // Validate organization ID
    // --------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        data.organizationId
      )
    ) {
      throw new Error(
        "Invalid organization ID"
      );
    }

    // --------------------------------------
    // Validate target user ID
    // --------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        data.targetUser
      )
    ) {
      throw new Error(
        "Invalid target user ID"
      );
    }

    // --------------------------------------
    // Verify target employee
    // --------------------------------------

    const targetUser =
      await AuthUser.findOne({
        _id: data.targetUser,
        organizationId: data.organizationId,
      });

    if (!targetUser) {
      throw new Error(
        "Target user does not exist in this organization"
      );
    }

    // --------------------------------------
    // Prevent duplicate rule order
    // --------------------------------------

    const existingOrder =
      await IncidentAssignmentRule.findOne({
        organizationId:
          data.organizationId,
        ruleOrder: data.ruleOrder,
      });

    if (existingOrder) {
      throw new Error(
        "A rule with this order already exists in this organization"
      );
    }

    // --------------------------------------
    // Prevent duplicate name
    // --------------------------------------

    const existingName =
      await IncidentAssignmentRule.findOne({
        organizationId:
          data.organizationId,
        name: data.name.trim(),
      });

    if (existingName) {
      throw new Error(
        "An assignment rule with this name already exists"
      );
    }

    // --------------------------------------
    // Create
    // --------------------------------------

    const rule =
      await IncidentAssignmentRule.create({
        name: data.name.trim(),

        description:
          data.description?.trim(),

        ruleOrder: data.ruleOrder,

        incidentPriority:
          data.incidentPriority,

        severity: data.severity,

        targetUser: data.targetUser,

        organizationId:
          data.organizationId,

        createdBy:
          data.createdBy,

        isActive: true,
      });

    return rule;
  };

// ==========================================
// GET ALL
// ==========================================

export const getAssignmentRules =
  async (
    organizationId: string
  ) => {
    if (
      !mongoose.Types.ObjectId.isValid(
        organizationId
      )
    ) {
      throw new Error(
        "Invalid organization ID"
      );
    }

    return IncidentAssignmentRule.find({
      organizationId,
    })
      .populate(
        "targetUser",
        "name email role"
      )
      .populate(
        "createdBy",
        "name email role"
      )
      .sort({
        ruleOrder: 1,
      });
  };

// ==========================================
// GET BY ID
// ==========================================

export const getAssignmentRuleById =
  async (
    ruleId: string,
    organizationId: string
  ) => {
    if (
      !mongoose.Types.ObjectId.isValid(
        ruleId
      )
    ) {
      throw new Error(
        "Invalid assignment rule ID"
      );
    }

    const rule =
      await IncidentAssignmentRule.findOne({
        _id: ruleId,
        organizationId,
      })
        .populate(
          "targetUser",
          "name email role"
        )
        .populate(
          "createdBy",
          "name email role"
        );

    if (!rule) {
      throw new Error(
        "Assignment rule not found"
      );
    }

    return rule;
  };

// ==========================================
// UPDATE
// ==========================================

export const updateAssignmentRule =
  async (
    ruleId: string,
    organizationId: string,
    data: UpdateAssignmentRuleData
  ) => {
    if (
      !mongoose.Types.ObjectId.isValid(
        ruleId
      )
    ) {
      throw new Error(
        "Invalid assignment rule ID"
      );
    }

    const rule =
      await IncidentAssignmentRule.findOne({
        _id: ruleId,
        organizationId,
      });

    if (!rule) {
      throw new Error(
        "Assignment rule not found"
      );
    }

    // --------------------------------------
    // Rule order
    // --------------------------------------

    if (
      data.ruleOrder !== undefined
    ) {
      if (
        !Number.isInteger(
          data.ruleOrder
        ) ||
        data.ruleOrder < 1
      ) {
        throw new Error(
          "Rule order must be a positive integer"
        );
      }

      const duplicateOrder =
        await IncidentAssignmentRule.findOne(
          {
            organizationId,
            ruleOrder:
              data.ruleOrder,
            _id: {
              $ne: ruleId,
            },
          }
        );

      if (duplicateOrder) {
        throw new Error(
          "A rule with this order already exists in this organization"
        );
      }

      rule.ruleOrder =
        data.ruleOrder;
    }

    // --------------------------------------
    // Name
    // --------------------------------------

    if (data.name !== undefined) {
      const name =
        data.name.trim();

      if (!name) {
        throw new Error(
          "Rule name cannot be empty"
        );
      }

      const duplicateName =
        await IncidentAssignmentRule.findOne(
          {
            organizationId,
            name,
            _id: {
              $ne: ruleId,
            },
          }
        );

      if (duplicateName) {
        throw new Error(
          "An assignment rule with this name already exists"
        );
      }

      rule.name = name;
    }

    // --------------------------------------
    // Description
    // --------------------------------------

    if (
      data.description !== undefined
    ) {
      rule.description =
        data.description.trim();
    }

    // --------------------------------------
    // Priority
    // --------------------------------------

    if (
      data.incidentPriority !==
      undefined
    ) {
      rule.incidentPriority =
        data.incidentPriority;
    }

    // --------------------------------------
    // Severity
    // --------------------------------------

    if (
      data.severity !== undefined
    ) {
      rule.severity =
        data.severity;
    }

    // --------------------------------------
    // Target user
    // --------------------------------------

    if (
      data.targetUser !== undefined
    ) {
      if (
        !mongoose.Types.ObjectId.isValid(
          data.targetUser
        )
      ) {
        throw new Error(
          "Invalid target user ID"
        );
      }

      const targetUser =
        await AuthUser.findOne({
          _id: data.targetUser,
          organizationId,
        });

      if (!targetUser) {
        throw new Error(
          "Target user does not exist in this organization"
        );
      }

      rule.targetUser =
        new mongoose.Types.ObjectId(
          data.targetUser
        );
    }

    // --------------------------------------
    // Active status
    // --------------------------------------

    if (
      data.isActive !== undefined
    ) {
      rule.isActive =
        data.isActive;
    }

    await rule.save();

    return IncidentAssignmentRule.findById(
      rule._id
    )
      .populate(
        "targetUser",
        "name email role"
      )
      .populate(
        "createdBy",
        "name email role"
      );
  };

// ==========================================
// DELETE
// ==========================================

export const deleteAssignmentRule =
  async (
    ruleId: string,
    organizationId: string
  ) => {
    if (
      !mongoose.Types.ObjectId.isValid(
        ruleId
      )
    ) {
      throw new Error(
        "Invalid assignment rule ID"
      );
    }

    const rule =
      await IncidentAssignmentRule.findOneAndDelete(
        {
          _id: ruleId,
          organizationId,
        }
      );

    if (!rule) {
      throw new Error(
        "Assignment rule not found"
      );
    }

    return rule;
  };

// ==========================================
// GET APPLICABLE RULES
// ==========================================

export const getApplicableAssignmentRules =
  async (
    organizationId: string,
    incidentPriority?: IncidentPriority,
    severity?: IncidentSeverity
  ) => {
    const query: any = {
      organizationId,
      isActive: true,
    };

    // --------------------------------------
    // Priority matching
    //
    // A rule with no priority is treated
    // as a wildcard.
    // --------------------------------------

    if (incidentPriority) {
      query.$or = [
        {
          incidentPriority,
        },
        {
          incidentPriority: {
            $exists: false,
          },
        },
        {
          incidentPriority: null,
        },
      ];
    }

    // --------------------------------------
    // Severity matching
    //
    // A rule with no severity is treated
    // as a wildcard.
    // --------------------------------------

    if (severity) {
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            {
              severity,
            },
            {
              severity: {
                $exists: false,
              },
            },
            {
              severity: null,
            },
          ],
        },
      ];
    }

    return IncidentAssignmentRule.find(
      query
    )
      .populate(
        "targetUser",
        "name email role organizationId"
      )
      .sort({
        ruleOrder: 1,
      });
  };

// ==========================================
// GET FIRST MATCH
// ==========================================

export const findMatchingAssignmentRule =
  async (
    organizationId: string,
    incidentPriority?: IncidentPriority,
    severity?: IncidentSeverity
  ) => {
    const rules =
      await getApplicableAssignmentRules(
        organizationId,
        incidentPriority,
        severity
      );

    return rules.length > 0
      ? rules[0]
      : null;
  };