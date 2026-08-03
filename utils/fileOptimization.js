const sharp = require('sharp');
const logger = require('./logger');

/**
 * Optimizes images for web delivery by compressing and resizing
 * @param {Buffer} buffer - Original image buffer
 * @param {string} mimetype - Original MIME type
 * @param {Object} options - Optimization options
 * @returns {Object} - {buffer: Buffer, mimetype: string, webpBuffer?: Buffer}
 */
async function optimizeImage(buffer, mimetype, options = {}) {
    const {
        maxWidth = 1200,
        quality = 80,
        progressive = true,
        compressionLevel = 8,
        convertToWebP = true
    } = options;

    try {
        const sharpInstance = sharp(buffer);
        const metadata = await sharpInstance.metadata();
        
        // Resize if image is too large
        if (metadata.width > maxWidth) {
            sharpInstance.resize(maxWidth, null, { withoutEnlargement: true });
        }
        
        let optimizedBuffer;
        let webpBuffer;
        let outputMimetype = mimetype;
        
        // Always create WebP version for maximum compression (25-35% smaller)
        if (convertToWebP && isImage(mimetype)) {
            try {
                webpBuffer = await sharpInstance.clone().webp({ 
                    quality: quality + 5, // Slightly higher quality for WebP
                    effort: 6 // Maximum compression effort
                }).toBuffer();
            } catch (webpError) {
                logger.warn('WebP conversion failed, using fallback:', webpError.message);
            }
        }
        
        // Create fallback version
        switch (mimetype) {
            case 'image/jpeg':
            case 'image/jpg':
                optimizedBuffer = await sharpInstance.jpeg({ 
                    quality, 
                    progressive,
                    mozjpeg: true // Better compression
                }).toBuffer();
                break;
                
            case 'image/png':
                optimizedBuffer = await sharpInstance.png({ 
                    compressionLevel: 9, // Maximum compression
                    palette: true // Reduce colors when possible
                }).toBuffer();
                break;
                
            case 'image/webp':
                optimizedBuffer = await sharpInstance.webp({ 
                    quality,
                    effort: 6
                }).toBuffer();
                break;
                
            default:
                // Convert other formats to JPEG for better compression
                optimizedBuffer = await sharpInstance.jpeg({ 
                    quality, 
                    progressive,
                    mozjpeg: true
                }).toBuffer();
                outputMimetype = 'image/jpeg';
                break;
        }
        
        const originalSize = buffer.length;
        const optimizedSize = optimizedBuffer.length;
        const webpSize = webpBuffer ? webpBuffer.length : 0;
        
        const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        const webpRatio = webpBuffer ? ((originalSize - webpSize) / originalSize * 100).toFixed(1) : 0;
        
        logger.debug(`Image optimized: ${originalSize} → ${optimizedSize} bytes (${compressionRatio}% reduction)`);
        if (webpBuffer) {
            logger.debug(`WebP version: ${webpSize} bytes (${webpRatio}% reduction from original)`);
        }
        
        return {
            buffer: optimizedBuffer,
            mimetype: outputMimetype,
            webpBuffer,
            webpMimetype: webpBuffer ? 'image/webp' : null,
            sizes: {
                original: originalSize,
                optimized: optimizedSize,
                webp: webpSize
            }
        };
        
    } catch (error) {
        logger.error('Image optimization failed:', error);
        return {
            buffer,
            mimetype
        };
    }
}

/**
 * Creates different sized thumbnails with WebP support
 * @param {Buffer} buffer - Original image buffer
 * @param {Object} options - Thumbnail options
 * @returns {Object} - Thumbnails in multiple formats and sizes
 */
async function createThumbnails(buffer, options = {}) {
    const { quality = 85, createWebP = true } = options;
    
    try {
        const sizes = [
            { name: 'small', width: 150, height: 150 },
            { name: 'medium', width: 300, height: 300 },
            { name: 'large', width: 600, height: 600 }
        ];
        
        const thumbnails = {};
        
        for (const size of sizes) {
            const sharpInstance = sharp(buffer).resize(size.width, size.height, { 
                fit: 'cover',
                position: 'center'
            });
            
            // Create JPEG version
            thumbnails[size.name] = await sharpInstance.clone().jpeg({ 
                quality,
                progressive: true,
                mozjpeg: true
            }).toBuffer();
            
            // Create WebP version if requested
            if (createWebP) {
                thumbnails[`${size.name}_webp`] = await sharpInstance.clone().webp({ 
                    quality: quality + 5,
                    effort: 6
                }).toBuffer();
            }
        }
        
        return thumbnails;
    } catch (error) {
        logger.error('Thumbnail creation failed:', error);
        return null;
    }
}

/**
 * Checks if file is an image
 * @param {string} mimetype - File MIME type
 * @returns {boolean}
 */
function isImage(mimetype) {
    return mimetype && mimetype.startsWith('image/');
}

/**
 * Detects browser WebP support from Accept header
 * @param {string} acceptHeader - Request Accept header
 * @returns {boolean}
 */
function supportsWebP(acceptHeader) {
    return acceptHeader && acceptHeader.includes('image/webp');
}

/**
 * Gets optimal cache duration based on file type
 * @param {string} mimetype - File MIME type
 * @returns {number} - Cache duration in seconds
 */
function getCacheDuration(mimetype) {
    if (isImage(mimetype)) {
        return 31536000; // 1 year for images
    } else if (mimetype === 'application/pdf') {
        return 86400; // 1 day for PDFs
    } else {
        return 3600; // 1 hour for other files
    }
}

module.exports = {
    optimizeImage,
    createThumbnails,
    isImage,
    getCacheDuration,
    supportsWebP
};