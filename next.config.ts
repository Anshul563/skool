import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io", // Allow images from UploadThing
      },
    ],
  },
};

export default nextConfig;
