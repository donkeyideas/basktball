import { edgeAuth as auth } from "@/lib/auth/edge";
import { NextResponse } from "next/server";

const WIP_PATHS: string[] = ["/players", "/tools/shot-chart", "/tools/history", "/tools/betting"];

// In-memory maintenance mode flag (refreshed via lightweight Redis check every 60s)
let maintenanceMode = false;
let maintenanceCheckedAt = 0;

async function checkMaintenanceMode(): Promise<boolean> {
  if (Date.now() - maintenanceCheckedAt < 60_000) return maintenanceMode;
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return false;
    const res = await fetch(`${url}/get/basktball:settings:maintenanceMode`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      maintenanceMode = data.result === "true";
    }
    maintenanceCheckedAt = Date.now();
  } catch {
    // If Redis can't be reached, don't block
  }
  return maintenanceMode;
}

export default auth(async (req) => {
  const pathname = req.nextUrl.pathname;

  // Maintenance mode — block public pages, allow admin access
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdminPath) {
    const isMaintenance = await checkMaintenanceMode();
    if (isMaintenance) {
      return new NextResponse(
        '<html><body style="background:#0a0a1a;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui"><div style="text-align:center"><h1 style="font-size:48px;margin-bottom:16px">BASKTBALL</h1><p style="color:rgba(255,255,255,0.6);font-size:18px">We\'re performing scheduled maintenance. We\'ll be back shortly.</p></div></body></html>',
        { status: 503, headers: { "Content-Type": "text/html", "Retry-After": "300" } }
      );
    }
  }

  // Hide WIP pages in production (redirect to home)
  if (!process.env.NEXT_PUBLIC_SHOW_WIP_PAGES) {
    const isWipPage = WIP_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (isWipPage) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  // Admin auth
  const isLoggedIn = !!req.auth;
  const isOnAdmin = pathname.startsWith("/admin");
  const isOnLogin = pathname === "/admin/login";

  if (isOnAdmin && !isOnLogin && !isLoggedIn) {
    return Response.redirect(new URL("/admin/login", req.nextUrl));
  }

  if (isOnLogin && isLoggedIn) {
    return Response.redirect(new URL("/admin", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/",
    "/live/:path*",
    "/news/:path*",
    "/player/:path*",
    "/game/:path*",
    "/admin/:path*",
    "/stats/:path*",
    "/tools/:path*",
    "/players/:path*",
    "/teams/:path*",
    "/standings/:path*",
    "/scores/:path*",
    "/schedule/:path*",
    "/playoffs/:path*",
    "/forum/:path*",
    "/login",
    "/register",
  ],
};
