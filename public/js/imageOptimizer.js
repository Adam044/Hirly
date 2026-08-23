/**
 * Client-side image optimization and lazy loading utilities
 * Reduces bandwidth usage and improves page load performance
 */

class ImageOptimizer {
    constructor() {
        this.lazyImages = [];
        this.imageObserver = null;
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupProgressiveLoading();
        this.setupWebPDetection();
    }

    /**
     * Derives optimized variant URL from original Supabase URL
     * @param {string} url - Original public URL
     * @param {'thumb'|'opt'} variant - Variant type
     * @returns {string} - Variant URL
     */
    static getOptimizedUrl(url, variant = 'thumb') {
        if (!url || typeof url !== 'string') return url;
        
        // Only process Supabase storage URLs that are in profiles or logos
        if (url.includes('/profiles/') || url.includes('/logos/')) {
            // Remove any query parameters if present
            const baseUrl = url.split('?')[0];
            const extension = baseUrl.substring(baseUrl.lastIndexOf('.'));
            
            // Avoid double-suffixing if the URL is already a variant
            if (baseUrl.endsWith('_thumb.webp') || baseUrl.endsWith('_opt.webp')) {
                return url;
            }
            
            // Check if it's a supported image extension
            const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
            if (validExtensions.includes(extension.toLowerCase())) {
                const base = baseUrl.substring(0, baseUrl.lastIndexOf('.'));
                return `${base}_${variant}.webp`;
            }
        }
        return url;
    }

    /**
     * Sets up lazy loading for images
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px', // Start loading 50px before image enters viewport
                threshold: 0.01
            });

            this.observeImages();
        } else {
            // Fallback for older browsers
            this.loadAllImages();
        }
    }

    /**
     * Observes all images with data-src attribute for lazy loading
     */
    observeImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.imageObserver.observe(img);
        });
    }

    /**
     * Loads an individual image with progressive enhancement
     */
    loadImage(img) {
        const src = img.dataset.src;
        const placeholder = img.dataset.placeholder;
        
        if (!src) return;

        // Create a new image to preload
        const imageLoader = new Image();
        
        imageLoader.onload = () => {
            // Smooth transition from placeholder to actual image
            img.style.transition = 'opacity 0.3s ease-in-out';
            img.src = src;
            img.classList.add('loaded');
            
            // Remove placeholder after transition
            setTimeout(() => {
                if (placeholder) {
                    img.style.backgroundImage = 'none';
                }
            }, 300);
        };

        imageLoader.onerror = () => {
            img.classList.add('error');
            console.warn('Failed to load image:', src);
        };

        // Start loading the actual image
        imageLoader.src = src;
    }

    /**
     * Sets up progressive image loading with blur-up technique
     */
    setupProgressiveLoading() {
        const progressiveImages = document.querySelectorAll('.progressive-image');
        
        progressiveImages.forEach(container => {
            const img = container.querySelector('img');
            const placeholder = container.querySelector('.image-placeholder');
            
            if (img && placeholder) {
                img.onload = () => {
                    img.style.opacity = '1';
                    placeholder.style.opacity = '0';
                    
                    setTimeout(() => {
                        placeholder.remove();
                    }, 300);
                };
            }
        });
    }

    /**
     * Detects WebP support and updates image sources
     */
    setupWebPDetection() {
        // Modern browsers automatically handle WebP through Accept headers
        // This is mainly for additional client-side optimizations
        this.supportsWebP = this.checkWebPSupport();
    }

    /**
     * Checks if browser supports WebP format
     */
    checkWebPSupport() {
        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    /**
     * Optimizes image before upload (client-side)
     */
    async optimizeImageForUpload(file, options = {}) {
        const {
            maxWidth = 1200,
            maxHeight = 1200,
            quality = 0.8,
            format = 'jpeg'
        } = options;

        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;

                // Draw and compress image
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, `image/${format}`, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Creates a blurred placeholder for progressive loading
     */
    createPlaceholder(src, callback) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Create small blurred version
            canvas.width = 40;
            canvas.height = 40;
            
            ctx.filter = 'blur(2px)';
            ctx.drawImage(img, 0, 0, 40, 40);
            
            const placeholderDataUrl = canvas.toDataURL('image/jpeg', 0.1);
            callback(placeholderDataUrl);
        };
        
        img.src = src;
    }

    /**
     * Fallback for browsers without IntersectionObserver
     */
    loadAllImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => this.loadImage(img));
    }

    /**
     * Refresh observer for dynamically added images
     */
    refresh() {
        if (this.imageObserver) {
            this.observeImages();
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
    }
}

// Initialize image optimizer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.imageOptimizer = new ImageOptimizer();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageOptimizer;
}