
import type {NextConfig} from 'next';

const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

// Base CSP directives
const cspDirectives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://*.firebaseapp.com", "https://apis.google.com"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'img-src': ["'self'", "data:", "blob:", "https://placehold.co", "https://img.buoucoding.com", "https://firebasestorage.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'connect-src': ["'self'", "https://*.googleapis.com", "https://securetoken.googleapis.com", "https://identitytoolkit.googleapis.com", "https://*.firebaseio.com"],
    'frame-src': ["'self'", "https://*.firebaseapp.com"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'block-all-mixed-content': [],
    'upgrade-insecure-requests': [],
};

// Conditionally add Firebase Auth domain if it exists. This makes the config more robust.
if (authDomain) {
    cspDirectives['connect-src'].push(`wss://${authDomain}`);
    cspDirectives['frame-src'].push(`https://${authDomain}`);
}

const cspHeader = Object.entries(cspDirectives)
    .map(([key, value]) => {
        if (value.length === 0) {
            return key;
        }
        return `${key} ${value.join(' ')}`;
    })
    .join('; ');


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
