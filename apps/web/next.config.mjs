/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // ESLint runs in the IDE — no need to block production builds
        ignoreDuringBuilds: true,
    },
    images: {
        // Allow Clerk's hosted avatar domains
        remotePatterns: [
            { protocol: 'https', hostname: 'img.clerk.com' },
            { protocol: 'https', hostname: 'images.clerk.dev' },
        ],
    },
};

export default nextConfig;

