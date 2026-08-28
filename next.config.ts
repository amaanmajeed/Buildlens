import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // ponytail: turbopack mis-inferred workspace root in this environment
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
