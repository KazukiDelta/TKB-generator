import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Next from inferring `C:\...\tkb` as the workspace root (it sees the extra lockfile)
    // which breaks module resolution for Tailwind (it then looks for `tailwindcss` in the wrong folder).
    root: process.cwd(),
  },
};

export default nextConfig;
