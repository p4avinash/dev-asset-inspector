import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

export async function getFileHash(filePath: string): Promise<string> {
  const data = await readFile(filePath);

  return createHash("sha256").update(data).digest("hex");
}
