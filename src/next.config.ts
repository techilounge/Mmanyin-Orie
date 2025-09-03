// next.config.ts
import type {NextConfig} from 'next';

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  // XHR/fetch/websocket targets used by Firebase
  "connect-src 'self' https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://apis.google.com https://accounts.google.com https://firebasestorage.googleapis.com https://*.firebasestorage.app",
  // Allow images from Storage and data URLs (for previews)
  "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://*.firebasestorage.app https://*.googleusercontent.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
].join('; ');

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
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com'
      },
       {
        protocol: 'https',
        hostname: '*.firebasestorage.app'
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com'
      }
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
    // This will be used in production, but Studio has its own, more restrictive CSP
     return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
