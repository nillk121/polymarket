/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@polymarket/shared-types',
    '@polymarket/shared-utils',
    '@polymarket/analytics-sdk',
  ],
};

module.exports = nextConfig;

