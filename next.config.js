/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['tom-ten-kappa.vercel.app'],
    unoptimized: true,
  },
  // Zajistíme, že statické soubory budou správně servírované
  async rewrites() {
    return [
      {
        source: '/Images/:path*',
        destination: '/Images/:path*',
      },
    ];
  },
  // Nastavení pro statické soubory
  async headers() {
    return [
      {
        source: '/Images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 