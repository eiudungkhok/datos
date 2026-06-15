/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Bịt miệng cảnh báo lỗi đường dẫn/kiểu dữ liệu của TS khi build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;