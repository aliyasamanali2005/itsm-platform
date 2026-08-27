import SLA, { ISLA } from "./sla.model";

// ==========================================
// SLA REPOSITORY
// ==========================================

export const slaRepository = {
  // ==========================================
  // FIND ONE
  // ==========================================

  findOne: async (
    filter: Record<string, any>
  ): Promise<ISLA | null> => {
    return SLA.findOne(filter);
  },

  // ==========================================
  // FIND BY ID + ORGANIZATION
  // ==========================================

  findByIdAndOrganization: async (
    id: string,
    organizationId: string
  ): Promise<ISLA | null> => {
    return SLA.findOne({
      _id: id,
      organizationId,
    });
  },

  // ==========================================
  // FIND BY INCIDENT + ORGANIZATION
  // ==========================================

  findByIncidentAndOrganization: async (
    incidentId: string,
    organizationId: string
  ): Promise<ISLA | null> => {
    return SLA.findOne({
      incidentId,
      organizationId,
    });
  },

  // ==========================================
  // FIND ALL BY ORGANIZATION
  // ==========================================

  findAllByOrganization: async (
    organizationId: string
  ): Promise<ISLA[]> => {
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
  },

  // ==========================================
  // FIND BY INCIDENT WITH POPULATION
  // ==========================================

  findByIncidentWithIncident: async (
    incidentId: string,
    organizationId: string
  ): Promise<ISLA | null> => {
    return SLA.findOne({
      incidentId,
      organizationId,
    }).populate(
      "incidentId",
      "incidentId title priority severity status"
    );
  },

  // ==========================================
  // CREATE
  // ==========================================

  create: async (
    data: Partial<ISLA>
  ): Promise<ISLA> => {
    return SLA.create(data);
  },

  // ==========================================
  // UPDATE BY ID + ORGANIZATION
  // ==========================================

  updateByIdAndOrganization: async (
    id: string,
    organizationId: string,
    data: Record<string, any>
  ): Promise<ISLA | null> => {
    return SLA.findOneAndUpdate(
      {
        _id: id,
        organizationId,
      },
      data,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );
  },
};