
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
    ],
    // Permitir imágenes desde el mismo dominio para el logo.
    // Esto se infiere y no necesita un 'hostname' explícito cuando es el mismo servidor.
  },
};

module.exports = nextConfig;
