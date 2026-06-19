import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    appDir: true, // ← THIS tells Next.js to use src/app
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
