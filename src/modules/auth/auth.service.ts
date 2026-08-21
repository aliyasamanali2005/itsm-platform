import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import AuthUser, { IAuthUser } from "./auth.model";
import Organization from "../organization/organization.model";

interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "employee";
  organizationId: string;
}

interface LoginUserData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "employee";
    organizationId: string;
  };
  token: string;
}

// ==========================================
// REGISTER USER
// ==========================================

export const registerUser = async (
  data: RegisterUserData
): Promise<AuthResponse> => {
  const existingUser = await AuthUser.findOne({
    email: data.email.toLowerCase(),
  });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const organization = await Organization.findById(
    data.organizationId
  );

  if (!organization) {
    throw new Error("Organization not found");
  }

  if (!organization.isActive) {
    throw new Error("Organization is inactive");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await AuthUser.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: hashedPassword,
    role: data.role || "employee",
    organizationId: data.organizationId,
  });

  const token = generateToken(user);

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId.toString(),
    },
    token,
  };
};

// ==========================================
// LOGIN USER
// ==========================================

export const loginUser = async (
  data: LoginUserData
): Promise<AuthResponse> => {
  const user = await AuthUser.findOne({
    email: data.email.toLowerCase(),
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("User account is inactive");
  }

  const organization = await Organization.findById(
    user.organizationId
  );

  if (!organization) {
    throw new Error("Organization not found");
  }

  if (!organization.isActive) {
    throw new Error("Organization is inactive");
  }

  const passwordMatch = await bcrypt.compare(
    data.password,
    user.password
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user);

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId.toString(),
    },
    token,
  };
};

// ==========================================
// GENERATE JWT
// ==========================================

const generateToken = (user: IAuthUser): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId.toString(),
    },
    secret,
    {
      expiresIn: "7d",
    }
  );
};