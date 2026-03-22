import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Disabling reactCompiler as the plugin is missing in current environment
    // reactCompiler: true, 
  }
};

export default nextConfig;
