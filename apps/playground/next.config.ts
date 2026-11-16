import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@orivyn/core", "@orivyn/browser", "@orivyn/actions"],
  output: "standalone",
};
export default nextConfig;
