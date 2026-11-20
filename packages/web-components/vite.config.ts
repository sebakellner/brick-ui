import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        register: resolve(import.meta.dirname, 'src/register.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => id === 'lit' || id.startsWith('lit/'),
      output: { preserveModules: true, preserveModulesRoot: 'src' },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
