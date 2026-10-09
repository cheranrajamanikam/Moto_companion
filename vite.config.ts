import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      proxy: {
        '/api/map': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
      headers: {
        'Content-Security-Policy': "worker-src blob: ; child-src blob: ;",
      },
    },
  },
});