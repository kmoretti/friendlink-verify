/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/embed.js',
        destination: '/embed-script',
      },
    ]
  },
}
module.exports = nextConfig
