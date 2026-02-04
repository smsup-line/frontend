/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
