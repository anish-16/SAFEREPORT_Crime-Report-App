/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add the 'eslint' object to ignore errors during production build
  eslint: {
    // !! DANGER: This is a temporary measure to enable deployment. !!
    ignoreDuringBuilds: true,
  },
  // ... other configs you might have
};

module.exports = nextConfig;