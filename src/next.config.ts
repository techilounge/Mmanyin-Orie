
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV !== 'production'
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production'
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/profile',
        destination: '/app/profile',
        permanent: true
      }
    ]
  },
  async headers() {
    // Allow embedding only in dev/Studio when flag is set; keep strict in prod
    const allowIframe = process.env.NEXT_PUBLIC_ALLOW_IFRAME === '1' || process.env.NODE_ENV !== 'production';

    const csp = [
      "default-src 'self'",
      "img-src 'self' data: https: https://firebasestorage.googleapis.com",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://accounts.google.com",
      "connect-src 'self' https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://apis.google.com https://accounts.google.com https://*.cloudworkstations.dev https://firebasestorage.googleapis.com",
      "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://*.cloudworkstations.dev",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          // Only send X-Frame-Options in prod; omit in Studio/dev so embedding works
          ...(!allowIframe ? [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] : []),
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
