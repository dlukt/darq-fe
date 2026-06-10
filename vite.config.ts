import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_BASE_URL || "https://akkoma.local"

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: false,
        },
        "/oauth": {
          target,
          changeOrigin: true,
          secure: false,
        },
        "/nodeinfo": {
          target,
          changeOrigin: true,
          secure: false,
        },
        "/static": {
          target,
          changeOrigin: true,
          secure: false,
        },
        "/socket": {
          target,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
