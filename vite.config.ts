import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { receiptApiPlugin } from './server/plugin.ts';

export default defineConfig(({ mode }) => {
  // Server-side only: loadEnv with '' prefix reads OPENAI_* without exposing them to the client bundle
  // (only VITE_-prefixed variables are ever injected into client code).
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      receiptApiPlugin({
        apiKey: env.OPENAI_API_KEY || env.GEMINI_API_KEY,
        model: env.OPENAI_MODEL || env.GEMINI_MODEL || 'gpt-4o-mini',
      }),
    ],
    test: { include: ['src/**/*.test.ts'] },
  };
});
