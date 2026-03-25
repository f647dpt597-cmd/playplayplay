const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './assets/corporates';
const targetMaxSize = 200 * 1024; // 200KB
const maxWidth = 800; // Max width for logos

async function compressImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
        return;
    }

    const stats = fs.statSync(filePath);
    const currentSize = stats.size;

    if (currentSize <= targetMaxSize) {
        console.log(`OK ${path.basename(filePath)} - Already ${(currentSize / 1024).toFixed(0)}KB`);
        return;
    }

    console.log(`Compressing ${path.basename(filePath)} - Currently ${(currentSize / 1024).toFixed(0)}KB`);

    const metadata = await sharp(filePath).metadata();
    let needsResize = metadata.width > maxWidth;

    let quality = 80;
    let compressed;
    let outputSize = currentSize;

    while (outputSize > targetMaxSize && quality >= 20) {
        let pipeline = sharp(filePath);

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
            quality -= 10;
        }
    }

    let currentWidth = needsResize ? maxWidth : metadata.width;
    while (outputSize > targetMaxSize && currentWidth > 300) {
        currentWidth = Math.floor(currentWidth * 0.7);

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

    fs.writeFileSync(filePath + '.tmp', compressed);
    fs.unlinkSync(filePath);
    fs.renameSync(filePath + '.tmp', filePath);

    const newStats = fs.statSync(filePath);
    console.log(`  -> Compressed to ${(newStats.size / 1024).toFixed(0)}KB`);
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

console.log('Starting logo compression...\n');
processDirectory(inputDir).then(() => {
    console.log('\nCompression complete!');
});
