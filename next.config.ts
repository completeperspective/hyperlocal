import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['graphql'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
