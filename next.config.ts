import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/membership',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/membership/success',
        destination: '/dashboard/success',
        permanent: true,
      },
    ]
  },
  output: 'standalone',
  serverExternalPackages: ['graphql', 'ox', 'viem'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
        search: '',
      },
    ],
  },
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // @walletconnect and @metamask packages optionally require React Native
      // async storage and pino-pretty, which don't exist in a web/Node context.
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
      // wagmi v3 made connector SDK dependencies optional peer deps.
      // @reown/appkit-adapter-wagmi pulls in @wagmi/connectors which references
      // all of these, but AppKit manages its own connector setup so we don't
      // need the underlying SDKs directly.
      '@coinbase/wallet-sdk': false,
      '@metamask/connect-evm': false,
      '@walletconnect/ethereum-provider': false,
      porto: false,
      accounts: false,
    }
    return config
  },
}

export default nextConfig
