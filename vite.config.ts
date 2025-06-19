import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable gzip compression
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            'class-variance-authority',
            'clsx',
            'tailwind-merge'
          ],
          'vendor-maps': ['@googlemaps/js-api-loader', '@react-google-maps/api'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-utils': ['date-fns', 'uuid']
        },
        // Chunk size warning limit
        chunkSizeWarningLimit: 1000,
      },
    },
    // Enable source maps for production
    sourcemap: true,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs'],
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}));
