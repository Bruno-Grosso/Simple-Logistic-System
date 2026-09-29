import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  turbopack: {},
  webpack(config, { dev }) {
    if (process.env.COVERAGE === "true" || dev) {
      config.module.rules.push({
        test: /\.(tsx?|jsx?)$/,
        exclude: [/node_modules/, /\.next/, /cypress/],
        enforce: "post",
        use: [
          {
            loader: path.resolve(__dirname, "scripts/istanbul-loader.js"),
          },
        ],
      });
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
