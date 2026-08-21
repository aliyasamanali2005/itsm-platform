import Organization, {
  IOrganization,
} from "./organization.model";

interface CreateOrganizationData {
  name: string;
  slug: string;
  description?: string;
}

export const createOrganization = async (
  data: CreateOrganizationData
): Promise<IOrganization> => {
  const existingOrganization = await Organization.findOne({
    $or: [
      { name: data.name },
      { slug: data.slug },
    ],
  });

  if (existingOrganization) {
    throw new Error(
      "An organization with this name or slug already exists"
    );
  }

  const organization = await Organization.create({
    name: data.name,
    slug: data.slug,
    description: data.description,
  });

  return organization;
};

export const getOrganizations = async (): Promise<IOrganization[]> => {
  return Organization.find().sort({ createdAt: -1 });
};

export const getOrganizationById = async (
  id: string
): Promise<IOrganization | null> => {
  return Organization.findById(id);
};

export const updateOrganization = async (
  id: string,
  data: Partial<CreateOrganizationData>
): Promise<IOrganization | null> => {
  const organization = await Organization.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true,
    }
  );

  return organization;
};

export const deleteOrganization = async (
  id: string
): Promise<IOrganization | null> => {
  return Organization.findByIdAndDelete(id);
};