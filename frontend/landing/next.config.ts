import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker deployment — produces a self-contained server.js bundle
  output: "standalone",
  reactCompiler: true,
};

export default nextConfig;
