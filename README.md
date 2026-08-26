# React Dev Asset Inspector

> Floating, development-only developer tool & asset analytics engine for React + Vite projects to discover, search, preview, optimize, and deduplicate assets.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
  - [1. Register Vite Plugin](#1-register-vite-plugin-viteconfigts)
  - [2. Mount Component](#2-mount-component-srcapptsx)
- [Configuration (`asset-inspector.config.json`)](#configuration-asset-inspectorconfigjson)
  - [Custom Extensions](#custom-extensions)
  - [Custom Ignore Patterns](#custom-ignore-patterns)
  - [Optimization Thresholds](#optimization-thresholds)
  - [Impact Scoring Weights](#impact-scoring-weights)
- [Core Analysis Engine](#core-analysis-engine)
  - [Code Reference & Unused Asset Detection](#code-reference--unused-asset-detection)
  - [Exact Byte Duplicate Detection & Canonical Selection](#exact-byte-duplicate-detection--canonical-selection)
  - [Magic-Byte MIME & Extension Mismatch Sniffing](#magic-byte-mime--extension-mismatch-sniffing)
  - [Fast Dimension Extraction](#fast-dimension-extraction)
- [Frontend Inspector UI](#frontend-inspector-ui)
  - [macOS-Style GPU Genie Effect](#macos-style-gpu-genie-effect)
  - [Light & Dark Theme Switcher](#light--dark-theme-switcher)
  - [List & Grid Gallery Views](#list--grid-gallery-views)
  - [Checkerboard Transparency Grid](#checkerboard-transparency-grid)
  - [Dedicated Potential Issues Drill-Down](#dedicated-potential-issues-drill-down)
  - [One-Click Code Snippets](#one-click-code-snippets)
  - [Shadow DOM Style Isolation](#shadow-dom-style-isolation)
- [CLI Usage](#cli-usage)
- [Production Safety Guarantee](#production-safety-guarantee)

---

## Installation

```bash
npm install -D dev-asset-inspector
```

---

## Quick Start

### 1. Register Vite Plugin (`vite.config.ts`)

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { assetInspectorPlugin } from "dev-asset-inspector/vite";

export default defineConfig({
  plugins: [react(), assetInspectorPlugin()],
});
```

The plugin serves live analysis endpoints during development (`/__dev-assets` and `/__dev-asset-inspector/report`). It is inert during production builds (`apply: "serve"`).

### 2. Mount Component (`src/App.tsx`)

```tsx
import {
  AssetInspector,
  InspectorHost,
  FloatingButton,
  InspectorPanel
} from "dev-asset-inspector/react";

function App() {
  return (
    <>
      <YourApplication />
      {import.meta.env.DEV && <AssetInspector />}
    </>
  );
}

export default App;
```

---

## Configuration (`asset-inspector.config.json`)

To customize scanner behavior, create an `asset-inspector.config.json` file in your project root:

```json
{
  "assets": {
    "extensions": [".ico", ".avif", ".pdf", ".mp4"],
    "ignore": [
      "temp/**",
      "legacy-assets/**",
      "**/*.test.*",
      "public/mock/**"
    ]
  },
  "optimization": {
    "maxFileSize": 524288,
    "maxWidth": 2560,
    "maxHeight": 1440,
    "highSeverityScore": 2
  },
  "impact": {
    "weights": {
      "unused": 3,
      "duplicate": 2,
      "typeMismatch": 2,
      "optimization": {
        "low": 1,
        "high": 2
      }
    }
  }
}
```

### Custom Extensions
By default, the scanner discovers:
- `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`, `.avif`

Use `assets.extensions` to add custom extensions (e.g. `[".ico", ".bmp", ".mp4", ".pdf"]`). Extensions are automatically normalized with or without leading dots.

### Custom Ignore Patterns
By default, the scanner automatically ignores:
- `node_modules/`, `.git/`, `dist/`, `build/`, `coverage/`

Use `assets.ignore` to supply custom glob patterns, directories, or filenames to skip during scanning.

### Optimization Thresholds
- **`maxFileSize`**: File size in bytes to flag as large (default: `524288` / 500 KB).
- **`maxWidth` & `maxHeight`**: Image dimensions in pixels to flag as oversized (default: `2560 × 1440`).
- **`highSeverityScore`**: Minimum score threshold to classify an optimization issue as high severity (default: `2`).

### Impact Scoring Weights
Configure the impact weight assigned to each issue when computing an asset's overall health score:
- **`unused`**: Weight for unreferenced files (default: `3`).
- **`duplicate`**: Weight for redundant duplicate files (default: `2`).
- **`typeMismatch`**: Weight for file extension mismatches (default: `2`).
- **`optimization.low`** / **`optimization.high`**: Weight for low/high severity optimization flags (default: `1` / `2`).

---

## Core Analysis Engine

### Code Reference & Unused Asset Detection
- Parses project source files (`.js`, `.jsx`, `.ts`, `.tsx`, `.html`, `.css`, `.scss`, `.sass`).
- Resolves JS/TS `import` statements and `require()` calls, HTML `src`/`href` attributes, and CSS `url(...)` declarations.
- Flags unreferenced files as `NOT_REFERENCED` and counts exact reference occurrences per file.

### Exact Byte Duplicate Detection & Canonical Selection
- Hashes file contents using SHA-256 to group exact duplicate assets.
- Automatically designates the best **Canonical (keeper)** asset based on valid MIME extensions and clean path naming.
- Calculates exact wasted storage space (`totalSize - canonicalAsset.size`).

### Magic-Byte MIME & Extension Mismatch Sniffing
- Uses binary magic-byte inspection (`file-type`) to verify the genuine format of every file.
- Detects disguised or misnamed files (e.g. a PNG file mistakenly renamed with a `.jpg` extension).

### Fast Dimension Extraction
- Directly parses binary headers to extract image dimensions (`width × height` in pixels) for PNG, JPEG, GIF, WebP, AVIF, and SVG without loading full images into memory.

---

## Frontend Inspector UI

### macOS-Style GPU Genie Effect
- 100% GPU-accelerated 3D morphing that billows smoothly out of the floating launcher button when opening and funnels back into the button when closing.
- Continuous dimensional transitions when toggling between window and maximized full-screen modes.

### Light & Dark Theme Switcher
- Header toggle (`☀️ / 🌙`) with a 180° flip animation.
- Curated color palettes designed for low eye fatigue:
  - **Dark Theme:** Warm obsidian (`#0c0e14`) with soft slate cards (`#141722`).
  - **Light Theme:** Warm alabaster (`#f8fafc`) with elevated cards (`#ffffff`).
- Theme preference is persisted in `localStorage`.

### List & Grid Gallery Views
- Segmented toggle (`☰ List` and `⊞ Grid`) in the Assets tab.
- **List View:** Compact rows with file sizes, dimensions, hashes, and quick actions.
- **Grid View:** Responsive card gallery featuring aspect-ratio previews, metadata chips, and quick-copy buttons.

### Checkerboard Transparency Grid
- Universal `.inspector-checkerboard` backdrop on all thumbnails and preview drawers.
- Ensures pure white SVGs and dark transparent icons remain 100% visible in both light and dark themes.

### Dedicated Potential Issues Drill-Down
- Clicking any issue category (**Unused assets**, **Duplicate groups**, **Optimization candidates**, **Type mismatches**) opens a dedicated breakdown page with breadcrumb navigation (`← Back to Overview`), dedicated search filter, and sorting (`Size ↓`, `Size ↑`, `Name A-Z`).

### One-Click Code Snippets
- **Copy Import:** Generates clean relative import statements (e.g. `import hero from "./assets/hero.png";`).
- **Copy JSX:** Generates image markup tags (e.g. `<img src={hero} alt="hero" />`).
- **Copy Path:** Copies the normalized relative project path.
- **Copy Hash:** Copies the full SHA-256 hash.

### Shadow DOM Style Isolation
- The entire inspector renders inside an isolated Shadow Root attached to the host element. Inspector styles will never leak into or conflict with your application's CSS.

---

## CLI Usage

Inspect project assets directly from the terminal without starting the dev server:

```bash
# Human-readable terminal report
npx dev-asset-inspector <project-path>
# or alias
npx asset-inspector <project-path>

# Machine-readable JSON output (ideal for CI pipelines)
npx dev-asset-inspector <project-path> --json

# Help & options
npx dev-asset-inspector --help
```

---

## Production Safety Guarantee

This tool is built to ensure zero production footprint:

1. **Vite Plugin Gating:** The plugin explicitly uses `apply: "serve"` — it will not run or inject middleware during `vite build`.
2. **Bundle Elimination:** When gated with `import.meta.env.DEV`, modern bundlers (Vite, Rollup, esbuild) completely dead-code eliminate the inspector UI and its styles from your production bundle.

---

## License

ISC © [p4avinash](https://github.com/p4avinash)
