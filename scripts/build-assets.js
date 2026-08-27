import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const cssPath = path.join(rootDir, "src", "react", "inspector.css");
const outTsPath = path.join(rootDir, "src", "react", "inspectorStyles.ts");

if (fs.existsSync(cssPath)) {
  const cssContent = fs.readFileSync(cssPath, "utf-8");
  // Safely escape backticks and interpolation
  const escapedCss = cssContent
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\${/g, "\\${");

  const tsContent = `// Auto-generated from inspector.css by scripts/build-assets.js
export const inspectorStyles = \`${escapedCss}\`;
`;

  fs.writeFileSync(outTsPath, tsContent, "utf-8");
  console.log("[build-assets] Generated src/react/inspectorStyles.ts (" + cssContent.length + " bytes)");
} else {
  console.warn("[build-assets] Warning: src/react/inspector.css not found!");
}
