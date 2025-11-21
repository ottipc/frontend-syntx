import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateBuildId: async () => {
    // Erzwingt neue Build-ID bei jedem Build
    return `build-${Date.now()}`;
  },
  // Deaktiviert Vercel CDN Caching für JS-Dateien
  headers: async () => {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
