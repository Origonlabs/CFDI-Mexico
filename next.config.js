

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de TypeScript - Solo ignorar en desarrollo
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  // Configuración de ESLint - Solo ignorar en desarrollo
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  // Configuración de imágenes
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
        hostname: 'placehold.co',
      }
    ],
  },
  // Configuración de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  // Configuración de redirecciones
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/',
        permanent: true,
      },
    ];
  },
  // Configuración de compresión
  compress: true,
  // Configuración de powerdBy
  poweredByHeader: false,
  // Configuración de experimental features
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
};

module.exports = nextConfig;
