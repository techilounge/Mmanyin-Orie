
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
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
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
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      // Fonts and inline images (favicons, data URLs)
      "font-src 'self' data:",
      "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://*.googleusercontent.com https://lh3.googleusercontent.com https://mmanyin-orie.firebasestorage.app",
      // Uploads / downloads (XHR/fetch/WebSocket)
      "connect-src 'self' https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://apis.google.com https://accounts.google.com https://www.googleapis.com https://firebasestorage.googleapis.com https://mmanyin-orie.firebasestorage.app",
      // Optional if you use <video>/<audio> directly from Storage
      "media-src 'self' blob: https://firebasestorage.googleapis.com https://mmanyin-orie.firebasestorage.app",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
      "style-src 'self' 'unsafe-inline'",
      "frame-src https://accounts.google.com"
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]
      }
    ];
  },
};

export default nextConfig;
