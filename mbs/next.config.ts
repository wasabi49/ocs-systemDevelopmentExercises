import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    styledComponents: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'github.dev'
      ]
    }
  }
};

export default nextConfig;
