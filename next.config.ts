import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure SQLite file is bundled into Vercel serverless functions
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/dev.db"],
    "/dashboard/**/*": ["./prisma/dev.db"],
  },
};

export default nextConfig;
