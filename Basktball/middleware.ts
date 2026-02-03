import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAdmin = req.nextUrl.pathname.startsWith("/admin");
  const isOnLogin = req.nextUrl.pathname === "/admin/login";

  if (isOnAdmin && !isOnLogin && !isLoggedIn) {
    return Response.redirect(new URL("/admin/login", req.nextUrl));
  }

  if (isOnLogin && isLoggedIn) {
    return Response.redirect(new URL("/admin", req.nextUrl));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
