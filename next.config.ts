import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['swagger-ui-react', 'swagger-client'],
};

export default nextConfig;
