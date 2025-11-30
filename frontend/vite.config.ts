import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy ESP32-CAM requests to avoid CORS issues
      '/api/camera': {
        target: 'http://192.168.1.18:81',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/camera/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('ESP32 proxy error:', err);
          });
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
