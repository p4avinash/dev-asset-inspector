import { readFile } from "node:fs/promises";
import path from "node:path";
import { imageDimensionsFromData } from "image-dimensions";

export async function getImageDimensions(filePath: string) {
  try {
    const extension = path.extname(filePath).toLowerCase();

    if (extension === ".svg") {
      const content = await readFile(filePath, "utf-8");

      return getSvgDimensions(content);
    }

    const data = await readFile(filePath);

    return imageDimensionsFromData(data);
  } catch {
    return undefined;
  }
}
export function getSvgDimensions(content: string) {
  const svgTag = content.match(/<svg\b[^>]*>/i);

  if (!svgTag) {
    return undefined;
  }

  const widthMatch = svgTag[0].match(/\bwidth=["']([^"']+)["']/i);
  const heightMatch = svgTag[0].match(/\bheight=["']([^"']+)["']/i);

  const width = widthMatch ? Number(widthMatch[1]) : undefined;
  const height = heightMatch ? Number(heightMatch[1]) : undefined;

  if (
    width !== undefined &&
    height !== undefined &&
    Number.isFinite(width) &&
    Number.isFinite(height)
  ) {
    return {
      width,
      height,
    };
  }

  const viewBoxMatch = svgTag[0].match(/\bviewBox=["']([^"']+)["']/i);

  if (viewBoxMatch?.[1]) {
    const values = viewBoxMatch[1].trim().split(/\s+/);

    if (values.length === 4) {
      const viewBoxWidth = Number(values[2]);
      const viewBoxHeight = Number(values[3]);

      if (Number.isFinite(viewBoxWidth) && Number.isFinite(viewBoxHeight)) {
        return {
          width: viewBoxWidth,
          height: viewBoxHeight,
        };
      }
    }
  }
}
