# Agent Notes

## Project Context
- Bulk watermark/border applier + creator toolkit using Bun + TypeScript + Sharp
- Designed for e-commerce product images — overlays decorative borders with badges (COD, discount, etc.)
- User sells on Shopee/TikTok (consistent with their other projects)

## Architecture

### CLI (`src/apply-watermark.ts`)
- Uses `parseArgs` for argument parsing, supports repeatable `-i` and `-w` flags
- **Smart output**: default = `<source>/output` (flat); custom `-o` = preserves folder structure
- Processes images sequentially per watermark × per image

### Server (`src/server.ts`)
- Bun HTTP server on port **19683** (3⁹ — user's deliberate choice)
- Static file serving from `public/`
- `/api/preview` — composites single image + watermark, returns PNG
- `/api/process` — bulk processes all images × watermarks, returns ZIP (using JSZip)
- Originally used `archiver` for ZIP, replaced with `jszip` for Bun stream compatibility

### Frontend
- `public/index.html` — main HTML with **tab system** (Applier / Creator)
- `public/app.js` — applier logic: file uploads, drag & drop, folder uploads, preview, ZIP download
- `public/creator.js` — watermark creator: canvas rendering, 8 border styles, fill modes, badges, export
- `public/style.css` — premium dark-mode theme, all component styles

## Key Decisions
- **Bun + Sharp over Python + Pillow**: User prefers Bun. Sharp uses libvips (faster).
- **Output as PNG**: All output is PNG regardless of input format, to preserve watermark transparency/quality.
- **Watermark scaling**: Stretched (`fit: "fill"`) to match source image dimensions exactly. Assumes watermark templates are designed as square borders.
- **GUI outputs ZIP**: Browser security prevents writing to source folder paths, so GUI produces downloadable ZIP instead of disk writes.
- **JSZip over Archiver**: `archiver` uses Node streams incompatible with Bun. `jszip` is fully in-memory.
- **Creator uses Canvas API**: Pure client-side rendering, no server needed. Export as transparent PNG.
- **12 badge presets**: Shopping-related presets (Indonesian e-commerce focused) — saves user from looking up emojis.

## Gotchas
- Sharp's `composite()` requires the overlay to match the base image dimensions, so we resize the watermark first.
- Non-PNG inputs are converted to PNG on output to avoid JPEG artifacts destroying watermark transparency.
- Browser `webkitRelativePath` is used for folder structure tracking but doesn't expose the actual filesystem path.
- Canvas `fillText` with emojis may render differently across OS/browsers.

## Open Questions
- None currently.
