import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsConfigPaths()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://brajmart-hr-platform-2.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
