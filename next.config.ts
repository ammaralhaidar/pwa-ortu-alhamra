/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const odooUrl = process.env.NEXT_PUBLIC_ODOO_URL || 'https://sipp.ibsalhamra.sch.id';
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
