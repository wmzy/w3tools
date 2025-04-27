import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node18',
    commonjsOptions: {
      // esmExternals: ['p-throttle'],
      // esmExternals: true,
    },
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cli: resolve(__dirname, 'src/app/cli/index.ts'),
      },
      name: 'w3tools',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: /^(?!@\/)[^\/\.].*/,
      output: {
        interop: 'esModule',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
