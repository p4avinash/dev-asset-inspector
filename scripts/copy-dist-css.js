import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const srcCssPath = path.join(rootDir, "src", "react", "inspector.css");
const distReactDir = path.join(rootDir, "dist", "react");

if (fs.existsSync(srcCssPath)) {
  fs.mkdirSync(distReactDir, { recursive: true });
  fs.copyFileSync(srcCssPath, path.join(distReactDir, "inspector.css"));
  fs.copyFileSync(srcCssPath, path.join(distReactDir, "styles.css"));
  console.log("[copy-dist-css] Copied inspector.css and styles.css to dist/react/");
}
