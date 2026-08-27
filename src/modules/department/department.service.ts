import { IDepartment } from "./department.model";
import { departmentRepository } from "./department.repository";

interface CreateDepartmentData {
  name: string;
  description?: string;
  organizationId: string;
}

// ==========================================
// CREATE DEPARTMENT
// ==========================================

export const createDepartment = async (
  data: CreateDepartmentData
): Promise<IDepartment> => {
  const existingDepartment = await departmentRepository.findOne({
    name: data.name,
    organizationId: data.organizationId,
  });

  if (existingDepartment) {
    throw new Error(
      "A department with this name already exists in this organization"
    );
  }

  return departmentRepository.create({
    name: data.name,
    description: data.description,
    organizationId: data.organizationId,
  });
};

// ==========================================
// GET ALL DEPARTMENTS
// ==========================================

export const getDepartments = async (
  organizationId: string
): Promise<IDepartment[]> => {
  return departmentRepository.findAllByOrganization(
    organizationId
  );
};

// ==========================================
// GET DEPARTMENT BY ID
// ==========================================

export const getDepartmentById = async (
  id: string,
  organizationId: string
): Promise<IDepartment | null> => {
  return departmentRepository.findByIdAndOrganization(
    id,
    organizationId
  );
};

// ==========================================
// UPDATE DEPARTMENT
// ==========================================

export const updateDepartment = async (
  id: string,
  organizationId: string,
  data: Partial<{
    name: string;
    description: string;
    isActive: boolean;
  }>
): Promise<IDepartment | null> => {
  return departmentRepository.updateByIdAndOrganization(
    id,
    organizationId,
    data
  );
};

// ==========================================
// DELETE DEPARTMENT
// ==========================================

export const deleteDepartment = async (
  id: string,
  organizationId: string
): Promise<IDepartment | null> => {
  return departmentRepository.deleteByIdAndOrganization(
    id,
    organizationId
  );
};
