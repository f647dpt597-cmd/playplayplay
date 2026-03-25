const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const targetSize = 150 * 1024; // 150KB target for speaker images
const maxWidth = 600; // Reasonable width for speaker cards

async function convertAndCompressSvg(svgPath) {
    const stats = fs.statSync(svgPath);
    const originalSize = stats.size;

    // Skip if file is already small enough
    if (originalSize < 500 * 1024) {
        return;
    }

    const baseName = path.basename(svgPath, '.svg');
    const pngPath = svgPath.replace('.svg', '.png');

    console.log(`Converting ${baseName}.svg (${(originalSize / 1024 / 1024).toFixed(1)}MB)...`);

    try {
        // Convert SVG to PNG with compression
        let quality = 80;
        let compressed;
        let outputSize = originalSize;

        while (outputSize > targetSize && quality >= 40) {
            compressed = await sharp(svgPath)
                .resize(maxWidth, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .png({ quality: quality, compressionLevel: 9 })
                .toBuffer();

            outputSize = compressed.length;

            if (outputSize > targetSize) {
                quality -= 10;
            }
        }

        // Write PNG file
        fs.writeFileSync(pngPath, compressed);

        // Remove original SVG
        fs.unlinkSync(svgPath);

        const newSize = fs.statSync(pngPath).size;
        const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
        console.log(`  → ${baseName}.png: ${(newSize / 1024).toFixed(0)}KB (${savings}% reduction)\n`);

    } catch (err) {
        console.error(`Error converting ${baseName}:`, err.message);
    }
}

async function main() {
    console.log('=== Converting Large SVG Files to Compressed PNG ===\n');

    const speakerDir = './assets/speaker';
    const files = fs.readdirSync(speakerDir);

    for (const file of files) {
        if (file.endsWith('.svg')) {
            const filePath = path.join(speakerDir, file);
            await convertAndCompressSvg(filePath);
        }
    }

    console.log('=== Conversion Complete ===');
}

main();
