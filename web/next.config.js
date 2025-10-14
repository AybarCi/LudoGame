/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  // Docker container'da 0.0.0.0 üzerinde dinlemek için
  async rewrites() {
    return []
  },
}

module.exports = nextConfig