import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@insforge/sdk'],
  allowedDevOrigins: ['192.168.0.87'],
};

export default nextConfig;