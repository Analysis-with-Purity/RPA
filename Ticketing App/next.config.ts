import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained Node server build so it can be assembled into a
  // portable `dist/` (see scripts/assemble-dist.mjs) and packaged/deployed.
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
