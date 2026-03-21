/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow large request bodies for PDF email sending (up to 20MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  // @react-pdf/renderer is an ESM package — treat it as external on server
  transpilePackages: ['@react-pdf/renderer'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      }
    }
    return config
  },
}

export default nextConfig
