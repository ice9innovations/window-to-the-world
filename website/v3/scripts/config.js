// Animal Farm v3 - Configuration
// Environment-specific settings

// Get base URL from current location (no hardcoded fallbacks)
const protocol = window.location.protocol;
const hostname = window.location.hostname;
const port = window.location.port ? `:${window.location.port}` : '';
const BASE_URL = `${protocol}//${hostname}${port}`;

// Environment-specific configuration
const CONFIG = {
    // Base URLs
    BASE_URL: BASE_URL,
    
    // API endpoints
    API_URL: '/v3/controller',
    DATABASE_URL: '/v3/controller',
    
    // Image serving
    IMAGES_BASE_URL: BASE_URL,
    COCO_IMAGES_PATH: '/images/coco',
    
    // Environment info (derived from hostname, not hardcoded)
    ENVIRONMENT: hostname === 'window-to-the-world.org' ? 'production' : 'development',
    
    // Debug settings
    DEBUG: hostname !== 'window-to-the-world.org',
    
    // Build full URLs
    getImageUrl: function(filename) {
        // Convert jpg extensions to webp
        const webpFilename = filename.replace(/\.(jpe?g)$/i, '.webp');
        return `${this.IMAGES_BASE_URL}${this.COCO_IMAGES_PATH}/${webpFilename}`;
    },
    
    getThumbnailUrl: function(filename) {
        return `${this.IMAGES_BASE_URL}${this.COCO_IMAGES_PATH}/${filename}`;
    }
};

// Log environment on load
if (CONFIG.DEBUG) {
    console.log('🔧 CONFIG loaded:', CONFIG);
}

// Make config globally available
window.CONFIG = CONFIG;
