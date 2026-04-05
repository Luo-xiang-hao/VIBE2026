import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const repoRoot = path.join(__dirname, "..");

export default defineConfig({
  /** 產物在 /dist-react/ 時以相對路徑載入，適合 Express 靜態檔根目錄 */
  base: "./",
  root: __dirname,
  plugins: [react()],
  server: {
    fs: {
      allow: [repoRoot, __dirname],
    },
  },
  build: {
    outDir: path.join(__dirname, "../dist-react"),
    emptyOutDir: true,
  },
});
