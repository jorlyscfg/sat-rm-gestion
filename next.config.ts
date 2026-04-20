import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@insforge/sdk'],
  allowedDevOrigins: ['192.168.0.87'],
};

export default nextConfig;