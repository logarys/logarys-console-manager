import { Document } from "mongodb";

export interface User extends Document {
  id: string;
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    isEnabled: user.isEnabled,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
