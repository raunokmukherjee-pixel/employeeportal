import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Dev topology: backend (src/backend/, Express) runs on BACKEND_PORT (default 3000,
// see implementation/src/index.js's `process.env.PORT || 3000` convention carried forward);
// this Vite dev server runs on FRONTEND_PORT (default 5173) and proxies /api/* to the
// backend so the frontend never hardcodes the backend origin in application code.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendPort = env.BACKEND_PORT || '3000';
  const frontendPort = Number(env.FRONTEND_PORT) || 5173;

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
