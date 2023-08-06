/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
   exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/': { page: '/' },
    }
  },
  images: { unoptimized: true },
  env: {},
};
module.exports = nextConfig;
