import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['artstutoring01.iconroof.co.th', 'localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
