/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@x402/evm", "@x402/fetch", "@x402/core"],
};

export default nextConfig;
