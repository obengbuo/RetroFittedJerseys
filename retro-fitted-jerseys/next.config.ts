import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "retrofittedjerseys-assets-571841330527-us-east-1-an.s3.us-east-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
