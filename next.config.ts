import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.1.2', '192.168.1.2:3001'],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/logo.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:path*",
          has: [
            {
              type: "host",
              value: "bilhikma.online",
            },
          ],
          destination: "/fest/ca1ace2d-34f2-4e9e-a8e8-1431a9b2813d/results/:path*",
        },
        {
          source: "/",
          has: [
            {
              type: "host",
              value: "bilhikma.online",
            },
          ],
          destination: "/fest/ca1ace2d-34f2-4e9e-a8e8-1431a9b2813d/results",
        },
        {
          source: "/:path*",
          has: [
            {
              type: "host",
              value: "www.bilhikma.online",
            },
          ],
          destination: "/fest/ca1ace2d-34f2-4e9e-a8e8-1431a9b2813d/results/:path*",
        },
        {
          source: "/",
          has: [
            {
              type: "host",
              value: "www.bilhikma.online",
            },
          ],
          destination: "/fest/ca1ace2d-34f2-4e9e-a8e8-1431a9b2813d/results",
        }
      ],
    };
  },
};

export default nextConfig;
