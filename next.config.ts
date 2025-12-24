import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: "https://bimcde-be-dev.vercel.app/api",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "resources.connect.trimble.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "pub-94a7e3af32ab4e34b3903187fd7e7b72.r2.dev",
      },
    ],
  },
  reactStrictMode: false,
};

export default nextConfig;
