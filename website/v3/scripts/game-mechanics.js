// Game Mechanics Module for Animal Farm v3
// Handles scoring, skip system, and other gamification features
// Requires: UserState, TransientState, turingTape from main app

// Game mechanics module uses global functions: handleFilmStripNavigation, maintainPreloadBuffer

// Game scoring configuration
const SCORE_VALUES = {
    like: 5,        // Basic engagement 
    dislike: 5,     // Same as like - both are valuable feedback
    skip: 0,        // No score penalty - time penalty is enough
    download: 100,  // High value action - user wants the image
    share: 200,     // Highest value - brings other users to platform
    view: 0,        // Initial view - no score (just for journey tracking)
    // history: 0   // No score - neither reward nor penalty
};

// Emoji display logic (data stored in UserState)

// Skip regeneration system configuration
const SKIP_REGEN_TIME = 3000; // milliseconds between regenerations
const MAX_SKIPS = 3;
let skipAnimationInProgress = false;

// Back regeneration system configuration
const BACK_REGEN_TIME = 4000; // milliseconds between regenerations (slightly slower than skip)
const MAX_BACKS = 3;
let backAnimationInProgress = false;

// Initialize the game mechanics module with required dependencies
function initGameMechanics() {
    // All dependencies (UserState, TransientState, turingTape, functions) accessed from global scope
    
    // Add window resize listener to recalculate emoji display
    window.addEventListener('resize', function() {
        updateEmojiStreamDisplay();
    });
    
    // Initialize gamification system
    initGamification();
    
    console.log('🎮 Game mechanics module initialized');
}

// Skip regeneration system
function processSkipRegeneration() {
    // Don't start new animation if one is already running
    if (skipAnimationInProgress || TransientState.skipBudget.regenQueue === 0) {
        return;
    }
    
    // Start regenerating one skip
    TransientState.skipBudget.regenQueue--;
    animateSkipRegeneration(() => {
        // Animation completed, regenerate the skip in TransientState
        TransientState.skipBudget.regenerateSkip();
        
        // TransientState handles skip budget - no need to sync globals
        
        // Update UI display
        updateSkipCounter();
        
        // Process next skip in queue
        processSkipRegeneration();
    });
}

function animateSkipRegeneration(onComplete) {
    const skipBtnEl = document.getElementById('skip-btn');
    
    if (!skipBtnEl) {
        onComplete();
        return;
    }
    
    // Set animation flag
    skipAnimationInProgress = true;
    
    // Start regeneration animation
    skipBtnEl.classList.add('regenerating');
    
    // Animate from 0% to 100% over SKIP_REGEN_TIME
    let progress = 0;
    const steps = Math.max(20, SKIP_REGEN_TIME / 50); // Minimum 20 steps, or 50ms per step
    const stepTime = SKIP_REGEN_TIME / steps;
    const stepIncrement = 100 / steps;
    const animationInterval = setInterval(() => {
        progress += stepIncrement;
        skipBtnEl.style.setProperty('--fill-progress', `${progress}%`);
        
        if (progress >= 100) {
            clearInterval(animationInterval);
            skipBtnEl.classList.remove('regenerating');
            skipBtnEl.style.removeProperty('--fill-progress');
            skipAnimationInProgress = false;
            onComplete();
        }
    }, stepTime); // 50ms intervals
}

// Handle skip action with budget system
function handleSkipAction() {
    // UI logic: check and update skip budget
    if (!TransientState.skipBudget.canSkip()) {
        console.log(`⏭️ Skip denied: ${TransientState.skipBudget.used}/${TransientState.skipBudget.maxSkips} skips used`);
        return;
    }
    
    if (!currentDisplayedImage) return;
    
    // UI logic: update skip budget and interface
    TransientState.skipBudget.useSkip();
    updateSkipCounter();
    TransientState.skipBudget.regenQueue++;
    processSkipRegeneration();
    
    // Navigate forward using buffer navigation
    navigate("forward");
    // Note: preload() is automatically called by navigate() to maintain buffers
}

