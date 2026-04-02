import type { DefaultSession } from "next-auth"
import type { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string
    role?: string
    hasCompletedInfo?: boolean
    verificationStatus?: "pending" | "verified" | "rejected"
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string
    role?: string
    hasCompletedInfo?: boolean
    verificationStatus?: "pending" | "verified" | "rejected"
  }
}

