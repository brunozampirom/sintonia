import { fileURLToPath } from "node:url";
import path from "node:path";
import type { NextConfig } from "next";

// Monorepo root — tells Turbopack/Webpack to stop walking up looking for lockfiles
const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const config: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: monorepoRoot,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default config;
