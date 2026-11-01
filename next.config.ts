import type { NextConfig } from "next";

const isCloudflarePagesBuild = process.env.CLOUDFLARE_PAGES_BUILD === "1";

const nextConfig: NextConfig = {
  pageExtensions: isCloudflarePagesBuild ? ["tsx", "pages.tsx"] : ["ts", "tsx", "worker.tsx"],
  ...(isCloudflarePagesBuild
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
