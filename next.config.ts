import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Fix for Workspace Root Detection
  turbopack: {
    root: '.'
  },
  experimental: {
    // Next.js 16.1.6: Middleware has moved to 'proxy' file convention
    // Detects src/proxy.ts automatically
  }
};

export default nextConfig;
