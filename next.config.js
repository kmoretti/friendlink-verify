/** @type {import('next').NextConfig} */
const nextConfig = {
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
