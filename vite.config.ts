import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import pkg from './package.json';

export default defineConfig(({mode}) => {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || '';
  const shortSha = sha ? sha.slice(0, 7) : '';
  const appVersion = `v${pkg.version}${shortSha ? ` (${shortSha})` : ''}`;
  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
