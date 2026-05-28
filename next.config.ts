import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a minimal production bundle at .next/standalone with only the
  // runtime deps `server.js` needs. Required by the prod Dockerfile.
  output: "standalone",
};

export default nextConfig;
