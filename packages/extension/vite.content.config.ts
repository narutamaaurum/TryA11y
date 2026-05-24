import { defineConfig } from 'vite';
import { resolve } from 'path';

// Separate build for the content script — must be IIFE (no ES module imports)
// because Chrome content scripts injected via manifest content_scripts do not
// support type="module".
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      name: 'TryA11yContent',
      formats: ['iife'],
      fileName: () => 'content/index.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
