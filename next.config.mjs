/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Pre-existing lint errors in other files; lint is run separately via `next lint`
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
