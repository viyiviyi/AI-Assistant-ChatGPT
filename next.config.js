/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    SALT: '$SALT',
  },
};
module.exports = nextConfig;
