import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@orivyn/core", "@orivyn/browser"],
  output: "standalone",
};
export default nextConfig;
