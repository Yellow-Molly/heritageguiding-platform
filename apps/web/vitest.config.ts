import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Load .env / .env.local / .env.[mode][.local] into process.env so integration
  // tests that read DATABASE_URL, PAYLOAD_SECRET, etc. work without manually exporting.
  // Third arg '' disables Vite's VITE_-only prefix filter so backend vars come through.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['**/*.test.ts', '**/*.test.tsx'],
      setupFiles: ['./vitest.setup.ts'],
      // Integration tests that boot Payload + pull DB schema are slow (~5–10s cold).
      // Default 5s timeout is too tight; bump to 30s globally — fast tests are unaffected.
      testTimeout: 30_000,
      hookTimeout: 30_000,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['lib/**/*.ts'],
        exclude: [
          '**/*.test.ts',
          '**/index.ts',
          'lib/bokun/bokun-types.ts', // Type-only, no runtime code
          'lib/fonts.ts', // next/font/google module-level config
        ],
        thresholds: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, '.'),
        '@payload-config': resolve(__dirname, '../../packages/cms/payload.config.ts'),
        '@cms': resolve(__dirname, '../../packages/cms'),
      },
    },
  }
})
