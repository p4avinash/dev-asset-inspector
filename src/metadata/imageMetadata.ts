import { readFile } from "node:fs/promises";
import { imageDimensionsFromData } from "image-dimensions";

export async function getImageDimensions(filePath: string) {
  const data = await readFile(filePath);

  return imageDimensionsFromData(data);
}
