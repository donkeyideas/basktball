import type { NextAuthConfig } from "next-auth";

/**
 * Lightweight auth config for Edge middleware.
 * Does NOT import Prisma, bcrypt, or Firebase — those are only
 * needed during sign-in, which happens in the full config (config.ts).
 */
export const edgeAuthConfig: NextAuthConfig = {
  providers: [], // Providers are only needed for sign-in, not middleware checks

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.userId = user.id;
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
