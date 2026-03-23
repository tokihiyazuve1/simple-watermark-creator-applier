# 💡 Ideas & Considerations

Things I'm considering but haven't committed to implementing yet.

---

## Creator Enhancements
- [x] **Save/Load Templates** — Save full setup (border, badges, colors, images, positions) as named templates. Quick-load for consistent branding across products.
- [x] **Opacity Control per Custom Image** — Slider to adjust transparency of each uploaded image (useful for logo overlays that shouldn't block the product).
- [x] Undo/redo for creator edits (`Ctrl+Z` / `Ctrl+Y`)
- [—] **Image Layer Order** — *(skipped — not needed, no overlapping elements)* Drag to reorder which images/badges render on top of others (z-index control).
- [x] **Badge Shape Options** — Pill, circle, ribbon/banner, hexagon shapes instead of just rounded rectangles.
- [x] **Snap to Grid / Alignment Guides** — When dragging elements, show alignment guides (center, edges) for precise positioning.
- [x] **QR Code Badge** — Generate a QR code linking to your shop URL and place it on the watermark.
- [x] **Diagonal Text Watermark** — Add custom transparent text across the image at an angle (e.g. "ORIGINAL", shop name), semi-transparent so it doesn't obstruct the product.

## Applier Enhancements
- [x] Image resizing before watermark (e.g., resize all to 1000×1000 before applying)
- [—] Batch rename output files — *(skipped — easy to do externally)*
- [—] Watermark opacity slider — *(skipped — Creator already handles opacity)*
- [—] Watermark positioning (not just full overlay — allow corner placement, tiling) — *(skipped — Creator handles positioning)*
- [—] Progress bar for large batches in GUI — *(skipped — already has a basic progress bar)*

## General
- [—] PWA support (offline-capable) — *(skipped — runs locally via bun)*
- [—] Keyboard shortcuts for common actions — *(skipped — key ones already done: Ctrl+Z/Y, Delete)*
- [x] File size optimization on export (compress PNGs)
- [—] Multi-language support (EN/ID) — *(skipped — personal tool)*

---

*Add ideas freely. Move to `progress.log` once you start implementing.*
