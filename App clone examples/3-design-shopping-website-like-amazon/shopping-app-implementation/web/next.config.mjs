/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // WooCommerce product images come from arbitrary store domains; we use a plain
  // <img> so we don't have to enumerate remote hosts for next/image.
};

export default nextConfig;
