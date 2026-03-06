import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      username: string;
      role: string;
      roleLevel: number;
      permissions: string[];
      profilePhoto?: string;
      schoolId?: string;
    };
  }
  interface User {
    id: string;
    username: string;
    role: string;
    roleLevel: number;
    permissions: string[];
    profilePhoto?: string;
    schoolId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: string;
    roleLevel: number;
    permissions: string[];
    profilePhoto?: string;
    schoolId?: string;
  }
}
