import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.nba.com",
        pathname: "/logos/**",
      },
      {
        protocol: "https",
        hostname: "cdn.wnba.com",
        pathname: "/logos/**",
      },
      {
        protocol: "https",
        hostname: "a.espncdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.balldontlie.io",
        pathname: "/**",
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Redirect www to non-www
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.basktball.com" }],
        destination: "https://basktball.com/:path*",
        permanent: true,
      },
    ];
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["recharts", "lucide-react"],
  },
};

export default nextConfig;
