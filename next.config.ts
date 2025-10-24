import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
