import path from "node:path";

function patternToRegex(pattern: string): RegExp {
  const normalizedPattern = pattern
    .replaceAll("\\", "/")
    .replace(/^\/+|\/+$/g, "");

  const escapedPattern = normalizedPattern.replace(
    /[.+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const regexPattern = escapedPattern
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*");

  return new RegExp(`^${regexPattern}$`);
}

function getRelativePath(targetPath: string, projectRoot: string): string {
  return path.relative(projectRoot, targetPath).replaceAll("\\", "/");
}

export function shouldIgnore(
  filePath: string,
  projectRoot: string,
  ignorePatterns: string[],
): boolean {
  const relativePath = getRelativePath(filePath, projectRoot);

  return ignorePatterns.some((pattern) => {
    return patternToRegex(pattern).test(relativePath);
  });
}

export function shouldIgnoreDirectory(
  directoryPath: string,
  projectRoot: string,
  ignorePatterns: string[],
): boolean {
  const relativePath = getRelativePath(directoryPath, projectRoot);

  return ignorePatterns.some((pattern) => {
    const normalizedPattern = pattern
      .replaceAll("\\", "/")
      .replace(/^\/+|\/+$/g, "");

    if (normalizedPattern.endsWith("/**")) {
      const directoryPattern = normalizedPattern.slice(0, -3);

      return patternToRegex(directoryPattern).test(relativePath);
    }

    return patternToRegex(normalizedPattern).test(relativePath);
  });
}
