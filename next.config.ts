import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The project sits directly under the home directory; pin the workspace root so
  // Turbopack does not walk up and try to include everything above it.
  turbopack: { root: path.resolve(import.meta.dirname) },
};

export default nextConfig;
