import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { assetInspectorPlugin } from "../src/vite/assetInspectorPlugin.js";


export default defineConfig({
  plugins: [react(), assetInspectorPlugin()],
  server: {
    fs: {
      allow: [".."],
    },
  },
});

