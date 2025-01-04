import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: '/GrassAppSitev2/',
  server: {
    port: 3001,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          tween: ['@tweenjs/tween.js']
        }
      }
    },
<<<<<<< HEAD
    assetsInlineLimit: 0
  },
  publicDir: 'public',
  assetsInclude: ['**/*.glb', '**/*.wasm', '**/*.js'],
  optimizeDeps: {
    exclude: ['draco3d']
=======
    assetsInlineLimit: 0,
    copyPublicDir: true
  },
  publicDir: 'public',
  assetsInclude: ['**/*.glb', '**/*.wasm', '**/*.js', '**/*.png'],
  optimizeDeps: {
    exclude: ['draco3d'],
    include: ['three']
>>>>>>> 91116448d0793d9a1b9f50eeac0a32d8ed0e6b98
  }
}); 