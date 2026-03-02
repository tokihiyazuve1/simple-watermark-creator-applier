import sharp from "sharp";
import { parseArgs } from "util";
import { readdir, mkdir } from "fs/promises";
import { join, basename, extname, resolve, dirname } from "path";

// --- CLI Args ---
const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
        images: { type: "string", short: "i", multiple: true },
        watermark: { type: "string", short: "w", multiple: true },
        output: { type: "string", short: "o" },
    },
    strict: true,
});

if (!values.images?.length || !values.watermark?.length) {
    console.error(`
Usage: bun run apply -- -i <images_folder> [-i <folder2>] -w <watermark.png> [-w <wm2.png>] [-o <output>]

Options:
  -i, --images     Path to folder(s) of source images (required, repeatable)
  -w, --watermark  One or more watermark/border PNG files (required, repeatable)
  -o, --output     Output folder (default: <source_folder>/output, flat)
                   If set, preserves source folder names as subfolders

Examples:
  # Default: output goes next to source folder, flat
  bun run apply -- -i ./brewog -w ./border.png
  # → brewog/output/border/1.png, brewog/output/border/biru.png

  # Custom output: preserves folder structure
  bun run apply -- -i ./brewog -i ./another -w ./border.png -o ./my-output
  # → my-output/border/brewog/1.png, my-output/border/another/img.png
`);
    process.exit(1);
}

const SUPPORTED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

// Determine if user explicitly set output
const userSetOutput = values.output !== undefined;

// --- Main ---
async function main() {
    const imageDirs = values.images!;
    const watermarkPaths = values.watermark!;

    // Default output: <first_source_folder>/output
    const outputRoot = userSetOutput
        ? values.output!
        : join(resolve(imageDirs[0]), "output");

    // Discover source images from all folders
    const allImages: { path: string; name: string; folderName: string }[] = [];

    for (const dir of imageDirs) {
        const folderName = basename(dir);
        const files = await readdir(dir);
        const imageFiles = files.filter((f) =>
            SUPPORTED_EXTENSIONS.has(extname(f).toLowerCase())
        );

        if (imageFiles.length === 0) {
            console.error(`No supported images found in: ${dir}`);
            continue;
        }

        for (const f of imageFiles) {
            allImages.push({
                path: join(dir, f),
                name: f,
                folderName,
            });
        }
    }

    if (allImages.length === 0) {
        console.error("No supported images found in any input folder.");
        process.exit(1);
    }

    // Validate watermark files exist
    for (const wmPath of watermarkPaths) {
        const file = Bun.file(wmPath);
        if (!(await file.exists())) {
            console.error(`Watermark file not found: ${wmPath}`);
            process.exit(1);
        }
    }

    // Build watermark info
    const watermarks = watermarkPaths.map((wmPath) => ({
        path: wmPath,
        name: basename(wmPath, extname(wmPath)),
    }));

    console.log(
        `\nUsing ${watermarks.length} watermark(s): ${watermarks.map((w) => w.name).join(", ")}`
    );
    console.log(`Processing ${allImages.length} images from ${imageDirs.length} folder(s)...`);
    console.log(`Output: ${outputRoot} (${userSetOutput ? "preserve folders" : "flat"})\n`);

    let totalProcessed = 0;

    for (const wm of watermarks) {
        const wmOutputDir = join(outputRoot, wm.name);

        // Load watermark buffer once per watermark
        const wmBuffer = await Bun.file(wm.path).arrayBuffer();

        console.log(`[${wm.name}]`);

        for (let idx = 0; idx < allImages.length; idx++) {
            const img = allImages[idx];

            // If user set custom output → preserve folder structure
            // If default output → flat (no subfolder per source)
            const imgOutputDir = userSetOutput
                ? join(wmOutputDir, img.folderName)
                : wmOutputDir;

            const displayName = userSetOutput
                ? `${img.folderName}/${img.name}`
                : img.name;

            try {
                await mkdir(imgOutputDir, { recursive: true });

                // Get source image dimensions
                const sourceImage = sharp(img.path);
                const metadata = await sourceImage.metadata();
                const { width, height } = metadata;

                if (!width || !height) {
                    console.log(
                        `  [${idx + 1}/${allImages.length}] ✗ ${displayName} (could not read dimensions)`
                    );
                    continue;
                }

                // Resize watermark to match source dimensions
                const resizedWatermark = await sharp(Buffer.from(wmBuffer))
                    .resize(width, height, { fit: "fill" })
                    .ensureAlpha()
                    .toBuffer();

                // Composite: source image + watermark on top
                const outputBuffer = await sourceImage
                    .ensureAlpha()
                    .composite([{ input: resizedWatermark, blend: "over" }])
                    .png()
                    .toBuffer();

                // Save
                const outputFileName =
                    extname(img.name).toLowerCase() !== ".png"
                        ? basename(img.name, extname(img.name)) + ".png"
                        : img.name;

                await Bun.write(join(imgOutputDir, outputFileName), outputBuffer);

                console.log(`  [${idx + 1}/${allImages.length}] ✓ ${displayName}`);
                totalProcessed++;
            } catch (err) {
                console.error(
                    `  [${idx + 1}/${allImages.length}] ✗ ${displayName} — ${err instanceof Error ? err.message : err}`
                );
            }
        }

        console.log();
    }

    console.log(`Done! ${totalProcessed} images processed → ${outputRoot}/`);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
