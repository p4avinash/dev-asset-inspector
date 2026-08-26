# React Dev Asset Inspector

Floating, development-only developer tool for React + Vite applications to discover, search, preview, and copy snippets for project assets, and detect exact byte duplicates.

## Installation

```bash
npm install -D dev-asset-inspector
```

## Integration

### 1. Register Vite Plugin (`vite.config.ts`)

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import devAssets from "dev-asset-inspector/vite";

export default defineConfig({
  plugins: [react(), devAssets()],
});
```

The plugin automatically configures development server middleware at `/__dev-assets` and `/__dev-asset-inspector/report`. It is inert during production builds (`apply: "serve"`).

### 2. Mount Component (`src/App.tsx`)

```tsx
import { DevAssets } from "dev-asset-inspector-ui";

function App() {
  return (
    <>
      <YourApplication />
      {import.meta.env.DEV && <DevAssets />}
    </>
  );
}

export default App;
```

## Features

- **Floating Developer Button:** Non-blocking button fixed at the bottom right. Renders in an isolated **Shadow DOM** to prevent CSS conflicts with your application.
- **Asset Discovery:** Automatically scans project directories (`src/assets/**`, `src/images/**`, `public/**`) for `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, and `.svg`.
- **Search & Filter Chips:** Fast case-insensitive search by filename, extension, or path, combinable with filter chips:
  - `All`: All discovered assets
  - `Images`: Raster graphics
  - `SVG`: Vector graphics only
  - `Duplicates`: Exact content duplicates grouped by hash
  - `Large`: Assets exceeding 1 MB
- **Inline Preview:** Toggle instant inline previews for images and SVGs with fallback error handling.
- **One-Click Snippet Copy:**
  - **Copy Import:** Generates and copies clean relative import statements (e.g. `import logo from "./assets/logo.svg";`) with toast feedback.
  - **Copy JSX:** Generates and copies `<img src={name} alt="name" />` tags.
- **Exact Duplicate Detection:** Groups identical files by content hash and calculates potential storage savings.
- **Production Safe:** The Vite plugin only runs in development server mode (`apply: "serve"`), and application gating with `import.meta.env.DEV` ensures zero runtime overhead in production.

## CLI Usage

The package also includes an asset inspection CLI:

```bash
npx asset-inspector <project-path>
npx asset-inspector <project-path> --json
```