// Update skip counter display
function updateSkipCounter() {
    const skipCountEl = document.getElementById('skip-count');
    const skipBtnEl = document.getElementById('skip-btn');
    
    // Use TransientState as single source of truth for skip counts
    const remaining = TransientState.skipBudget.maxSkips - TransientState.skipBudget.used;
    
    if (skipCountEl) {
        skipCountEl.textContent = remaining;
    }
    
    // Disable button when no skips left
    if (skipBtnEl) {
        if (remaining <= 0) {
            skipBtnEl.disabled = true;
            skipBtnEl.classList.add('disabled');
        } else {
            skipBtnEl.disabled = false;
            skipBtnEl.classList.remove('disabled');
        }
    }
}

// Back regeneration system (parallel to skip system)
function processBackRegeneration() {
    // Don't start new animation if one is already running
    if (backAnimationInProgress || TransientState.backBudget.regenQueue === 0) {
        return;
    }
    
    // Start regenerating one back
    TransientState.backBudget.regenQueue--;
    animateBackRegeneration(() => {
        // Animation completed, regenerate the back in TransientState
        TransientState.backBudget.regenerateBack();
        
        // Update UI display
        updateBackCounter();
        
        // Process next back in queue
        processBackRegeneration();
    });
}

function animateBackRegeneration(onComplete) {
    const backBtnEl = document.getElementById('back-btn');
    
    if (!backBtnEl) {
        onComplete();
        return;
    }
    
    // Set animation flag
    backAnimationInProgress = true;
    
    // Start regeneration animation with blue color theme
    backBtnEl.classList.add('regenerating-back');
    
    // Animate from 0% to 100% over BACK_REGEN_TIME
    let progress = 0;
    const steps = Math.max(20, BACK_REGEN_TIME / 50); // Minimum 20 steps, or 50ms per step
    const stepTime = BACK_REGEN_TIME / steps;
    const stepIncrement = 100 / steps;
    const animationInterval = setInterval(() => {
        progress += stepIncrement;
        backBtnEl.style.setProperty('--fill-progress', `${progress}%`);
        
        if (progress >= 100) {
            clearInterval(animationInterval);
            backBtnEl.classList.remove('regenerating-back');
            backBtnEl.style.removeProperty('--fill-progress');
            backAnimationInProgress = false;
            onComplete();
        }
    }, stepTime);
}

// Handle back action with budget system
function handleBackAction() {
    // UI logic: check and update back budget
    if (!TransientState.backBudget.canBack()) {
        console.log(`⏪ Back denied: ${TransientState.backBudget.used}/${TransientState.backBudget.maxBacks} backs used`);
        return;
    }
    
    if (!currentDisplayedImage) return;
    
    // UI logic: update back budget and interface
    TransientState.backBudget.useBack();
    updateBackCounter();
    TransientState.backBudget.regenQueue++;
    processBackRegeneration();
    
    // Navigate backward using buffer navigation
    navigate("backward");
    // Note: preload() is automatically called by navigate() to maintain buffers
}

// Update back counter display
function updateBackCounter() {
    const backCountEl = document.getElementById('back-count');
    const backBtnEl = document.getElementById('back-btn');
    
    // Use TransientState as single source of truth for back counts
    const remaining = TransientState.backBudget.maxBacks - TransientState.backBudget.used;
    
    if (backCountEl) {
        backCountEl.textContent = remaining;
    }
    
    // Disable button when no backs left
    if (backBtnEl) {
        if (remaining <= 0) {
            backBtnEl.disabled = true;
            backBtnEl.classList.add('disabled');
        } else {
            backBtnEl.disabled = false;
            backBtnEl.classList.remove('disabled');
        }
    }
}

// Calculate how many emojis fit in available container width
function calculateMaxEmojisPerLine() {
    const emojiWidth = 24;
    const likedStreamEl = document.getElementById('emoji-stream-liked');
    const containerWidth = likedStreamEl.clientWidth;
    return Math.floor(containerWidth / emojiWidth);
}

