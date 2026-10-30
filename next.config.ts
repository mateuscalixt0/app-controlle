import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: {
    useTypeScriptCli: false,
    // Reuse recently visited dynamic pages in this browser, never in a shared server cache.
    staleTimes: { dynamic: 30 },
  },
  reactStrictMode: true,
};

export default nextConfig;
