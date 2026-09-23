import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@liveaskew/ui",
    "@liveaskew/api-client",
    "@liveaskew/community",
    "@liveaskew/auth",
  ],
};

export default nextConfig;
