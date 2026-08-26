import { analyzeProject } from "../analyzer/analyzeProject.js";

const REPORT_ENDPOINTS = new Set([
  "/__dev-assets",
  "/__dev-asset-inspector/report",
]);

export type VitePlugin = {
  name: string;
  apply?: "serve" | "build";
  configureServer?: (server: any) => void;
  [key: string]: any;
};

export function assetInspectorPlugin(): VitePlugin {
  return {
    name: "dev-asset-inspector",
    apply: "serve", // Inert during production builds

    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: () => void) => {
        const rawUrl = typeof req.url === "string" ? req.url : "";
        const pathname = rawUrl.split("?")[0];

        if (req.method !== "GET" || !REPORT_ENDPOINTS.has(pathname)) {
          next();
          return;
        }

        try {
          const report = await analyzeProject(server.config.root);

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.setHeader(
            "Cache-Control",
            "no-cache, no-store, must-revalidate, max-age=0",
          );

          res.end(JSON.stringify(report));
        } catch (error: any) {
          console.error("[dev-asset-inspector]", error);

          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");

          res.end(
            JSON.stringify({
              error: error?.message || "Failed to analyze project",
            }),
          );
        }
      });
    },
  };
}

export const devAssets = assetInspectorPlugin;
export default assetInspectorPlugin;


