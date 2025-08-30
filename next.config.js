

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.buoucoding.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
       {
        protocol: 'https',
        hostname: '6000-firebase-studio-1751667472332.cluster-joak5ukfbnbyqspg4tewa33d24.cloudworkstations.dev',
      }
    ],
  },
};

module.exports = nextConfig;
