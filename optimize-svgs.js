const { optimize } = require('svgo');
const fs = require('fs');
const path = require('path');

const svgoConfig = {
    multipass: true,
    plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    removeViewBox: false,
                    cleanupIds: false,
                },
            },
        },
        'removeDoctype',
        'removeXMLProcInst',
        'removeComments',
        'removeMetadata',
        'removeEditorsNSData',
        'cleanupAttrs',
        'mergeStyles',
        'inlineStyles',
        'minifyStyles',
        'cleanupIds',
        'removeUselessDefs',
        'cleanupNumericValues',
        'convertColors',
        'removeUnknownsAndDefaults',
        'removeNonInheritableGroupAttrs',
        'removeUselessStrokeAndFill',
        'removeHiddenElems',
        'removeEmptyText',
        'convertShapeToPath',
        'convertEllipseToCircle',
        'moveElemsAttrsToGroup',
        'moveGroupAttrsToElems',
        'collapseGroups',
        'convertPathData',
        'convertTransform',
        'removeEmptyAttrs',
        'removeEmptyContainers',
        'mergePaths',
        'removeUnusedNS',
        'sortDefsChildren',
        'removeTitle',
        'removeDesc',
    ],
};

async function optimizeSvg(filePath) {
    const originalSize = fs.statSync(filePath).size;
    const svgString = fs.readFileSync(filePath, 'utf8');

    try {
        const result = optimize(svgString, {
            path: filePath,
            ...svgoConfig
        });

        fs.writeFileSync(filePath, result.data);
        const newSize = fs.statSync(filePath).size;
        const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

        console.log(`${path.basename(filePath)}: ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(newSize / 1024 / 1024).toFixed(1)}MB (${savings}% reduction)`);
    } catch (err) {
        console.error(`Error optimizing ${path.basename(filePath)}:`, err.message);
    }
}

async function main() {
    console.log('=== Optimizing SVG Files ===\n');

    const speakerDir = './assets/speaker';
    const files = fs.readdirSync(speakerDir);

    for (const file of files) {
        if (file.endsWith('.svg')) {
            const filePath = path.join(speakerDir, file);
            const stats = fs.statSync(filePath);

            // Only optimize files larger than 500KB
            if (stats.size > 500 * 1024) {
                await optimizeSvg(filePath);
            }
        }
    }

    console.log('\n=== SVG Optimization Complete ===');
}

main();
