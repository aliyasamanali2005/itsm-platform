import Organization, {
  IOrganization,
} from "./organization.model";

export const organizationRepository = {
  create: async (data: Partial<IOrganization>) => {
    return Organization.create(data);
  },

  findAll: async (): Promise<IOrganization[]> => {
    return Organization.find().sort({ createdAt: -1 });
  },

  findById: async (
    id: string
  ): Promise<IOrganization | null> => {
    return Organization.findById(id);
  },

  findOne: async (
    filter: Record<string, any>
  ): Promise<IOrganization | null> => {
    return Organization.findOne(filter);
  },

  updateById: async (
    id: string,
    data: Partial<IOrganization>
  ): Promise<IOrganization | null> => {
    return Organization.findByIdAndUpdate(
      id,
      data,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );
  },

  deleteById: async (
    id: string
  ): Promise<IOrganization | null> => {
    return Organization.findByIdAndDelete(id);
  },
};
