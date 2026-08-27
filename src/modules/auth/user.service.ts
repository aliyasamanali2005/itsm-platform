import bcrypt from "bcrypt";
import mongoose from "mongoose";

import { authRepository } from "./auth.repository";

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
  // ------------------------------------------
  // VALIDATE ORGANIZATION ID
  // ------------------------------------------

  if (
    !mongoose.Types.ObjectId.isValid(
      data.organizationId
    )
  ) {
    throw new Error(
      "Invalid organization ID"
    );
  }

  const organizationObjectId =
    new mongoose.Types.ObjectId(
      data.organizationId
    );

  // ------------------------------------------
  // NORMALIZE EMAIL
  // ------------------------------------------

  const email =
    data.email.toLowerCase().trim();

  // ------------------------------------------
  // CHECK DUPLICATE EMAIL
  // ------------------------------------------

  const existingUser =
    await authRepository.findByEmail(email);

  if (existingUser) {
    throw new Error(
      "A user with this email already exists"
    );
  }

  // ------------------------------------------
  // HASH PASSWORD
  // ------------------------------------------

  const hashedPassword =
    await bcrypt.hash(
      data.password,
      10
    );

  // ------------------------------------------
  // CREATE USER
  // ------------------------------------------

  return authRepository.create({
    name: data.name,
    email,
    password: hashedPassword,
    role: data.role || "employee",
    organizationId:
      organizationObjectId,
  });
};

// ==========================================
// GET USERS BY ORGANIZATION
// ==========================================

export const getUsersByOrganization = async (
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

  return authRepository.findAllByOrganization(
    organizationId
  );
};

// ==========================================
// GET USER BY ID
// ==========================================

export const getUserById = async (
  id: string,
  organizationId: string
) => {
  if (
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    return null;
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      organizationId
    )
  ) {
    throw new Error(
      "Invalid organization ID"
    );
  }

  return authRepository.findUserByIdAndOrganization(
    id,
    organizationId
  );
};

// ==========================================
// UPDATE USER
// ==========================================

export const updateUser = async (
  id: string,
  organizationId: string,
  data: UpdateUserData
) => {
  // ------------------------------------------
  // VALIDATE IDS
  // ------------------------------------------

  if (
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    return null;
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      organizationId
    )
  ) {
    throw new Error(
      "Invalid organization ID"
    );
  }

  // ------------------------------------------
  // PREPARE UPDATE DATA
  // ------------------------------------------

  const updateData: UpdateUserData = {
    ...data,
  };

  // ------------------------------------------
  // NORMALIZE + CHECK EMAIL
  // ------------------------------------------

  if (updateData.email) {
    updateData.email =
      updateData.email
        .toLowerCase()
        .trim();

    const existingUser =
      await authRepository.findByEmailExcludingId(
        updateData.email,
        id
      );

    if (existingUser) {
      throw new Error(
        "A user with this email already exists"
      );
    }
  }

  // ------------------------------------------
  // UPDATE USER
  // ------------------------------------------

  return authRepository.updateByIdAndOrganization(
    id,
    organizationId,
    updateData
  );
};

// ==========================================
// DEACTIVATE USER
// ==========================================

export const deactivateUser = async (
  id: string,
  organizationId: string
) => {
  if (
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    return null;
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      organizationId
    )
  ) {
    throw new Error(
      "Invalid organization ID"
    );
  }

  return authRepository.deactivateByIdAndOrganization(
    id,
    organizationId
  );
};