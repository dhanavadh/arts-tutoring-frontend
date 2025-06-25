import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://artstutoring01.iconroof.co.th/**')],
  },
};

export default nextConfig;
