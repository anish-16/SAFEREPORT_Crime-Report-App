import type { NextConfig } from 'next';

/**
 * Split dev (npm run dev:split) runs the UI on :3000 and the API on :4000 —
 * proxy API + media calls so the browser always talks to ONE origin. The
 * unified server (npm run dev / npm start) answers /api and /uploads itself
 * before Next.js ever sees the request, so the proxy is dev-only and never
 * present in production builds.
 */
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    return [
      { source: '/api/:path*', destination: `${API_PROXY_TARGET}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API_PROXY_TARGET}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
