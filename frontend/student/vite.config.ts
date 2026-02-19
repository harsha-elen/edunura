import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE_PATH controls asset base + router base:
//   '/'    → subdomain mode  (app.clientdomain.com)
//   '/app' → path mode       (clientdomain.com/app)
const basePath = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
    base: basePath,
    plugins: [react()],
    server: {
        port: 3003,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
