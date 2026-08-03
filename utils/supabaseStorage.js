const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const path = require('path');
const logger = require('./logger');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Generate a unique filename with timestamp and random string
 * @param {string} originalName - Original filename
 * @param {string} userId - User ID for organization
 * @param {string} type - File type (profile, cv, logo, service, job, etc.)
 * @returns {string} - Unique filename
 */
function generateUniqueFilename(originalName, userId, type) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName).toLowerCase();
    return `${type}/${userId}/${timestamp}_${randomString}${extension}`;
}

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Filename with path
 * @param {string} mimetype - File MIME type
 * @param {string} bucket - Storage bucket name (default: 'uploads')
 * @returns {Object} - Upload result with URL and path
 */
async function uploadFile(fileBuffer, filename, mimetype, bucket = 'uploads') {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filename, fileBuffer, {
                contentType: mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            logger.error('Supabase Storage upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filename);

        return {
            success: true,
            path: data.path,
            fullPath: data.fullPath,
            publicUrl: urlData.publicUrl,
            bucket: bucket
        };
    } catch (error) {
        logger.error('Error uploading file to Supabase Storage:', error);
        throw error;
    }
}

/**
 * Delete file from Supabase Storage
 * @param {string} filePath - File path in storage
 * @param {string} bucket - Storage bucket name (default: 'uploads')
 * @returns {boolean} - Success status
 */
async function deleteFile(filePath, bucket = 'uploads') {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            logger.error('Supabase Storage delete error:', error);
            return false;
        }

        return true;
    } catch (error) {
        logger.error('Error deleting file from Supabase Storage:', error);
        return false;
    }
}

/**
 * Get optimized image URL with transformations
 * @param {string} publicUrl - Original public URL
 * @param {Object} options - Transformation options
 * @returns {string} - Optimized URL
 */
function getOptimizedImageUrl(publicUrl, options = {}) {
    const {
        width,
        height,
        quality = 80,
        format = 'webp',
        resize = 'cover'
    } = options;

    if (!publicUrl) return null;

    const url = new URL(publicUrl);
    const params = new URLSearchParams();

    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    if (quality) params.append('quality', quality.toString());
    if (format) params.append('format', format);
    if (resize) params.append('resize', resize);

    if (params.toString()) {
        url.search = params.toString();
    }

    return url.toString();
}

/**
 * Upload profile picture
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} userId - User ID
 * @returns {Object} - Upload result with optimized URLs
 */
async function uploadProfilePicture(fileBuffer, originalName, mimetype, userId) {
    const filename = generateUniqueFilename(originalName, userId, 'profiles');
    const result = await uploadFile(fileBuffer, filename, mimetype);

    return {
        ...result,
        optimizedUrl: getOptimizedImageUrl(result.publicUrl, { width: 400, height: 400 }),
        thumbnailUrl: getOptimizedImageUrl(result.publicUrl, { width: 150, height: 150 })
    };
}

/**
 * Upload CV/Resume
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} userId - User ID
 * @returns {Object} - Upload result
 */
async function uploadCV(fileBuffer, originalName, mimetype, userId) {
    const filename = generateUniqueFilename(originalName, userId, 'cvs');
    return await uploadFile(fileBuffer, filename, mimetype);
}

/**
 * Upload company logo
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} userId - User ID
 * @returns {Object} - Upload result with optimized URLs
 */
async function uploadCompanyLogo(fileBuffer, originalName, mimetype, userId) {
    const filename = generateUniqueFilename(originalName, userId, 'logos');
    const result = await uploadFile(fileBuffer, filename, mimetype);

    return {
        ...result,
        optimizedUrl: getOptimizedImageUrl(result.publicUrl, { width: 300, height: 300 }),
        smallUrl: getOptimizedImageUrl(result.publicUrl, { width: 100, height: 100 })
    };
}

/**
 * Upload service image
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} userId - User ID
 * @returns {Object} - Upload result with optimized URLs
 */
async function uploadServiceImage(fileBuffer, originalName, mimetype, userId) {
    const filename = generateUniqueFilename(originalName, userId, 'services');
    const result = await uploadFile(fileBuffer, filename, mimetype);

    return {
        ...result,
        optimizedUrl: getOptimizedImageUrl(result.publicUrl, { width: 800, height: 600 }),
        thumbnailUrl: getOptimizedImageUrl(result.publicUrl, { width: 300, height: 200 })
    };
}

/**
 * Upload job image
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} userId - User ID
 * @returns {Object} - Upload result with optimized URLs
 */
async function uploadJobImage(fileBuffer, originalName, mimetype, userId) {
    const filename = generateUniqueFilename(originalName, userId, 'jobs');
    const result = await uploadFile(fileBuffer, filename, mimetype);

    return {
        ...result,
        optimizedUrl: getOptimizedImageUrl(result.publicUrl, { width: 1200, height: 800 }),
        thumbnailUrl: getOptimizedImageUrl(result.publicUrl, { width: 400, height: 300 })
    };
}

/**
 * Upload ID document
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} userId - User ID
 * @returns {Object} - Upload result
 */
async function uploadIDDocument(fileBuffer, originalName, mimetype, userId) {
    const filename = generateUniqueFilename(originalName, userId, 'ids');
    return await uploadFile(fileBuffer, filename, mimetype);
}

/**
 * Extract file path from Supabase Storage URL
 * @param {string} url - Supabase Storage URL
 * @returns {string|null} - File path or null
 */
function extractFilePathFromUrl(url) {
    if (!url) return null;
    
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const objectIndex = pathParts.indexOf('object');
        
        if (objectIndex !== -1 && pathParts[objectIndex + 1] === 'public') {
            // Remove /storage/v1/object/public/bucket-name/ part
            return pathParts.slice(objectIndex + 3).join('/');
        }
        
        return null;
    } catch (error) {
        logger.error('Error extracting file path from URL:', error);
        return null;
    }
}

/**
 * Validate file type and size
 * @param {string} mimetype - File MIME type
 * @param {number} size - File size in bytes
 * @param {string} fileType - Expected file type (image, document, etc.)
 * @returns {Object} - Validation result
 */
function validateFile(mimetype, size, fileType) {
    const maxSizes = {
        image: 5 * 1024 * 1024, // 5MB
        document: 10 * 1024 * 1024, // 10MB
        logo: 2 * 1024 * 1024 // 2MB
    };

    const allowedTypes = {
        image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        logo: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
    };

    const maxSize = maxSizes[fileType] || maxSizes.image;
    const allowed = allowedTypes[fileType] || allowedTypes.image;

    if (size > maxSize) {
        return {
            valid: false,
            error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`
        };
    }

    if (!allowed.includes(mimetype)) {
        return {
            valid: false,
            error: `File type ${mimetype} is not allowed for ${fileType}`
        };
    }

    return { valid: true };
}

module.exports = {
    uploadFile,
    deleteFile,
    getOptimizedImageUrl,
    uploadProfilePicture,
    uploadCV,
    uploadCompanyLogo,
    uploadServiceImage,
    uploadJobImage,
    uploadIDDocument,
    extractFilePathFromUrl,
    validateFile,
    generateUniqueFilename
};