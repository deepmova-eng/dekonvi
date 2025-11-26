import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: process.env.NODE_ENV !== 'production',
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  build: {
    sourcemap: true,
  },
  server: {
    host: true,
    port: 5173
  }
});