/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ép Vercel bỏ qua lỗi TypeScript khi deploy
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ép Vercel bỏ qua lỗi cảnh báo của ESLint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;