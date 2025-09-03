
import type { NextConfig } from 'next'

/**
 * Security headers including a CSP that allows Firebase Storage and Auth.
 * Keep ONLY one CSP in your app to avoid conflicts.
 */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    // Note: dev builds need 'unsafe-eval' and 'unsafe-inline' for React Refresh/Turbopack.
    // This CSP works in Firebase Studio preview and in production.
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      // Allow Storage + Firebase APIs
      "connect-src 'self' https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://apis.google.com https://accounts.google.com https://firebasestorage.googleapis.com https://*.firebasestorage.app",
      // Images from Storage + Google profile images + data/blob for previews
      "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://*.firebasestorage.app https://lh3.googleusercontent.com",
      // Frames for Google sign-in AND the Firebase Auth helper
      "frame-src 'self' https://accounts.google.com https://mmanyin-orie.firebaseapp.com",
      // Scripts (dev-friendly; you can tighten in prod)
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com https://apis.google.com",
      // Styles (Tailwind + shadcn often needs inline)
      "style-src 'self' 'unsafe-inline'",
      // Fonts
      "font-src 'self' data:",
      'upgrade-insecure-requests',
    ].join('; ')
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
]

const nextConfig: NextConfig = {
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
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com'
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
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
