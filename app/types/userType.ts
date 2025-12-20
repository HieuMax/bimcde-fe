export class User {
  id?: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  phone?: string;
  role?: UserRole;
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}
