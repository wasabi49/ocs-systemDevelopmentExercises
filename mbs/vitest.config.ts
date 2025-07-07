import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,tsx}'], // 対象ファイル
      exclude: [
        'app/**/*.test.{ts,tsx}', // テストファイルは除外
        'app/**/*.stories.{ts,tsx}', // Storybookファイルは除外
        'app/**/*.d.ts', // 型定義ファイルは除外
        'app/**/layout.tsx', // すべてのlayout.tsxは除外
        'app/**/loading.tsx', // すべてのloading.tsxは除外
        'app/**/not-found.tsx', // すべてのnot-found.tsxは除外
      ],
      all: true, // テストされていないファイルも含める
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
