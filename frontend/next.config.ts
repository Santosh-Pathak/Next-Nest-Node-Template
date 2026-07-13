import type { NextConfig } from 'next'

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
