/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ouma-family-event/common', '@ouma-family-event/api'],
  output: 'export', // 静的エクスポート形式（S3 + CloudFront用）
  trailingSlash: true,
  images: {
    unoptimized: true, // 静的エクスポートでは画像最適化を無効化
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'www.walkerplus.com',
      },
      {
        protocol: 'https',
        hostname: '**.walkerplus.com',
      },
    ],
  },
  eslint: {
    // ビルド時にESLintの警告をエラーとして扱わない
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ビルド時にTypeScriptの型エラーを無視
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

