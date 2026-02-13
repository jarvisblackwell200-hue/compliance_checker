import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error -- Next.js 16 supports this but types lag behind
  authInterrupts: false,
};

export default nextConfig;
