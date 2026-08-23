/**
 * Hirly Image Migration Script - FINAL SAFETY VERSION
 * 
 * Processes existing images in Supabase Storage:
 * 1. Generates _thumb.webp (160x160) for list views.
 * 2. Generates _opt.webp (600x600) for detail views.
 * 3. Updates original image metadata to 1-year cache.
 * 4. Safe: Dry-run mode, pagination, error handling, preserves originals, MAX_FILES limit.
 * 
 * NOTE: Migration itself causes a one-time Supabase egress spike due to downloading
 * and re-uploading original images to update cache headers.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const path = require('path');
const axios = require('axios'); // Added for HTTP header verification

// CONFIGURATION
const DRY_RUN = process.env.DRY_RUN === 'true';
const MAX_FILES = process.env.MAX_FILES ? parseInt(process.env.MAX_FILES) : Infinity;
const PREFIX = process.env.PREFIX || ''; 
const BUCKET = 'uploads';
const FOLDERS = PREFIX ? [PREFIX] : ['profiles', 'logos']; 
const CACHE_CONTROL = '31536000, public, immutable';
const BATCH_SIZE = 100;

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const stats = {
    totalScanned: 0,
    processed: 0,
    skipped: 0,
    failed: 0,
    variantsUploaded: 0,
    metadataUpdated: 0,
    estimatedBandwidthIn: 0, 
    estimatedBandwidthOut: 0,
    totalMigrationEgressEstimate: 0,
    verificationResults: [] // Store detailed results for the test run
};

const MIME_MAP = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
};

/**
 * Verify HTTP headers for a public URL using GET (since Supabase returns no-cache for HEAD)
 */
async function verifyHttpHeaders(url) {
    try {
        // Use GET but only request a few bytes to save bandwidth
        const response = await axios.get(url, {
            headers: { 'Range': 'bytes=0-0' },
            validateStatus: (status) => status === 200 || status === 206
        });
        return {
            status: response.status,
            cacheControl: response.headers['cache-control'],
            contentType: response.headers['content-type'],
            contentLength: response.headers['content-length']
        };
    } catch (err) {
        return { error: err.message };
    }
}

/**
 * Verify if a file exists in Supabase Storage
 */
async function fileExists(filePath) {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    const { data, error } = await supabase.storage.from(BUCKET).list(dir, {
        search: base
    });
    if (error) return false;
    return data.some(f => f.name === base);
}

/**
 * Process a single image file
 */
