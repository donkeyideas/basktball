import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

// Verify Firebase ID token via Google's public token verification endpoint
async function verifyFirebaseToken(idToken: string) {
  const FIREBASE_API_KEY = "AIzaSyAc6bTd2eOnMSmltb8B_dSZtX_kEsxVrCQ";
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const user = data.users?.[0];
  if (!user) return null;

  return {
    email: user.email as string,
    name: user.displayName as string | undefined,
    image: user.photoUrl as string | undefined,
    firebaseUid: user.localId as string,
    emailVerified: user.emailVerified as boolean,
  };
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        firebaseToken: { label: "Firebase Token", type: "text" },
      },
      async authorize(credentials) {
        const firebaseToken = credentials?.firebaseToken as string | undefined;

        // Firebase Auth flow (Google sign-in via Firebase)
        if (firebaseToken) {
          const firebaseUser = await verifyFirebaseToken(firebaseToken);
          if (!firebaseUser || !firebaseUser.email) return null;

          // Find or create user in our database
          let user = await prisma.user.findUnique({
            where: { email: firebaseUser.email.toLowerCase() },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: firebaseUser.email.toLowerCase(),
                name: firebaseUser.name || null,
                image: firebaseUser.image || null,
                emailVerified: firebaseUser.emailVerified ? new Date() : null,
                role: "USER",
              },
            });
          } else {
            // Update image/name from Google if not set
            if (!user.image && firebaseUser.image) {
              await prisma.user.update({
                where: { id: user.id },
                data: { image: firebaseUser.image },
              });
            }
          }

          // Check ban status
          if (user.status === "BANNED") return null;
          if (user.status === "SUSPENDED" && user.bannedUntil && user.bannedUntil > new Date()) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.displayName || user.name,
            image: user.avatarUrl || user.image,
            role: user.role,
          };
        }

        // Regular email/password flow
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Check ban status
        if (user.status === "BANNED") return null;
        if (
          user.status === "SUSPENDED" &&
          user.bannedUntil &&
          user.bannedUntil > new Date()
        ) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || user.name,
          image: user.avatarUrl || user.image,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.userId = user.id;
      }
      // On session update, refresh role from DB
      if (trigger === "update" && token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { role: true, status: true, displayName: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnAdminLogin = nextUrl.pathname === "/admin/login";

      if (isOnAdmin && !isOnAdminLogin) {
        if (!isLoggedIn) return false;
        const role = (auth?.user as { role?: string })?.role;
        if (role !== "ADMIN" && role !== "EDITOR") {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (isOnAdminLogin && isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl));
      }

      return true;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },
};
