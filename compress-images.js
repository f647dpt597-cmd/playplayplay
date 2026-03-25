const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './assets/picturesdecoration';
const targetMaxSize = 400 * 1024; // 400KB
const maxWidth = 1920; // Max width for web

async function compressImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
        return;
    }

    const stats = fs.statSync(filePath);
    const currentSize = stats.size;

    if (currentSize <= targetMaxSize) {
        console.log(`✓ ${path.basename(filePath)} - Already ${(currentSize / 1024).toFixed(0)}KB`);
        return;
    }

    console.log(`Compressing ${path.basename(filePath)} - Currently ${(currentSize / 1024).toFixed(0)}KB`);

    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    let needsResize = metadata.width > maxWidth;

    // Start with quality 70 and work down
    let quality = 70;
    let compressed;
    let outputSize = currentSize;

    while (outputSize > targetMaxSize && quality >= 20) {
        let pipeline = sharp(filePath);

        // Resize if too wide
        if (needsResize) {
            pipeline = pipeline.resize(maxWidth, null, {
                withoutEnlargement: true,
                fit: 'inside'
            });
        }

        if (ext === '.png') {
            compressed = await pipeline
                .png({ quality: quality, compressionLevel: 9 })
                .toBuffer();
        } else {
            compressed = await pipeline
                .jpeg({ quality: quality, mozjpeg: true })
                .toBuffer();
        }

        outputSize = compressed.length;

        if (outputSize > targetMaxSize) {
            quality -= 5;
        }
    }

    // If still too large, reduce dimensions
    let currentWidth = needsResize ? maxWidth : metadata.width;
    while (outputSize > targetMaxSize && currentWidth > 800) {
        currentWidth = Math.floor(currentWidth * 0.8);

        let pipeline = sharp(filePath).resize(currentWidth, null, {
            withoutEnlargement: true,
            fit: 'inside'
        });

        if (ext === '.png') {
            compressed = await pipeline
                .png({ quality: Math.max(quality, 30), compressionLevel: 9 })
                .toBuffer();
        } else {
            compressed = await pipeline
                .jpeg({ quality: Math.max(quality, 30), mozjpeg: true })
                .toBuffer();
        }

        outputSize = compressed.length;
    }

    // Write the final buffer
    fs.writeFileSync(filePath + '.tmp', compressed);
    fs.unlinkSync(filePath);
    fs.renameSync(filePath + '.tmp', filePath);

    const newStats = fs.statSync(filePath);
    console.log(`  → Compressed to ${(newStats.size / 1024).toFixed(0)}KB`);
}

async function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            continue;
        }

        try {
            await compressImage(filePath);
        } catch (err) {
            console.error(`Error processing ${file}:`, err.message);
        }
    }
}

console.log('Starting image compression...\n');
processDirectory(inputDir).then(() => {
    console.log('\nCompression complete!');
});
