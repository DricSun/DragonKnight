import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        assetFileNames: (assetInfo) => {
          // Preserve the original folder structure for assets
          const extType = assetInfo.name.split('.').at(1);
          if (/glb|gltf|hdr|fbx/i.test(extType)) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      }
    },
    // Ensure asset files are copied to dist
    copyPublicDir: true,
  },
  publicDir: 'assets',
  server: {
    fs: {
      allow: ['..']
    }
  },
  resolve: {
    alias: {
      '@assets': resolve(__dirname, 'assets')
    }
  }
});