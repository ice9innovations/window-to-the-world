/**
 * Centralized Logging Utility
 * 
 * Usage:
 *   logger('navigation', 'Added random image to buffer');
 *   logger('error', 'Failed to load image');
 *   logger('debug', 'Processing bounding boxes');
 * 
 * Categories:
 *   - navigation: Buffer operations, image loading, navigation state
 *   - error: Error conditions, failures, warnings
 *   - debug: Temporary debugging, development info
 *   - api: Network requests, API responses
 *   - ui: User interactions, state changes
 *   - bounding: Bounding box calculations and rendering
 */

// Configure which categories to show
const ENABLED_CATEGORIES = [
    'navigation',
    'error',
    'debug',    // Enabled for color palette debugging
    'ui'        // Enabled for UI debugging
    // 'api',      // Uncomment to see network activity
    // 'bounding'  // Uncomment for bounding box debugging
];

// Category styling for better visual distinction
const CATEGORY_STYLES = {
    navigation: '📼',
    error: '❌',
    debug: '🔍',
    api: '📡',
    ui: '🎯',
    bounding: '📦'
};

/**
 * Central logging function
 * @param {string} category - Log category (navigation, error, debug, api, ui, bounding)
 * @param {string} message - Primary log message
 * @param {*} data - Optional additional data to log
 */
function logger(category, message, data = null) {
    // Skip if category is not enabled
    if (!ENABLED_CATEGORIES.includes(category)) {
        return;
    }
    
    // Get emoji for category, fallback to generic
    const emoji = CATEGORY_STYLES[category] || '📝';
    
    // Format timestamp
    const timestamp = new Date().toLocaleTimeString();
    
    // Format the log message
    const prefix = `${emoji} [${category.toUpperCase()}]`;
    
    if (data !== null) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

/**
 * Quick access functions for common categories
 */
const log = {
    navigation: (message, data) => logger('navigation', message, data),
    error: (message, data) => logger('error', message, data),
    debug: (message, data) => logger('debug', message, data),
    api: (message, data) => logger('api', message, data),
    ui: (message, data) => logger('ui', message, data),
    bounding: (message, data) => logger('bounding', message, data)
};

/**
 * Enable/disable categories at runtime
 */
function enableCategory(category) {
    if (!ENABLED_CATEGORIES.includes(category)) {
        ENABLED_CATEGORIES.push(category);
    }
}

function disableCategory(category) {
    const index = ENABLED_CATEGORIES.indexOf(category);
    if (index !== -1) {
        ENABLED_CATEGORIES.splice(index, 1);
    }
}

// Make logger available globally
window.logger = logger;
window.log = log;
window.enableCategory = enableCategory;
window.disableCategory = disableCategory;