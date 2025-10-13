import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  experimental: {
    outputFileTracingRoot: undefined,
  },
};

export default nextConfig;
