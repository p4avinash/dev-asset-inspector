import fs from "node:fs";
import path from "node:path";

export function scanFiles(projectRoot: string) {
  const entries = fs.readdirSync(projectRoot, { withFileTypes: true });

  console.log(entries);

  for (const entry of entries) {
    const fullPath = path.join(projectRoot, entry.name);

    console.log(fullPath);
  }
}
