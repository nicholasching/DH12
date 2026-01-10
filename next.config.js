/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Ensure proper handling of domain through Cloudflare Tunnel
  // Next.js will automatically detect the hostname from the request headers
}

module.exports = nextConfig
