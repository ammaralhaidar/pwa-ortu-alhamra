/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const odooUrl = process.env.NEXT_PUBLIC_ODOO_URL || 'http://localhost:10016';
    return [
      // Proxy all Odoo API calls through Next.js to avoid CORS
      {
        source: '/odoo/:path*',
        destination: `${odooUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
