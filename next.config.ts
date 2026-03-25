import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Fix for Workspace Root Detection using absolute path
  turbopack: {
    root: path.resolve(__dirname)
  },
  experimental: {
    // Next.js 16.1.6: Middleware has moved to 'proxy' file convention
  }
};

export default nextConfig;
