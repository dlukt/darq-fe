import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://akkoma.local",
        changeOrigin: true,
        secure: false,
      },
      "/oauth": {
        target: "https://akkoma.local",
        changeOrigin: true,
        secure: false,
      },
      "/nodeinfo": {
        target: "https://akkoma.local",
        changeOrigin: true,
        secure: false,
      },
      "/socket": {
        target: "https://akkoma.local",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
