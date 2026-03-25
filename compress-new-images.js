const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const targetMaxSize = 300 * 1024; // 300KB for speakers
const logoTargetSize = 100 * 1024; // 100KB for logos
const maxWidth = 800; // Max width for speaker images
const logoMaxWidth = 400; // Max width for logos

async function compressImage(filePath, targetSize, maxW) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png' && ext !== '.svg') {
        return;
    }

    // Skip SVG files - they don't need compression
    if (ext === '.svg') {
        console.log(`SKIP ${path.basename(filePath)} - SVG file`);
        return;
    }

    const stats = fs.statSync(filePath);
    const currentSize = stats.size;

    if (currentSize <= targetSize) {
        console.log(`OK ${path.basename(filePath)} - Already ${(currentSize / 1024).toFixed(0)}KB`);
        return;
    }

    console.log(`Compressing ${path.basename(filePath)} - Currently ${(currentSize / 1024).toFixed(0)}KB`);

    try {
        const metadata = await sharp(filePath).metadata();
        let needsResize = metadata.width > maxW;

        let quality = 85;
        let compressed;
        let outputSize = currentSize;

        while (outputSize > targetSize && quality >= 20) {
            let pipeline = sharp(filePath);

            if (needsResize) {
                pipeline = pipeline.resize(maxW, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                });
            }

            compressed = await pipeline
                .png({ quality: quality, compressionLevel: 9 })
                .toBuffer();

            outputSize = compressed.length;

            if (outputSize > targetSize) {
                quality -= 10;
            }
        }

        // If still too large, reduce dimensions
        let currentWidth = needsResize ? maxW : metadata.width;
        while (outputSize > targetSize && currentWidth > 200) {
            currentWidth = Math.floor(currentWidth * 0.7);

            let pipeline = sharp(filePath).resize(currentWidth, null, {
                withoutEnlargement: true,
                fit: 'inside'
            });

            compressed = await pipeline
                .png({ quality: Math.max(quality, 30), compressionLevel: 9 })
                .toBuffer();

            outputSize = compressed.length;
        }

        // Write compressed file
        fs.writeFileSync(filePath + '.tmp', compressed);
        fs.unlinkSync(filePath);
        fs.renameSync(filePath + '.tmp', filePath);

        const newStats = fs.statSync(filePath);
        console.log(`  -> Compressed to ${(newStats.size / 1024).toFixed(0)}KB`);
    } catch (err) {
        console.error(`Error compressing ${path.basename(filePath)}:`, err.message);
    }
}

async function processDirectory(dir, targetSize, maxW) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            continue;
        }

        await compressImage(filePath, targetSize, maxW);
    }
}

async function main() {
    console.log('=== Compressing new speaker images ===\n');
    await processDirectory('./assets/speaker', targetMaxSize, maxWidth);

    console.log('\n=== Compressing speaker company logos ===\n');
    await processDirectory('./assets/companiesofspeakers', logoTargetSize, logoMaxWidth);

    console.log('\n=== Compressing corporate/partner logos ===\n');
    await processDirectory('./assets/corporates', logoTargetSize, logoMaxWidth);

    console.log('\n=== Compression complete! ===');
}

main();
