import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@liveaskew/ui",
    "@liveaskew/auth",
    "@liveaskew/community",
    "@liveaskew/api-client",
  ],
};

export default nextConfig;
