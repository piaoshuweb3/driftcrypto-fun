import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  // Vercel manages its own output format. The standalone bundle is only
  // needed for self-hosted deploys (and the matching `npm run start`).
  output: process.env.VERCEL ? undefined : "standalone",
  // Pin file tracing / Turbopack to THIS project. Without it Next walks up,
  // finds C:\Users\Administrator\package-lock.json, treats the user home as the
  // workspace root and emits standalone output nested under Desktop/ — so
  // .next/standalone/server.js is never created and `npm start` fails.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  /* config options here */
  typescript: {
    // Type errors must fail the build. Silencing them hid real bugs; the
    // codebase is currently at 0 errors under `bunx tsc --noEmit`.
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
};

export default nextConfig;
