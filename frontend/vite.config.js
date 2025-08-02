import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        // target: "https://sgm-chatapp.onrender.com",
        target: "http://localhost:3003",
        secure: false,
      },
    },
  },
});
