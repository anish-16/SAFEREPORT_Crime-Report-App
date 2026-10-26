import type { NextConfig } from 'next';

/**
 * The frontend IS the whole app now: API route handlers live under app/api,
 * evidence files are served by app/uploads/[...path], so no dev proxy and no
 * external backend are involved. Heavy Node-only packages (image forensics,
 * Prisma, bcrypt) stay outside the bundle.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    'jimp',
    'exifr',
    '@prisma/client',
    'bcryptjs',
    'jsonwebtoken',
    '@ffmpeg-installer/ffmpeg',
  ],
};

export default nextConfig;
