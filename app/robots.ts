import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/forum/", "/login", "/register", "/profile", "/mobile-auth"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/forum/", "/login", "/register", "/profile", "/mobile-auth"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/forum/",
          "/login",
          "/register",
          "/profile",
          "/mobile-auth",
          "/*?*sort=",
          "/*?*filter=",
          "/*?*page=",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
