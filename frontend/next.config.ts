import type { NextConfig } from 'next'

const apiProxyTarget =
   process.env.API_PROXY_TARGET || 'http://localhost:3001'

const nextConfig: NextConfig = {
   output: 'standalone',
   typescript: {
      // Prefer fixing types; keep false in CI once the codebase is clean.
      ignoreBuildErrors: process.env.CI === 'true' ? false : true,
   },
   images: {
      remotePatterns: [
         {
            protocol: 'https',
            hostname: '**.blob.core.windows.net',
            port: '',
            pathname: '/**',
         },
      ],
   },
   /**
    * Same-origin /api proxy so Nest can set httpOnly cookies on the FE host.
    * Set NEXT_PUBLIC_API_BASE_URL="" (default) and API_PROXY_TARGET to the Nest URL.
    */
   async rewrites() {
      return [
         {
            source: '/api/:path*',
            destination: `${apiProxyTarget}/api/:path*`,
         },
      ]
   },
   async headers() {
      return [
         {
            source: '/(.*)',
            headers: [
               {
                  key: 'Access-Control-Allow-Origin',
                  value: '*',
               },
               {
                  key: 'Access-Control-Allow-Methods',
                  value: 'GET, POST, PUT, DELETE, OPTIONS',
               },
               {
                  key: 'Access-Control-Allow-Headers',
                  value: 'Content-Type, Authorization',
               },
            ],
         },
      ]
   },
}

export default nextConfig