// Update emoji stream display with sliding window
function updateEmojiStreamDisplay() {
    const displayData = UserState.getDisplayData();
    const maxEmojis = calculateMaxEmojisPerLine();
    
    // Update liked emojis stream
    const likedStreamEl = document.getElementById('emoji-stream-liked');
    if (likedStreamEl) {
        const likedEmojiObjects = displayData.likedEmojis;
        if (!likedEmojiObjects || likedEmojiObjects.length === 0) {
            // Clear existing content
            while (likedStreamEl.firstChild) {
                likedStreamEl.removeChild(likedStreamEl.firstChild);
            }
        } else {
            // Show only the most recent emojis that fit on screen
            const visibleEmojiObjects = likedEmojiObjects.slice(-maxEmojis);
            const emojiElements = generateEmojiElements(visibleEmojiObjects);
            
            // Check if content is changing by comparing length
            const contentChanged = likedStreamEl.children.length !== visibleEmojiObjects.length;
            
            // Clear and add new content
            while (likedStreamEl.firstChild) {
                likedStreamEl.removeChild(likedStreamEl.firstChild);
            }
            likedStreamEl.appendChild(emojiElements);
            
            // Add slide animation if content is changing
            if (contentChanged) {
                likedStreamEl.classList.add('sliding');
                setTimeout(() => likedStreamEl.classList.remove('sliding'), 300);
            }
        }
    }
    
    // Update disliked emojis stream
    const dislikedStreamEl = document.getElementById('emoji-stream-disliked');
    if (dislikedStreamEl) {
        const dislikedEmojiObjects = displayData.dislikedEmojis;
        if (!dislikedEmojiObjects || dislikedEmojiObjects.length === 0) {
            // Clear existing content
            while (dislikedStreamEl.firstChild) {
                dislikedStreamEl.removeChild(dislikedStreamEl.firstChild);
            }
        } else {
            // Show only the most recent emojis that fit on screen
            const visibleEmojiObjects = dislikedEmojiObjects.slice(-maxEmojis);
            const emojiElements = generateEmojiElements(visibleEmojiObjects);
            
            // Check if content is changing by comparing length
            const contentChanged = dislikedStreamEl.children.length !== visibleEmojiObjects.length;
            
            // Clear and add new content
            while (dislikedStreamEl.firstChild) {
                dislikedStreamEl.removeChild(dislikedStreamEl.firstChild);
            }
            dislikedStreamEl.appendChild(emojiElements);
            
            // Add slide animation if content is changing
            if (contentChanged) {
                dislikedStreamEl.classList.add('sliding');
                setTimeout(() => dislikedStreamEl.classList.remove('sliding'), 300);
            }
        }
    }
    
    // Update categories display
    updateCategoriesDisplay();
}

// Get CSS class name for emoji category
function getEmojiCategoryClass(emoji) {
    if (!cocoCategories) return '';
    
    for (const [categoryId, categoryData] of Object.entries(cocoCategories.achievements)) {
        if (categoryData.coco_classes.includes(emoji)) {
            // Convert display name to CSS class (lowercase, no spaces)
            return categoryData.display_name.toLowerCase().replace(/\s+/g, '-');
        }
    }
    return '';
}

// Generate emoji HTML with category classes and image association
function generateEmojiElements(emojiObjects) {
    const fragment = document.createDocumentFragment();
    
    emojiObjects.forEach(emojiObj => {
        const emoji = emojiObj.emoji || emojiObj; // Handle both objects and strings for backward compatibility
        const imageId = emojiObj.imageId || '';
        const categoryClass = getEmojiCategoryClass(emoji);
        
        const emojiSpan = document.createElement('span');
        emojiSpan.className = `emoji ${categoryClass}`;
        emojiSpan.setAttribute('data-image-id', imageId);
        emojiSpan.textContent = emoji;
        
        fragment.appendChild(emojiSpan);
    });
    
    return fragment;
}

