import SupportTeam, {
  ISupportTeam,
} from "./supportTeam.model";

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
  const existingTeam =
    await SupportTeam.findOne({
      name: data.name,
      organizationId: data.organizationId,
    });

  if (existingTeam) {
    throw new Error(
      "A support team with this name already exists in this organization"
    );
  }

  const supportTeam =
    await SupportTeam.create({
      name: data.name,
      description: data.description,
      organizationId: data.organizationId,
      members: data.members || [],
    });

  return supportTeam;
};

// ==========================================
// GET ALL SUPPORT TEAMS
// ==========================================

export const getSupportTeams = async (
  organizationId: string
): Promise<ISupportTeam[]> => {
  return SupportTeam.find({
    organizationId,
  }).sort({
    createdAt: -1,
  });
};

// ==========================================
// GET SUPPORT TEAM BY ID
// ==========================================

export const getSupportTeamById = async (
  id: string,
  organizationId: string
): Promise<ISupportTeam | null> => {
  return SupportTeam.findOne({
    _id: id,
    organizationId,
  });
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
  const supportTeam =
    await SupportTeam.findOneAndUpdate(
      {
        _id: id,
        organizationId,
      },
      data,
      {
        new: true,
        runValidators: true,
      }
    );

  return supportTeam;
};

// ==========================================
// DELETE SUPPORT TEAM
// ==========================================

export const deleteSupportTeam = async (
  id: string,
  organizationId: string
): Promise<ISupportTeam | null> => {
  return SupportTeam.findOneAndDelete({
    _id: id,
    organizationId,
  });
};