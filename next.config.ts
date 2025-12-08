import type { NextConfig } from "next";
import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    API_URL: 'http://localhost:4000',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, "public/wasm"),
              to: "static/chunks/app/viewer/wasm",
            },
          ],
        })
      );
    }

    return config;
  },
};

export default nextConfig;
