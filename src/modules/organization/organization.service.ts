import {
  IOrganization,
} from "./organization.model";

import {
  organizationRepository,
} from "./organization.repository";

interface CreateOrganizationData {
  name: string;
  slug: string;
  description?: string;
}

export const createOrganization = async (
  data: CreateOrganizationData
): Promise<IOrganization> => {
  const existingOrganization =
    await organizationRepository.findOne({
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

  return organizationRepository.create({
    name: data.name,
    slug: data.slug,
    description: data.description,
  });
};

export const getOrganizations = async (): Promise<IOrganization[]> => {
  return organizationRepository.findAll();
};

export const getOrganizationById = async (
  id: string
): Promise<IOrganization | null> => {
  return organizationRepository.findById(id);
};

export const updateOrganization = async (
  id: string,
  data: Partial<CreateOrganizationData>
): Promise<IOrganization | null> => {
  return organizationRepository.updateById(id, data);
};

export const deleteOrganization = async (
  id: string
): Promise<IOrganization | null> => {
  return organizationRepository.deleteById(id);
};
