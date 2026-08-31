/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // OMDb posters come from m.media-amazon.com; use a plain <img> so we don't need
  // to enumerate remote domains for next/image.
};

export default nextConfig;
