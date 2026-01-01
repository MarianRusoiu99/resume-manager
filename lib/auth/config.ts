import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/index";
import { verifyPassword } from "@/lib/auth/password";
import { env } from "@/lib/config";

export const authConfig: NextAuthConfig = {
  basePath: "/api/v1/auth",
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, passwordHash: true, isAdmin: true },
        });

        if (!user) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        const isAdmin = user.isAdmin || env.adminEmails.includes(user.email.toLowerCase());

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin,
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    // Session expires after 24 hours
    maxAge: 60 * 60 * 24, // 24 hours
    // Update session every 15 minutes to extend it on activity
    updateAge: 60 * 15,
  },
  // JWT token configuration
  jwt: {
    // Token expires same as session
    maxAge: 60 * 60 * 24, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true, // Required for NextAuth v5 to prevent CSRF errors
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
