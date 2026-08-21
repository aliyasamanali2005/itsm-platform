import bcrypt from "bcrypt";
import AuthUser from "./auth.model";

// ==========================================
// TYPES
// ==========================================

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "employee";
  organizationId: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  role?: "admin" | "employee";
  isActive?: boolean;
}

// ==========================================
// CREATE USER
// ==========================================

export const createUser = async (
  data: CreateUserData
) => {
  const existingUser = await AuthUser.findOne({
    email: data.email.toLowerCase(),
  });

  if (existingUser) {
    throw new Error(
      "A user with this email already exists"
    );
  }

  const hashedPassword = await bcrypt.hash(
    data.password,
    10
  );

  const user = await AuthUser.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: hashedPassword,
    role: data.role || "employee",
    organizationId: data.organizationId,
  });

  return user;
};

// ==========================================
// GET USERS BY ORGANIZATION
// ==========================================

export const getUsersByOrganization = async (
  organizationId: string
) => {
  return AuthUser.find({
    organizationId,
  })
    .select("-password")
    .sort({ createdAt: -1 });
};

// ==========================================
// GET USER BY ID
// ==========================================

export const getUserById = async (
  id: string,
  organizationId: string
) => {
  return AuthUser.findOne({
    _id: id,
    organizationId,
  }).select("-password");
};

// ==========================================
// UPDATE USER
// ==========================================

export const updateUser = async (
  id: string,
  organizationId: string,
  data: UpdateUserData
) => {
  if (data.email) {
    data.email = data.email.toLowerCase();

    const existingUser = await AuthUser.findOne({
      email: data.email,
      _id: { $ne: id },
    });

    if (existingUser) {
      throw new Error(
        "A user with this email already exists"
      );
    }
  }

  return AuthUser.findOneAndUpdate(
    {
      _id: id,
      organizationId,
    },
    data,
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");
};

// ==========================================
// DEACTIVATE USER
// ==========================================

export const deactivateUser = async (
  id: string,
  organizationId: string
) => {
  return AuthUser.findOneAndUpdate(
    {
      _id: id,
      organizationId,
    },
    {
      isActive: false,
    },
    {
      new: true,
    }
  ).select("-password");
};