async function processImage(file) {
    if (stats.processed >= MAX_FILES) return;

    const filePath = file.name;
    const extension = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, extension);
    const dirName = path.dirname(filePath);
    const isLogo = filePath.includes('logos/');
    
    // 1. Skip optimized variants, non-images, and unsupported formats
    if (filePath.endsWith('_thumb.webp') || filePath.endsWith('_opt.webp')) return;
    if (!MIME_MAP[extension]) return;

    stats.totalScanned++;
    const thumbPath = `${dirName}/${baseName}_thumb.webp`;
    const optPath = `${dirName}/${baseName}_opt.webp`;

    // 2. Efficiency: Check if variants already exist
    const thumbExists = await fileExists(thumbPath);
    const optExists = await fileExists(optPath);

    if (thumbExists && optExists) {
        stats.skipped++;
        return;
    }

    console.log(`[PROCESS] (${stats.processed + 1}/${MAX_FILES}) Processing: ${filePath}`);

    try {
        const originalSizeMB = (file.metadata?.size || 0) / (1024 * 1024);
        
        if (DRY_RUN) {
            console.log(`  - [DRY RUN] Would generate variants for ${filePath} (${originalSizeMB.toFixed(2)} MB)`);
            stats.estimatedBandwidthIn += originalSizeMB;
            stats.processed++;
            return;
        }

        // 3. Download original
        const { data: blob, error: downloadError } = await supabase.storage.from(BUCKET).download(filePath);
        if (downloadError) throw new Error(`Download failed: ${downloadError.message}`);
        
        // Convert Blob to Buffer for Sharp
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        stats.estimatedBandwidthIn += originalSizeMB;

        // 4. Generate Variants with Sharp
        const thumbBuffer = await sharp(buffer)
            .rotate()
            .resize(160, 160, { 
                fit: isLogo ? 'contain' : 'cover',
                background: { r: 0, g: 0, b: 0, alpha: 0 } 
            })
            .webp({ quality: 80 })
            .toBuffer();

        const optBuffer = await sharp(buffer)
            .rotate()
            .resize(600, 600, { 
                fit: 'inside', 
                withoutEnlargement: true,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({ quality: 80 })
            .toBuffer();

        // 5. Upload Variants (NO UPSERT)
        if (!thumbExists) {
            const { error: err } = await supabase.storage.from(BUCKET).upload(thumbPath, thumbBuffer, { 
                contentType: 'image/webp', 
                cacheControl: CACHE_CONTROL,
                upsert: false 
            });
            if (err) throw new Error(`Thumb upload failed: ${err.message}`);
            stats.variantsUploaded++;
            stats.estimatedBandwidthOut += thumbBuffer.byteLength / (1024 * 1024);
        }

        if (!optExists) {
            const { error: err } = await supabase.storage.from(BUCKET).upload(optPath, optBuffer, { 
                contentType: 'image/webp', 
                cacheControl: CACHE_CONTROL,
                upsert: false 
            });
            if (err) throw new Error(`Opt upload failed: ${err.message}`);
            stats.variantsUploaded++;
            stats.estimatedBandwidthOut += optBuffer.byteLength / (1024 * 1024);
        }

        // 6. Update Original Metadata (Re-upload same buffer with upsert: true)
        const { error: updateError } = await supabase.storage.from(BUCKET).upload(filePath, buffer, { 
            contentType: MIME_MAP[extension],
            cacheControl: CACHE_CONTROL,
            upsert: true
        });

        if (updateError) throw new Error(`Metadata update failed: ${updateError.message}`);
        stats.metadataUpdated++;
        stats.estimatedBandwidthOut += originalSizeMB;

        // Wait a brief moment for metadata to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 7. REAL Verification
        const { data: { publicUrl: origUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
        const { data: { publicUrl: thumbUrl } } = supabase.storage.from(BUCKET).getPublicUrl(thumbPath);
        const { data: { publicUrl: optUrl } } = supabase.storage.from(BUCKET).getPublicUrl(optPath);

        // Get dimensions and transparency info
        const thumbMeta = await sharp(thumbBuffer).metadata();
        const optMeta = await sharp(optBuffer).metadata();

        // Add cache-busting timestamp for verification only
        const ts = Date.now();
        const [origHeaders, thumbHeaders, optHeaders] = await Promise.all([
            verifyHttpHeaders(`${origUrl}?t=${ts}`),
            verifyHttpHeaders(`${thumbUrl}?t=${ts}`),
            verifyHttpHeaders(`${optUrl}?t=${ts}`)
        ]);

        const result = {
            file: filePath,
            original: { 
                size: originalSizeMB * 1024, 
                cacheControl: origHeaders.cacheControl, 
                status: origHeaders.status,
                url: origUrl
            },
            thumb: { 
                size: thumbBuffer.byteLength / 1024, 
                cacheControl: thumbHeaders.cacheControl, 
                status: thumbHeaders.status,
                dimensions: `${thumbMeta.width}x${thumbMeta.height}`,
                hasAlpha: thumbMeta.hasAlpha,
                url: thumbUrl
            },
            opt: { 
                size: optBuffer.byteLength / 1024, 
                cacheControl: optHeaders.cacheControl, 
                status: optHeaders.status,
                dimensions: `${optMeta.width}x${optMeta.height}`,
                hasAlpha: optMeta.hasAlpha,
                url: optUrl
            }
        };

        stats.verificationResults.push(result);
        console.log(`  - Success: Optimized ${filePath}`);
        console.log(`    Original: ${result.original.size.toFixed(1)} KB | Cache: ${result.original.cacheControl}`);
        console.log(`    Thumb:    ${result.thumb.dimensions} | ${result.thumb.size.toFixed(1)} KB | Alpha: ${result.thumb.hasAlpha}`);
        console.log(`    Opt:      ${result.opt.dimensions} | ${result.opt.size.toFixed(1)} KB | Alpha: ${result.opt.hasAlpha}`);
        
        stats.processed++;
    } catch (err) {
        console.error(`  - FAILED ${filePath}: ${err.message}`);
        stats.failed++;
    }
}

/**
 * Estimate total migration bandwidth
 */
async function estimateTotalBandwidth(folderPath) {
    let offset = 0;
    let hasMore = true;
    let totalMB = 0;

    while (hasMore) {
        const { data: items, error } = await supabase.storage.from(BUCKET).list(folderPath, {
            limit: BATCH_SIZE,
            offset: offset
        });

        if (error || !items) break;

        for (const item of items) {
            const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
            if (!item.id) {
                totalMB += await estimateTotalBandwidth(fullPath);
            } else {
                const ext = path.extname(item.name).toLowerCase();
                if (MIME_MAP[ext] && !item.name.endsWith('_thumb.webp') && !item.name.endsWith('_opt.webp')) {
                    const sizeMB = (item.metadata?.size || 0) / (1024 * 1024);
                    // Bandwidth = 1x download original + 1x upload variants (approx 10%) + 1x re-upload original
                    totalMB += (sizeMB * 2.1); 
                }
            }
        }
        offset += BATCH_SIZE;
        hasMore = items.length === BATCH_SIZE;
    }
    return totalMB;
}

/**
 * Recursively process a folder with pagination
 */
async function processFolder(folderPath) {
    if (stats.processed >= MAX_FILES) return;

    let offset = 0;
    let hasMore = true;

    console.log(`\n--- Scanning folder: ${folderPath} ---`);

    while (hasMore && stats.processed < MAX_FILES) {
        const { data: items, error } = await supabase.storage.from(BUCKET).list(folderPath, {
            limit: BATCH_SIZE,
            offset: offset,
            sortBy: { column: 'name', order: 'asc' }
        });

        if (error || !items || items.length === 0) break;

        for (const item of items) {
            if (stats.processed >= MAX_FILES) break;
            const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
            if (!item.id) {
                await processFolder(fullPath);
            } else {
                await processImage(item.id ? { ...item, name: fullPath } : item);
            }
        }

        offset += BATCH_SIZE;
        hasMore = items.length === BATCH_SIZE;
    }
}

/**
 * Main Execution
 */
async function main() {
    console.log(`🚀 Starting Migration... ${DRY_RUN ? '(DRY RUN MODE)' : '(PRODUCTION MODE)'}`);
    if (MAX_FILES !== Infinity) console.log(`Test Mode: Limited to ${MAX_FILES} files.`);
    if (PREFIX) console.log(`Targeting Prefix: ${PREFIX}`);
    
    console.log(`\n⚠️ WARNING: This migration will cause a one-time Supabase egress spike.`);
    console.log(`It involves downloading and re-uploading every original image to update cache headers.`);

    console.log(`\n[1/2] Calculating total migration egress estimate...`);
    for (const folder of FOLDERS) {
        stats.totalMigrationEgressEstimate += await estimateTotalBandwidth(folder);
    }
    console.log(`Estimated total egress for this migration: ${stats.totalMigrationEgressEstimate.toFixed(2)} MB`);

    console.log(`\n[2/2] Processing files...`);
    for (const folder of FOLDERS) {
        if (stats.processed >= MAX_FILES) break;
        await processFolder(folder);
    }

    console.log('\n' + '='.repeat(40));
    console.log('🏁 MIGRATION SUMMARY');
    console.log('='.repeat(40));
    console.log(`Total Files Scanned:   ${stats.totalScanned}`);
    console.log(`Successfully Processed: ${stats.processed}`);
    console.log(`Skipped (Already Opt):  ${stats.skipped}`);
    console.log(`Failed:                ${stats.failed}`);
    console.log(`Variants Created:      ${stats.variantsUploaded}`);
    console.log(`Metadata Updated:      ${stats.metadataUpdated}`);
    console.log(`Current Run Bandwidth: ${(stats.estimatedBandwidthIn + stats.estimatedBandwidthOut).toFixed(2)} MB`);
    console.log('='.repeat(40));

    if (DRY_RUN) {
        console.log('\n💡 This was a dry run. No files were changed.');
        console.log('To run a test, use: $env:MAX_FILES="5"; node scripts/migrate-images.js');
    } else if (stats.verificationResults.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 DETAILED VERIFICATION RESULTS (5-FILE TEST)');
        console.log('='.repeat(60));
        stats.verificationResults.forEach((res, i) => {
            console.log(`\n[${i+1}] File: ${res.file}`);
            console.log(`    Original: ${res.original.size.toFixed(1)}KB | Cache: ${res.original.cacheControl || 'MISSING'}`);
            console.log(`    Thumb:    ${res.thumb.dimensions} | ${res.thumb.size.toFixed(1)}KB | WebP: yes | Alpha: ${res.thumb.hasAlpha} | Cache: ${res.thumb.cacheControl || 'MISSING'}`);
            console.log(`    Opt:      ${res.opt.dimensions} | ${res.opt.size.toFixed(1)}KB | WebP: yes | Alpha: ${res.opt.hasAlpha} | Cache: ${res.opt.cacheControl || 'MISSING'}`);
            console.log(`    URLs:`);
            console.log(`      - ${res.original.url}`);
            console.log(`      - ${res.thumb.url}`);
            console.log(`      - ${res.opt.url}`);
        });
        console.log('\nSUMMARY OF 15 URLs:');
        const isOk = (status) => status === 200 || status === 206;
        const allWorking = stats.verificationResults.every(r => isOk(r.original.status) && isOk(r.thumb.status) && isOk(r.opt.status));
        console.log(`All 15 URLs return 200/206 OK: ${allWorking ? '✅ YES' : '❌ NO'}`);
        
        const totalBandwidth = stats.estimatedBandwidthIn + stats.estimatedBandwidthOut;
        console.log(`Total Bandwidth Used: ${totalBandwidth.toFixed(2)} MB`);
        console.log('='.repeat(60));
    }
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
