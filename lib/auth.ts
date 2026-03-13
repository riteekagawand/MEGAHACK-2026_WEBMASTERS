import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from './mongodb';
import Patient from './models/Patient';

// Cache for user roles to avoid repeated DB calls
const roleCache = new Map<string, { role?: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getUserRole(email: string) {
  const cached = roleCache.get(email);
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return { role: cached.role };
  }
  
  try {
    await connectDB();
    const patient = await Patient.findOne({ userId: email }).lean();
    const result = {
      role: patient?.role
    };
    
    // Cache the result
    roleCache.set(email, {
      ...result,
      timestamp: now
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return { role: undefined };
  }
}

// Function to invalidate cache when role changes
export function invalidateRoleCache(email: string) {
  roleCache.delete(email);
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
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user, trigger }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      
      // Only fetch role on initial sign-in or when explicitly triggered
      if (token.email && (!token.role || trigger === 'update')) {
        const { role } = await getUserRole(token.email);
        token.role = role;
      }
      
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.role = token.role;
      return session;
    },
    async redirect({ url, baseUrl, token }) {
      // Smart redirects based on user state
      if (url.startsWith(baseUrl)) {
        // If user has role, redirect to appropriate dashboard
        if (token?.role === 'clinician') {
          return `${baseUrl}/medical/dashboard`;
        } else if (token?.role === 'patient') {
          return `${baseUrl}/patient/dashboard`;
        }
        return `${baseUrl}/select-role`;
      }
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
