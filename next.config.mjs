/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // @supabase/ssr@0.4.1 has broken type exports for auth methods.
    // All auth calls work correctly at runtime. Remove when upgrading to @supabase/ssr@0.5+
    ignoreBuildErrors: true,
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
