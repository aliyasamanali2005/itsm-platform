import Department, {
  IDepartment,
} from "./department.model";

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
  const existingDepartment = await Department.findOne({
    name: data.name,
    organizationId: data.organizationId,
  });

  if (existingDepartment) {
    throw new Error(
      "A department with this name already exists in this organization"
    );
  }

  const department = await Department.create({
    name: data.name,
    description: data.description,
    organizationId: data.organizationId,
  });

  return department;
};

// ==========================================
// GET ALL DEPARTMENTS
// ==========================================

export const getDepartments = async (
  organizationId: string
): Promise<IDepartment[]> => {
  return Department.find({
    organizationId,
  }).sort({ createdAt: -1 });
};

// ==========================================
// GET DEPARTMENT BY ID
// ==========================================

export const getDepartmentById = async (
  id: string,
  organizationId: string
): Promise<IDepartment | null> => {
  return Department.findOne({
    _id: id,
    organizationId,
  });
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
  return Department.findOneAndUpdate(
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
};

// ==========================================
// DELETE DEPARTMENT
// ==========================================

export const deleteDepartment = async (
  id: string,
  organizationId: string
): Promise<IDepartment | null> => {
  return Department.findOneAndDelete({
    _id: id,
    organizationId,
  });
};