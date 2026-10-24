import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep localhost at /; deploy the app and its assets under the public route.
  basePath: process.env.PASSWORD_BASE_PATH || '',
};

export default nextConfig;