// Update categories display with emoji counts by category
function updateCategoriesDisplay() {
    const likedEl = document.getElementById('categories-liked');
    const dislikedEl = document.getElementById('categories-disliked');
    if (!likedEl || !dislikedEl) return;
    
    const { liked, disliked } = analyzeEmojiStreams();
    
    const likedText = Object.keys(liked).length > 0 
        ? Object.entries(liked).map(([category, count]) => {
            const categoryData = Object.values(cocoCategories.achievements).find(cat => cat.display_name === category);
            return `${categoryData.badge_emoji} ${count}`;
        }).join(' ')
        : 'none yet';
    
    const dislikedText = Object.keys(disliked).length > 0
        ? Object.entries(disliked).map(([category, count]) => {
            const categoryData = Object.values(cocoCategories.achievements).find(cat => cat.display_name === category);
            return `${categoryData.badge_emoji} ${count}`;
        }).join(' ')
        : 'none yet';
    
    likedEl.textContent = `Liked: ${likedText}`;
    dislikedEl.textContent = `Disliked: ${dislikedText}`;
}

// Collect game mechanics state data
function collectGameMechanicsState() {
    const displayData = UserState.getDisplayData();
    
    return {
        userScore: displayData.score,
        skipBudget: TransientState.skipBudget.maxSkips,
        skipsUsed: TransientState.skipBudget.used
    };
}

// COCO categorization system
let cocoCategories = null;

// Initialize categorization system
async function initGamification() {
    try {
        const categoriesResponse = await fetch('data/coco_categories.json');
        cocoCategories = await categoriesResponse.json();
        
        console.log('🏷️ COCO categorization system initialized');
    } catch (error) {
        console.error('Failed to initialize categorization:', error);
    }
}

// Categorize current emoji streams separately
function analyzeEmojiStreams() {
    if (!cocoCategories) return { liked: {}, disliked: {} };
    
    const displayData = UserState.getDisplayData();
    const likedEmojiObjects = displayData.likedEmojis || [];
    const dislikedEmojiObjects = displayData.dislikedEmojis || [];
    
    const likedCounts = {};
    const dislikedCounts = {};
    
    // Count emojis by category for each stream
    for (const [categoryId, categoryData] of Object.entries(cocoCategories.achievements)) {
        const displayName = categoryData.display_name;
        const categoryEmojis = categoryData.coco_classes;
        
        const likedCount = likedEmojiObjects.filter(emojiObj => {
            const emoji = emojiObj.emoji || emojiObj; // Handle both objects and strings
            return categoryEmojis.includes(emoji);
        }).length;
        
        const dislikedCount = dislikedEmojiObjects.filter(emojiObj => {
            const emoji = emojiObj.emoji || emojiObj; // Handle both objects and strings
            return categoryEmojis.includes(emoji);
        }).length;
        
        if (likedCount > 0) likedCounts[displayName] = likedCount;
        if (dislikedCount > 0) dislikedCounts[displayName] = dislikedCount;
    }
    
    return { liked: likedCounts, disliked: dislikedCounts };
}

// Export functions for use in main app
const GameMechanics = {
    init: initGameMechanics,
    get SCORE_VALUES() { return SCORE_VALUES; },
    SKIP_REGEN_TIME,
    MAX_SKIPS,
    processSkipRegeneration,
    animateSkipRegeneration,
    handleSkipAction,
    updateSkipCounter,
    BACK_REGEN_TIME,
    MAX_BACKS,
    processBackRegeneration,
    animateBackRegeneration,
    handleBackAction,
    updateBackCounter,
    collectGameMechanicsState,
    updateEmojiStreamDisplay: updateEmojiStreamDisplay,
    calculateMaxEmojisPerLine: calculateMaxEmojisPerLine,
    updateCategoriesDisplay,
    initGamification,
    analyzeEmojiStreams
};

// Make available globally for browser environment
if (typeof window !== 'undefined') {
    window.GameMechanics = GameMechanics;
    
    // Initialize the module now that it's loaded
    GameMechanics.init();
}
