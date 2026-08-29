import mongoose from "mongoose";

import {
  ISupportTeam,
} from "./supportTeam.model";

import {
  supportTeamRepository,
} from "./supportTeam.repository";

interface CreateSupportTeamData {
  name: string;
  description?: string;
  organizationId: string;
  members?: string[];
}

// ==========================================
// CREATE SUPPORT TEAM
// ==========================================

export const createSupportTeam = async (
  data: CreateSupportTeamData
): Promise<ISupportTeam> => {
  const organizationId = new mongoose.Types.ObjectId(
    data.organizationId
  );

  const members = (data.members || []).map(
    (memberId) => new mongoose.Types.ObjectId(memberId)
  );

  const existingTeam =
    await supportTeamRepository.findOne({
      name: data.name,
      organizationId,
    });

  if (existingTeam) {
    throw new Error(
      "A support team with this name already exists in this organization"
    );
  }

  return supportTeamRepository.create({
    name: data.name,
    description: data.description,
    organizationId,
    members,
  });
};

// ==========================================
// GET ALL SUPPORT TEAMS
// ==========================================

export const getSupportTeams = async (
  organizationId: string
): Promise<ISupportTeam[]> => {
  return supportTeamRepository.findAllByOrganization(
    organizationId
  );
};

// ==========================================
// GET SUPPORT TEAM BY ID
// ==========================================

export const getSupportTeamById = async (
  id: string,
  organizationId: string
): Promise<ISupportTeam | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return null;
  }

  return supportTeamRepository.findByIdAndOrganization(
    id,
    organizationId
  );
};

// ==========================================
// UPDATE SUPPORT TEAM
// ==========================================

export const updateSupportTeam = async (
  id: string,
  organizationId: string,
  data: Partial<{
    name: string;
    description: string;
    members: string[];
    isActive: boolean;
  }>
): Promise<ISupportTeam | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return null;
  }

  const updateData: Partial<ISupportTeam> = {
    name: data.name,
    description: data.description,
    isActive: data.isActive,
  };

  if (data.members !== undefined) {
    updateData.members = data.members.map(
      (memberId) => new mongoose.Types.ObjectId(memberId)
    );
  }

  return supportTeamRepository.updateByIdAndOrganization(
    id,
    organizationId,
    updateData
  );
};

// ==========================================
// DELETE SUPPORT TEAM
// ==========================================

export const deleteSupportTeam = async (
  id: string,
  organizationId: string
): Promise<ISupportTeam | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return null;
  }

  return supportTeamRepository.deleteByIdAndOrganization(
    id,
    organizationId
  );
};