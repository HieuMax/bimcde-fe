import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    API_URL: 'http://localhost:4000',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/_next/static/chunks/wasm/:path*',
        destination: '/wasm/:path*',
      },
    ];
  },
};

export default nextConfig;
