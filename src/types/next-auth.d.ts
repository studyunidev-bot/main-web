import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      role_id: number | string;
      siteKey: string;
    } & DefaultSession["user"];
    accessToken?: string;
    error?: string;
    refreshToken?: string;
  }

  interface User extends DefaultUser {
    role: string;
    role_id: number | string;
    siteKey: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    role_id: number | string;
    id: string;
    siteKey: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
