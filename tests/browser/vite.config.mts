import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  resolve: { alias: [
    { find: '@/app/boletos/novo/actions', replacement: resolve('tests/browser/harness/actions.ts') },
    { find: '@/lib/supabase/client', replacement: resolve('tests/browser/harness/actions.ts') },
    { find: 'next/navigation', replacement: resolve('tests/browser/harness/actions.ts') },
    { find: '@', replacement: resolve('src') },
  ] },
  esbuild: { jsx: 'automatic' },
  server: { host: '127.0.0.1', port: 4173 },
});
