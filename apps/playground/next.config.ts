import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@orivyn/core"],
  output: "standalone",
};
export default nextConfig;
