// Simplified Vite config for Vercel
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    target: 'es2015',
    minify: 'esbuild',
    assetsInlineLimit: 0,
    // Use minimal options for compatibility
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      }
    },
  },
  publicDir: 'assets',
  // Disable optimization features that might cause issues
  optimizeDeps: {
    disabled: false,
    esbuildOptions: {
      // Needed to work around some rollup/esbuild issues
      target: 'es2015'
    }
  }
}); 