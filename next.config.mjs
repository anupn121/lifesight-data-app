/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/lifesight-data-app',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
