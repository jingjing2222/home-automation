import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  outDir: 'dist',
  format: 'esm',
  bundle: true,
  minify: true,
  shims: true,
  platform: 'node',
  external: [],
  // 모든 의존성 번들링
  noExternal: [
    '@electric-sql/pglite',
    '@hono/node-server',
    '@hono/trpc-server',
    '@trpc/server',
    'hono',
    'zod',
  ],
});
