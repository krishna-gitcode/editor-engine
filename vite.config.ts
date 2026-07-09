import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: mode === 'lib' ? {
    lib: {
      entry: path.resolve(__dirname, 'src/sdk/index.ts'),
      name: 'EditorEngineSDK',
      fileName: (format) => `editor-sdk.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  } : {
    outDir: 'dist',
    sourcemap: true,
  },
}));
