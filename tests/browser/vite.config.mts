import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  resolve: { alias: [
    { find: '@/app/boletos/novo/actions', replacement: resolve('tests/browser/harness/actions.ts') },
    { find: '@/app/compras/actions', replacement: resolve('tests/browser/harness/actions.ts') },
    { find: '@/app/faltas/novo/actions', replacement: resolve('tests/browser/harness/actions.ts') },
    { find: '@/lib/supabase/client', replacement: resolve('tests/browser/harness/actions.ts') },
    { find: 'next/navigation', replacement: resolve('tests/browser/harness/actions.ts') },
    { find: 'next/cache', replacement: resolve('tests/browser/harness/actions.ts') },
    { find: 'next/link', replacement: resolve('tests/browser/harness/link.tsx') },
    { find: '@', replacement: resolve('src') },
  ] },
  esbuild: { jsx: 'automatic' },
  server: { host: '127.0.0.1', port: Number(process.env.PLAYWRIGHT_PORT || 4173) },
});
