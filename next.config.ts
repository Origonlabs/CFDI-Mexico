import type {NextConfig} from 'next';

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.firebaseapp.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://placehold.co https://img.buoucoding.com https://firebasestorage.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.googleapis.com wss://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN} https://*.firebaseio.com;
    frame-src 'self' https://*.firebaseapp.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();


const nextConfig: NextConfig = {
  /* config options here */
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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.buoucoding.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin'
          },
          {
              key: 'Permissions-Policy',
              value: "camera=(), microphone=(), geolocation=()"
          }
        ],
      },
    ]
  },
};

export default nextConfig;
