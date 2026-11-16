import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@orivyn/core", "@orivyn/browser", "@orivyn/actions", "@orivyn/runtime"],
  output: "standalone",
};
export default nextConfig;
