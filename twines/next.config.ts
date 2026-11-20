import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Lets wrong-role pages call forbidden() and answer a real HTTP 403 (AUTH-15).
    authInterrupts: true,
  },
};

export default nextConfig;
