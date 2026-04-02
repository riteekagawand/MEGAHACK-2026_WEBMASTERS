import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from './mongodb';
import Patient from './models/Patient';

// Debug: Log env vars (remove after fixing)
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID?.slice(0, 20) + "...");
console.log("GOOGLE_CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET);

// Cache for user state to avoid repeated DB calls
const userStateCache = new Map<
  string,
  { role?: string; hasCompletedInfo?: boolean; verificationStatus?: string; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getUserState(email: string) {
  const cached = userStateCache.get(email);
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return { 
      role: cached.role, 
      hasCompletedInfo: cached.hasCompletedInfo,
      verificationStatus: cached.verificationStatus
    };
  }
  
  try {
    await connectDB();
    const patient = await Patient.findOne({ userId: email }).lean();
    const result = {
      role: patient?.role,
      hasCompletedInfo: patient?.hasCompletedInfo ?? false,
      verificationStatus: patient?.verificationStatus,
    };
    
    // Cache the result
    userStateCache.set(email, {
      ...result,
      timestamp: now
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return { role: undefined, hasCompletedInfo: undefined, verificationStatus: undefined };
  }
}

// Function to invalidate cache when role/info changes
export function invalidateRoleCache(email: string) {
  userStateCache.delete(email);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          select_account: true,
        },
      },
      httpOptions: {
        timeout: 30000,
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user, trigger }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      
      // Fetch role + completion status + verification status on initial sign-in or when explicitly triggered
      if (token.email && (trigger === 'update' || token.role === undefined || token.hasCompletedInfo === undefined || token.verificationStatus === undefined)) {
        const { role, hasCompletedInfo, verificationStatus } = await getUserState(token.email);
        token.role = role;
        token.hasCompletedInfo = hasCompletedInfo;
        token.verificationStatus = verificationStatus;
      }
      
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.role = token.role;
      session.hasCompletedInfo = token.hasCompletedInfo;
      session.verificationStatus = token.verificationStatus;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Keep redirects on-site; otherwise fall back to app entry.
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return `${baseUrl}/select-role`;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
