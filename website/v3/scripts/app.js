// Animal Farm v3 - Tinder-style Image Analysis Interface

// =============================================================================
// BUFFER NAVIGATION SYSTEM
// =============================================================================
// Clean past-present-future buffer system: <past> current image <future>
// Uses forwardBuffer[] and backwardBuffer[] arrays for instant navigation
const BACKWARD_PRELOAD_COUNT = 1; // How many older images to keep preloaded
const FORWARD_PRELOAD_COUNT = 10; // How many random images to keep preloaded
let backwardBuffer = []; // Historical images from user database
let forwardBuffer = []; // Random images from COCO database
let currentDisplayedImage = null; // Track the currently displayed image with full data
let hasReachedEndOfHistory = false; // Track when we've exhausted all historical images

// Clean navigation system - pop one, add one
async function navigate(direction) {
  console.log(`🔍 Navigate called with direction: ${direction}`);

  // Update linger time for current image before navigating away
  if (currentDisplayedImage && currentDisplayedImage.actionHistory) {
    // Find the most recent view action
    for (let i = currentDisplayedImage.actionHistory.length - 1; i >= 0; i--) {
      const action = currentDisplayedImage.actionHistory[i];
      if (
        action.action === "view" &&
        action.metadata &&
        action.metadata.lingerTime === 0
      ) {
        // Calculate linger time from view start to now
        const viewStart = new Date(action.timestamp);
        const now = new Date();
        action.metadata.lingerTime = now - viewStart; // milliseconds
        console.log(
          `⏱️ Updated linger time: ${action.metadata.lingerTime}ms for ${currentDisplayedImage.filename}`
        );
        break; // Only update the most recent view
      }
    }
  }

  logger(
    "navigation",
    `Buffer status: forward=${forwardBuffer.length}, backward=${backwardBuffer.length}`
  );

  let image;
  if (direction === "backward") {
    image = backwardBuffer.pop();
    // Only move current image to forward buffer if we successfully got a backward image
    if (image && currentDisplayedImage) {
      forwardBuffer.unshift(currentDisplayedImage);
    }
  }
  if (direction === "forward") {
    image = forwardBuffer.shift();
    // Only move current image to past buffer if we successfully got a forward image
    if (image && currentDisplayedImage) {
      backwardBuffer.push(currentDisplayedImage);

      // Manage backward buffer overflow
      if (backwardBuffer.length > BACKWARD_PRELOAD_COUNT) {
        const excessImage = backwardBuffer.shift();
        storeImageToDatabase("view", excessImage, {
          context: "buffer_overflow",
        });
      }
    }
  }

  console.log(
    `🖼️ Got image from buffer:`,
    image ? `${image.filename} (${image.url})` : "null"
  );

  if (image) {
    // Clear old bounding boxes immediately and aggressively
    clearAllBoundingBoxes();

    // Store the complete image object
    currentDisplayedImage = image;

    if (!image.analysisData) {
      logger("error", "Image missing analysis data");

      // Show user-friendly error message with options
      showError(
        "This image could not be fully analyzed. Showing image without ML features."
      );

      // Display image without analysis-dependent features
      displayImageWithoutAnalysis(image);
      return;
    }

    // Display image with dimensions from analysis data
    displayImage(image.url, image.analysisData);
    displaySimplifiedResults(image.analysisData);
    // Render bounding boxes synchronously with known dimensions
    renderBoundingBoxesIfEnabled(image.analysisData);

    await preload(direction); // refill the buffer we just used
  } else {
    // No image in buffer - try to load one if going backward
    if (direction === "backward") {
      console.log(
        "🔍 No backward buffer - attempting to load historical image"
      );
      const loadedSuccessfully = await addOneHistoricalImage();

      if (loadedSuccessfully && backwardBuffer.length > 0) {
        image = backwardBuffer.shift(); // Set image so the regular flow continues
        // Move current image to forward buffer since we found a backward image
        if (image && currentDisplayedImage) {
          forwardBuffer.unshift(currentDisplayedImage);
        }
      } else {
        console.log(
          "❌ No historical images available - cannot navigate backward"
        );
        return; // Exit early to prevent infinite loop
      }
    } else {
      console.error(`❌ No image available in ${direction} buffer`);
    }
  }
}

async function preload(direction) {
  // Always check if backward buffer needs refilling, regardless of navigation direction
  if (backwardBuffer.length < BACKWARD_PRELOAD_COUNT) {
    await addOneHistoricalImage();
  }
  if (direction === "forward" && forwardBuffer.length < FORWARD_PRELOAD_COUNT) {
    await addOneRandomImage();
  }
}

// Add one historical image to backward buffer
async function addOneHistoricalImage() {
  console.log(
    "🔍 addOneHistoricalImage called, backwardBuffer size:",
    backwardBuffer.length
  );

  try {
    // Build URL with database ID for reliable pagination
    let url = `/v3/controller/retrieve?username=${encodeURIComponent(
      username
    )}`;

    // Get the oldest database ID from buffer, or use current image if buffer empty
    let afterId = "";
    if (backwardBuffer.length > 0) {
      // In LIFO stack, find the image with the smallest databaseId (oldest)
      const oldestImage = backwardBuffer.reduce((oldest, current) => {
        return current.databaseId &&
          (!oldest.databaseId || current.databaseId < oldest.databaseId)
          ? current
          : oldest;
      });
      logger(
        "navigation",
        `Oldest image in buffer: ${oldestImage.filename}, databaseId: ${oldestImage.databaseId}`
      );
      afterId = oldestImage.databaseId || "";
    } else if (currentDisplayedImage && currentDisplayedImage.databaseId) {
      // Buffer empty, use current displayed image database ID (only if it exists)
      afterId = currentDisplayedImage.databaseId;
    }
    logger("navigation", `Using afterId: ${afterId}`);

    if (afterId) {
      // Historical navigation: get images before this database ID
      url += `&after_id=${encodeURIComponent(afterId)}`;
    }

    // Enable consume pattern to prevent duplicates
    url += `&consume=1`;
    // If no afterId: current image is new random image (no databaseId)
    // Request most recent historical image (no WHERE clause parameters)

    console.log("📡 Fetching:", url);
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success || !result.images || result.images.length === 0) {
      console.log(
        "📼 No more older images found - reached beginning of history"
      );
      return false;
    }

    // Get the unified image object from database
    const unifiedImage = result.images[0];
    logger(
      "navigation",
      `Controller returned image with databaseId: ${unifiedImage.databaseId}, filename: ${unifiedImage.filename}`
    );

    const olderFrame = {
      ...unifiedImage, // Preserve ALL fields including encounterId
      filename: unifiedImage.filename,
      url: CONFIG.getImageUrl(unifiedImage.filename),
      databaseId: unifiedImage.databaseId, // Set database ID for pagination
      analysisData: {
        ...unifiedImage.analysisData,
        source: "historical_from_database",
      },
      actionHistory: unifiedImage.actionHistory || [],
      timestamp:
        unifiedImage.actionHistory?.length > 0
          ? unifiedImage.actionHistory[unifiedImage.actionHistory.length - 1]
              .timestamp
          : new Date().toISOString(),
      source: "backward_preloaded",
    };

    backwardBuffer.push(olderFrame);

    logger(
      "navigation",
      `Added one historical image: ${olderFrame.filename}. Buffer has ${backwardBuffer.length} frames.`
    );
    return true;
  } catch (error) {
    console.error("❌ Error adding historical image:", error);
    return false;
  }
}

// Add one random image to forward buffer
async function addOneRandomImage() {
  try {
    const imageData = await loadRandomImageWithData();
    if (imageData) {
      // Preload image into browser cache
      await preloadImageInCache(imageData.url);

      // Create frame ready for display
      const randomFrame = {
        ...imageData, // Preserve ALL fields including encounterId
        filename: imageData.cocoFile,
        url: imageData.url,
        analysisData: {
          ...imageData.analysisData,
          source: "random_from_api",
        },
        timestamp: Date.now(),
        source: "forward_preloaded",
      };

      forwardBuffer.unshift(randomFrame);
      logger(
        "navigation",
        `Added one random image: ${randomFrame.filename}. Buffer has ${forwardBuffer.length} frames`
      );
    }
  } catch (error) {
    console.error("❌ Error adding random image:", error);
  }
}

// Load a specific image by filename (for shared links)
async function loadSpecificImage(filename) {
  try {
    const imageData = await loadImageWithData(filename);
    if (imageData) {
      // Preload image into browser cache
      await preloadImageInCache(imageData.url);

      // Create frame ready for display
      const specificFrame = {
        ...imageData, // Preserve ALL fields including encounterId
        filename: imageData.cocoFile,
        url: imageData.url,
        analysisData: imageData.analysisData,
        timestamp: Date.now(),
        source: "shared_link",
      };

      console.log(`🔗 Loaded specific shared image: ${specificFrame.filename}`);
      return specificFrame;
    }
  } catch (error) {
    console.error("❌ Error loading specific image:", error);
    return null;
  }
}

// Initialize both buffers with initial images
async function initializeBuffers() {
  console.log("🚀 Initializing navigation buffers...");

  const totalImages = FORWARD_PRELOAD_COUNT + BACKWARD_PRELOAD_COUNT;
  let loadedCount = 0;

  // Load initial forward buffer
  for (let i = 0; i < FORWARD_PRELOAD_COUNT; i++) {
    updateProgress(
      10 + (loadedCount / totalImages) * 80,
      `Loading random image ${i + 1}/${FORWARD_PRELOAD_COUNT}...`
    );
    await addOneRandomImage();
    loadedCount++;
  }

  // Load initial backward buffer (if we have history)
  if (username) {
    for (let i = 0; i < BACKWARD_PRELOAD_COUNT; i++) {
      updateProgress(
        10 + (loadedCount / totalImages) * 80,
        `Loading historical image ${i + 1}/${BACKWARD_PRELOAD_COUNT}...`
      );
      await addOneHistoricalImage();
      loadedCount++;
      // addOneHistoricalImage will return early if no more history available
    }
  }

  console.log(
    `✅ Buffers initialized: ${forwardBuffer.length} forward, ${backwardBuffer.length} backward`
  );
}

// Get one older image from backward buffer (instant, like forward navigation)
function getPreloadedOlderImage() {
  if (backwardBuffer.length === 0) {
    console.log("📼 No preloaded older images available");
    return null;
  }

  // Take the most recent image from buffer (FIFO)
  const olderFrame = backwardBuffer.shift();
  console.log(
    `📼 Retrieved preloaded older image: ${olderFrame.filename}. Buffer now has ${backwardBuffer.length} images`
  );

  // Pop one, add one - simple replacement
  addOneOlderImage();

  return olderFrame;
}

// Get current image filename from DOM
function getCurrentImageFilename() {
  const currentImgElement = document.getElementById("main-image");
  if (!currentImgElement || !currentImgElement.src) {
    return null;
  }

  let filename = currentImgElement.src.split("/").pop();
  // Convert .webp back to .jpg for consistent lookup
  if (filename.endsWith(".webp")) {
    filename = filename.replace(".webp", ".jpg");
  }
  return filename;
}

// User Preferences - persistent interface preferences (separate from Turing Tape)
const UserPreferences = {
  // Note: boundingBoxes are tracked in URL params for sharing, not here

  // emojiStream removed - was causing state management conflicts

  // Helper methods for easy extension
  get: function (category, property) {
    return this[category] && this[category][property];
  },

  set: function (category, property, value) {
    if (!this[category]) this[category] = {};
    this[category][property] = value;
  },

  // Reset specific categories if needed
  reset: function (category) {
    if (category && this[category]) {
      // Reset to defaults - could be made more sophisticated
    }
  },
};

// Transient State - resets every session, never persisted
const TransientState = {
  skipBudget: {
    used: 0,
    maxSkips: 3,
    regenQueue: 0,
    lastSkipTime: 0,

    // Helper methods
    canSkip: function () {
      return this.used < this.maxSkips;
    },

    useSkip: function () {
      if (this.canSkip()) {
        this.used++;
        this.lastSkipTime = Date.now();
        return true;
      }
      return false;
    },

    regenerateSkip: function () {
      if (this.used > 0) {
        this.used--;
        console.log(
          `🔄 Skip regenerated! (${this.maxSkips - this.used}/${
            this.maxSkips
          } available)`
        );
      }
    },
  },

  backBudget: {
    used: 0,
    maxBacks: 3,
    regenQueue: 0,
    lastBackTime: 0,

    // Helper methods
    canBack: function () {
      return this.used < this.maxBacks;
    },

    useBack: function () {
      if (this.canBack()) {
        this.used++;
        this.lastBackTime = Date.now();
        return true;
      }
      return false;
    },

    regenerateBack: function () {
      if (this.used > 0) {
        this.used--;
        console.log(
          `🔙 Back regenerated! (${this.maxBacks - this.used}/${
            this.maxBacks
          } available)`
        );
      }
    },
  },

  // UI state that resets each session
  currentImageId: null,

  // Reset specific categories if needed
  reset: function (category) {
    if (category && this[category]) {
      // Reset to defaults - could be made more sophisticated
      if (category === "skipBudget") {
        this.skipBudget.used = 0;
        this.skipBudget.lastSkipTime = 0;
      }
    }
  },
};

// Helper function to read bounding box state from URL (for sharing)
function isBoundingBoxesEnabled() {
  return UserState.boundingBoxesEnabled;
}

// UI-only global variables (not game state - that's in Turing Tape)
let viewingHistory = []; // Image buffer for preloading system
// SCORE_VALUES moved to game-mechanics.js

// UserState - All persistent user data (metrics + preferences)
const UserState = {
  // User metrics
  score: 0,
  likeCount: 0,
  dislikeCount: 0,
  likedEmojis: [],
  dislikedEmojis: [],

  // UI preferences
  boundingBoxesEnabled: false,

  // Update state from user action
  updateFromAction(imageId, newAction, emojis, previousAction = null) {
    console.log(
      `📊 UserState update: ${newAction} on ${imageId}, previous: ${previousAction}`
    );

    // Score: only count first engagement action (no double-scoring)
    if (!previousAction || previousAction === "view") {
      // Subtract 1 point for viewing each new image
      this.score -= 1;
      let totalPointChange = -1;

      // Award 1 point per emoji for like/dislike actions
      if (newAction === "like" || newAction === "dislike") {
        const emojiPoints = emojis ? emojis.length : 0;
        this.score += emojiPoints;
        totalPointChange = -1 + emojiPoints;
        console.log(
          `📊 ${newAction}: -1 (new image) +${emojiPoints} (emojis) = ${
            totalPointChange > 0 ? "+" : ""
          }${totalPointChange} total`
        );
      } else {
        console.log(`📊 ${newAction}: -1 point (new image cost)`);
      }

      if (newAction === "like") this.likeCount++;
      if (newAction === "dislike") this.dislikeCount++;
    }

    // Emoji streams: handle changes so user can curate their collection
    if (previousAction === "like" && emojis && emojis.length > 0) {
      // Remove previous emojis from liked stream (matching both emoji and imageId)
      emojis.forEach((emoji) => {
        const index = this.likedEmojis.findLastIndex(
          (item) => item.emoji === emoji && item.imageId === imageId
        );
        if (index > -1) this.likedEmojis.splice(index, 1);
      });
    }
    if (previousAction === "dislike" && emojis && emojis.length > 0) {
      // Remove previous emojis from disliked stream (matching both emoji and imageId)
      emojis.forEach((emoji) => {
        const index = this.dislikedEmojis.findLastIndex(
          (item) => item.emoji === emoji && item.imageId === imageId
        );
        if (index > -1) this.dislikedEmojis.splice(index, 1);
      });
    }

    // Add all emojis to appropriate stream with image association
    if (newAction === "like" && emojis && emojis.length > 0) {
      const emojiObjects = emojis.map((emoji) => ({ emoji, imageId }));
      this.likedEmojis.push(...emojiObjects);
    }
    if (newAction === "dislike" && emojis && emojis.length > 0) {
      const emojiObjects = emojis.map((emoji) => ({ emoji, imageId }));
      this.dislikedEmojis.push(...emojiObjects);
    }

    console.log(
      `📊 UserState updated: score=${this.score}, likes=${this.likeCount}, dislikes=${this.dislikeCount}`
    );
  },

  // Get current state for UI display
  getDisplayData() {
    return {
      score: this.score,
      likeCount: this.likeCount,
      dislikeCount: this.dislikeCount,
      likedEmojis: [...this.likedEmojis],
      dislikedEmojis: [...this.dislikedEmojis],
    };
  },

  // Restore all user state from database
  async restoreFromDatabase() {
    try {
      const response = await fetch(
        `${CONFIG.DATABASE_URL}/session_state?username=${encodeURIComponent(
          window.username
        )}`
      );
      if (!response.ok) {
        console.log("No saved user state found - starting fresh");
        return;
      }

      const data = await response.json();
      if (!data.success || !data.preferences) {
        console.log("No saved user state found - starting fresh");
        return;
      }

      const state = data.preferences;

      // Restore all user state from flat structure
      this.score = state.score || 0;
      this.likeCount = state.likeCount || 0;
      this.dislikeCount = state.dislikeCount || 0;
      this.likedEmojis = state.likedEmojis || [];
      this.dislikedEmojis = state.dislikedEmojis || [];
      this.boundingBoxesEnabled = state.boundingBoxesEnabled || false;

      console.log(
        `📊 UserState restored: score=${this.score}, likes=${this.likeCount}, dislikes=${this.dislikeCount}, bbox=${this.boundingBoxesEnabled}`
      );
      console.log(
        `📊 Emoji streams: ${this.likedEmojis.length} liked, ${this.dislikedEmojis.length} disliked`
      );
    } catch (error) {
      console.error("Failed to restore user state:", error);
    }
  },

  // Save all user state to database
  async save() {
    try {
      const userStateData = {
        score: this.score,
        likeCount: this.likeCount,
        dislikeCount: this.dislikeCount,
        likedEmojis: this.likedEmojis,
        dislikedEmojis: this.dislikedEmojis,
        boundingBoxesEnabled: this.boundingBoxesEnabled,
      };

      const response = await fetch(`${CONFIG.DATABASE_URL}/session_state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: window.username,
          preferences: userStateData,
        }),
      });

      if (!response.ok) {
        console.warn("Failed to save user state");
      } else {
        console.log("📊 User state saved successfully");
      }
    } catch (error) {
      console.error("Failed to save user state:", error);
    }
  },
};

// Skip regeneration system moved to game-mechanics.js

// Click throttling - DISABLED to test improved MongoDB performance
let lastClickTime = 0;
const CLICK_THROTTLE_MS = 0; // Was 200ms - testing if buffer can keep up now

// Universal interaction handler - routes all user actions
async function handleInteraction(action) {
  // Throttle all interactions to prevent server-side batching
  const now = Date.now();
  if (now - lastClickTime < CLICK_THROTTLE_MS) {
    console.log("⏳ Click throttled - please wait");
    return;
  }
  lastClickTime = now;

  console.log(`🎯 User interaction: ${action}`);

  // Get current image from the buffer system
  const currentImage = currentDisplayedImage;

  if (!currentImage) {
    console.error("❌ No current image available - this is a failure state");
    return;
  }

  // Random emoji deletions removed with emoji stream
  let randomOutcomes = {};

  // Route to specific action logic
  switch (action) {
    case "skip":
      // Record skip action BEFORE navigation changes currentDisplayedImage
      if (!currentImage.actionHistory) {
        currentImage.actionHistory = [];
      }
      const skipActionRecord = {
        action: "skip",
        timestamp: new Date().toISOString(),
      };
      currentImage.actionHistory.push(skipActionRecord);
      
      // Update UserState with skip score (which is 0 points)
      UserState.updateFromAction("skip", [], currentImage, null);
      
      // CRITICAL: Call GameMechanics skip functionality for budget system and navigation
      GameMechanics.handleSkipAction();
      return; // Skip the rest of the data recording flow
      
    case "like":
    case "dislike":
    case "download":
    case "share":
      // Action recorded - film strip navigation and UserState handle persistence

      // Update SessionState for persistent UI metrics (score, counts, emoji streams)
      if (["like", "dislike", "download", "share"].includes(action)) {
        // Extract emojis from current image for emoji streams
        // Note: "firstPlace" is an array of multiple emojis, not just one
        let emojis = [];
        if (
          currentImage.analysisData.emojiPredictions.firstPlace.length === 0
        ) {
          console.warn(
            `Image ${currentImage.cocoFile} has no first place emoji predictions - checking second place`
          );
          // Fallback to second place if first place is completely empty (data anomaly)
          if (
            currentImage.analysisData.emojiPredictions.secondPlace &&
            currentImage.analysisData.emojiPredictions.secondPlace.length > 0
          ) {
            emojis = currentImage.analysisData.emojiPredictions.secondPlace.map(
              (item) => item.emoji
            );
            console.warn(
              `Using second place emojis as fallback: ${emojis.join(", ")}`
            );
          }
        } else {
          emojis = currentImage.analysisData.emojiPredictions.firstPlace.map(
            (item) => item.emoji
          );
        }

        // Get previous action from current image's action history to handle edits
        if (!currentImage.actionHistory) {
          currentImage.actionHistory = [];
        }
        const previousAction =
          currentImage.actionHistory.length > 0
            ? currentImage.actionHistory[currentImage.actionHistory.length - 1]
            : null;

        // Record this action in the image's history with proper timestamp format
        const actionRecord = {
          action: action,
          timestamp: new Date().toISOString(),
        };
        currentImage.actionHistory.push(actionRecord);
        console.log(`📊 Complete currentImage object:`, currentImage);
        console.log(`📼 Complete backwardBuffer:`, backwardBuffer);

        // Update UserState with cumulative metrics
        UserState.updateFromAction(
          currentImage.cocoFile || "unknown",
          action,
          emojis,
          previousAction.action
        );

        // Save UserState (includes both metrics and preferences)
        UserState.save();
      }

      // Update UI from new machine state
      updateUIFromCurrentState();

      // Update skip counter UI if this was a skip action
      if (action === "skip") {
        GameMechanics.updateSkipCounter();
      }

      // Handle UI updates for engagement actions
      if (action === "like" || action === "dislike" || action === "skip") {
        // Navigate forward using buffer system
        await navigate("forward");
      } else if (action === "download") {
        await handleDownload();
        return; // Don't advance for downloads
      } else if (action === "share") {
        await handleShare();
        return; // Don't advance for shares
      }

      break;

    case "tape_forward":
      // Navigate forward using buffer system
      await navigate("forward");
      break;

    case "tape_back":
      // Navigate backward using buffer system
      await navigate("backward");
      break;

    case "history":
      // Simple navigation to history page
      window.location.href = "/v3/history.php";
      break;

    default:
      console.warn(`Unknown interaction: ${action}`);
  }
}

// Generate random emoji deletions and return exact outcome for deterministic replay
function generateRandomEmojiDeletions(imageEmojis, currentStream) {
  const deletionsToMake = [];

  // Random deletion logic: pick 0-2 emojis from current image to delete from stream
  const numDeletions = Math.floor(Math.random() * 3); // 0, 1, or 2 deletions

  if (numDeletions > 0 && currentStream.length > 0) {
    // Find emojis from current image that exist in the stream
    const availableForDeletion = [];
    imageEmojis.forEach((emoji) => {
      for (const group of currentStream) {
        if (group.emojis.includes(emoji)) {
          availableForDeletion.push(emoji);
          break; // Only count each emoji once
        }
      }
    });

    // Randomly select emojis to delete
    for (
      let i = 0;
      i < Math.min(numDeletions, availableForDeletion.length);
      i++
    ) {
      const randomIndex = Math.floor(
        Math.random() * availableForDeletion.length
      );
      const emojiToDelete = availableForDeletion.splice(randomIndex, 1)[0];
      deletionsToMake.push(emojiToDelete);
    }
  }

  console.log(`🎲 Random emoji deletions generated:`, deletionsToMake);
  return deletionsToMake;
}

// Score system functions

// Emoji stream functionality - sliding window of recent liked emojis
// Emoji stream removed - was causing state management conflicts
// const MAX_EMOJI_STREAM_LENGTH = 50; // COMMENTED OUT - testing unlimited emoji history
// Re-enable if DOM performance degrades with large emoji collections

// ===========================
// COMPREHENSIVE STATE MANAGEMENT
// ===========================

// === PRESENTATION STATE EXTRACTORS ===
// Extract only what was actually displayed to the user (not raw ML data)

function extractDisplayedCaption(analysis) {
  // Return the caption that was actually displayed (following app logic)
  if (analysis.captions) {
    // App logic: prefer BLIP, fallback to LLaMA
    return analysis.captions.blip || analysis.captions.llama || null;
  }
  return null;
}

function extractCaptionSource(analysis) {
  // Track which service provided the displayed caption
  if (analysis.captions) {
    if (analysis.captions.blip) return "blip";
    if (analysis.captions.llama) return "llama";
  }
  return null;
}

function extractDisplayedEmojis(analysis) {
  // Return the emoji predictions that were actually shown (first place, top 12)
  if (analysis.emojiPredictions.firstPlace) {
    return analysis.emojiPredictions.firstPlace
      .slice(0, 12) // Only show top 12 in UI
      .map((item) => ({
        emoji: item.emoji,
        votes: item.votes || 0,
      }));
  }
  return [];
}

function extractDisplayedBoundingBoxes(analysis) {
  const boxes = [];

  // Emoji consensus boxes (what renderBoundingBoxes shows)
  if (analysis.emojiPredictions.firstPlace) {
    analysis.emojiPredictions.firstPlace.forEach((item) => {
      if (item.mergedBbox) {
        boxes.push({
          type: "emoji",
          emoji: item.emoji,
          bbox: item.mergedBbox,
          votes: item.votes || 0,
        });
      }
    });
  }

  // Face detection boxes (what we just added)
  if (analysis.results?.face?.predictions) {
    analysis.results.face.predictions.forEach((pred) => {
      if (pred.type === "face_detection" && pred.bbox) {
        boxes.push({
          type: "face",
          emoji: pred.emoji || "🙂",
          bbox: pred.bbox,
          confidence: pred.confidence,
        });
      }
    });
  }

  return boxes;
}

// Create standardized action record for database
// Create unified image object for database storage
function createUnifiedStorageRecord(currentImage) {
  return {
    unifiedImageObject: currentImage, // Send the complete unified object with action history
    username: username,
    sessionId:
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("sessionId")
        : null,
  };
}

// Store unified image object to database
function storeImageToDatabase(action, currentImage, additionalContext = {}) {
  // The action tracking is already done via trackAction(), so currentImage already has updated actionHistory
  // We just need to store the complete unified object
  const record = createUnifiedStorageRecord(currentImage);
  sendToDatabase(record);

  console.log(`💾 Image stored: ${action} on ${currentImage.filename}`);
}

// Save UserPreferences to database

// Session restoration - reconstruct turing tape from stored interactions
async function restoreSessionFromDatabase() {
  if (!username) {
    console.log("👤 No username available, starting fresh session");
    return false;
  }

  try {
    console.log("🔍 Checking for previous session data...");

    // Load previous interactions
    const response = await fetch(
      `/v3/controller/retrieve?username=${encodeURIComponent(username)}`
    );
    const result = await response.json();

    if (
      !result.success ||
      !result.interactions ||
      result.interactions.length === 0
    ) {
      console.log("📄 No previous session found, starting fresh");
      return false;
    }

    console.log(
      `📥 Found ${result.interactions.length} previous interactions, reconstructing...`
    );

    // Parse the stored interactions and reconstruct tape
    const interactions = result.interactions;

    // Note: populateInteractionsCache removed as lookupTape() function doesn't exist

    let maxImageIndex = -1;

    // Sort by imageIndex to ensure proper reconstruction
    interactions.sort((a, b) => (a.image_index || 0) - (b.image_index || 0));

    // Reconstruct the tape from stored interactions
    for (const interaction of interactions) {
      try {
        // Data is already decoded by PHP, no need to parse JSON
        const imageIndex = interaction.image_index || 0;

        // Reconstruct the image object with all analysis data
        const restoredImage = {
          filename: interaction.imageFile,
          url: interaction.imageUrl,
          analysisData: interaction.analysisData,
          timestamp: interaction.timestamp,
          source: "session_restore",
        };

        // Add to backward buffer (most recent first)
        backwardBuffer.push(restoredImage);

        maxImageIndex = Math.max(maxImageIndex, interaction.image_index || 0);
      } catch (error) {
        console.warn(
          `⚠️ Skipping corrupted interaction at index ${interaction.image_index}:`,
          error
        );
      }
    }

    if (backwardBuffer.length > 0) {
      // Set the most recent image as current
      currentDisplayedImage = backwardBuffer.shift();

      console.log(
        `🎯 Restored session with image: ${currentDisplayedImage.filename}`
      );
      console.log("✅ Session restoration complete - seamless continuation");
      return true;
    }

    console.log(
      "⚠️ Session data found but reconstruction failed, starting fresh"
    );
    return false;
  } catch (error) {
    console.error("❌ Error during session restoration:", error);
    return false;
  }
}

// User Journey State Management
let userJourney = {
  timeline: [],
  currentPosition: -1,
  isAtPresent: true,
};

function saveJourneyPoint(image, action) {
  const journeyPoint = {
    timestamp: Date.now(),
    image: {
      url: image.url,
      cocoFile: image.cocoFile,
      // Store only presentation essentials, not full analysis
      presentationState: image.analysisData
        ? {
            captionShown: extractDisplayedCaption(image.analysisData),
            captionSource: extractCaptionSource(image.analysisData),
            emojiPredictionsShown: extractDisplayedEmojis(
              image.analysisData
            ).slice(0, 6), // Just top 6
            boundingBoxesCount: extractDisplayedBoundingBoxes(
              image.analysisData
            ).length,
            displayDimensions: image.analysisData.imageData?.imageDimensions,
          }
        : null,
    },
    userAction: action,
    // Don't store full application state in timeline - just the decision
    interactionContext:
      typeof dataCollector !== "undefined"
        ? {
            timeOnImage:
              dataCollector.getTimingSnapshot()?.timeOnCurrentImage || 0,
          }
        : null,
  };

  // If we're in the middle of history, truncate future timeline
  if (userJourney.currentPosition < userJourney.timeline.length - 1) {
    userJourney.timeline = userJourney.timeline.slice(
      0,
      userJourney.currentPosition + 1
    );
  }

  // Add new journey point
  userJourney.timeline.push(journeyPoint);
  userJourney.currentPosition = userJourney.timeline.length - 1;
  userJourney.isAtPresent = true;

  console.log(
    `💾 Journey point saved: ${action} on ${
      image.url?.substring(0, 30) || image.cocoFile || "unknown"
    }... (Position: ${userJourney.currentPosition})`
  );

  // Update navigation button states after journey change
  updateNavigationButtons();
}

// Emoji stream removed - was causing state management conflicts

async function flashEmojiForDeletion(visibleEmojiIndex) {
  const streamEl = document.getElementById("emoji-stream");
  if (!streamEl) return;

  // Calculate currently visible emojis
  const maxEmojis = calculateMaxEmojisForContainer();
  const visibleEmojis = allEmojis.slice(-maxEmojis);

  // Render only visible emojis with the target emoji highlighted
  const streamHtml = visibleEmojis
    .map((emoji, index) => {
      // Highlight the emoji that's about to be deleted
      if (index === visibleEmojiIndex) {
        return `<span class="emoji emoji-flash">${emoji}</span>`;
      }
      return `<span class="emoji">${emoji}</span>`;
    })
    .join("");

  streamEl.innerHTML = streamHtml;

  // Wait for the flash animation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 800); // Flash for 800ms
  });
}

// Session timeout detection - periodically check if PHP session is still valid
function startSessionMonitor() {
  // Check session every 1 minute (60000ms)
  setInterval(async () => {
    try {
      // Make a lightweight request to check session status
      const response = await fetch("/v3/controller/session_check", {
        method: "GET",
        credentials: "same-origin", // Include session cookie
      });

      // Get response data
      const responseText = await response.text();

      if (
        response.status === 401 ||
        response.status === 403 ||
        response.redirected
      ) {
        console.log("🔐 Session expired, redirecting to login...");
        window.location.href = "/login/";
      }
    } catch (error) {
      console.warn("Session check failed:", error);
      // Don't redirect on network errors, only on auth failures
    }
  }, 60000); // 1 minute
}

// Check session status when user performs actions that might require authentication
function checkSessionOnInteraction() {
  async function checkSession() {
    try {
      const response = await fetch("/v3/controller/session_check", {
        method: "GET",
        credentials: "same-origin",
      });

      if (
        response.status === 401 ||
        response.status === 403 ||
        response.redirected
      ) {
        console.log(
          "🔐 Session expired during interaction, redirecting to login..."
        );
        window.location.href = "/login/";
      }
    } catch (error) {
      console.warn("Interaction session check failed:", error);
    }
  }

  // Check session only on actions that might fail without valid session
  document.addEventListener("click", function (event) {
    // Only check session for actions that interact with backend services
    if (
      event.target.id === "like-btn" ||
      event.target.id === "dislike-btn" ||
      event.target.id === "skip-btn" ||
      event.target.id === "download-btn"
    ) {
      checkSession();
    }
  });
}

// Data collection system for ML recommendation engine
// Captures comprehensive behavioral data to train user preference models
class DataCollector {
  constructor() {
    this.staticData = {}; // Device/browser specs (unchanging during session)
    this.dynamicData = {}; // Real-time state (network, visibility, etc.)
    this.timingData = {}; // Engagement metrics (view duration, etc.)
    this.interactionData = { scrollEvents: [] }; // User behavior patterns (mouse data removed for performance)

    this.startTime = null;
    this.isCollecting = false;
    this.eventListeners = [];
  }

  start() {
    this.startTime = Date.now();
    this.isCollecting = true;
    this.collectStaticData();
    this.startDynamicCollection();
  }

  collectStaticData() {
    this.staticData = {
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
    };

    // Modern APIs with fallbacks
    if ("deviceMemory" in navigator) {
      this.staticData.deviceMemory = navigator.deviceMemory;
    }
    if ("hardwareConcurrency" in navigator) {
      this.staticData.cpuCores = navigator.hardwareConcurrency;
    }
  }

  startDynamicCollection() {
    // Mouse movement tracking
    // Mouse tracking removed for performance - only scroll events are tracked

    // Page visibility tracking
    const visibilityHandler = () => {
      if (this.isCollecting) {
        this.dynamicData.pageVisible = !document.hidden;
        this.dynamicData.lastVisibilityChange = Date.now() - this.startTime;
      }
    };

    // Scroll tracking
    const scrollHandler = (e) => {
      if (this.isCollecting) {
        this.interactionData.scrollEvents.push({
          x: window.scrollX,
          y: window.scrollY,
          timestamp: Date.now() - this.startTime,
        });
      }
    };

    // Add event listeners (mouse events removed for performance)
    document.addEventListener("visibilitychange", visibilityHandler);
    window.addEventListener("scroll", scrollHandler);

    // Store references for cleanup
    this.eventListeners = [
      {
        element: document,
        event: "visibilitychange",
        handler: visibilityHandler,
      },
      { element: window, event: "scroll", handler: scrollHandler },
    ];

    // Collect initial dynamic data
    this.updateDynamicData();
  }

  updateDynamicData() {
    this.dynamicData.timestamp = Date.now();
    this.dynamicData.pageVisible = !document.hidden;

    // Battery API (if available)
    if ("getBattery" in navigator) {
      navigator.getBattery().then((battery) => {
        this.dynamicData.batteryLevel = battery.level;
        this.dynamicData.batteryCharging = battery.charging;
      });
    }

    // Connection API (if available)
    if ("connection" in navigator) {
      this.dynamicData.connectionType = navigator.connection.effectiveType;
      this.dynamicData.connectionDownlink = navigator.connection.downlink;
    }
  }

  getTimingSnapshot() {
    const now = Date.now();
    return {
      totalViewTime: now - this.startTime,
      startTime: this.startTime,
      snapshotTime: now,
    };
  }

  snapshot() {
    this.updateDynamicData();
    return {
      static: this.staticData,
      dynamic: this.dynamicData,
      timing: this.getTimingSnapshot(),
      interaction: {
        scrollEventCount: this.interactionData.scrollEvents.length,
        scrollEvents: this.interactionData.scrollEvents.slice(
          -MAX_SCROLL_EVENTS
        ),
      },
    };
  }

  reset() {
    // Clean up event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];

    // Reset data
    this.dynamicData = {};
    this.timingData = {};
    this.interactionData = { scrollEvents: [] };
    this.isCollecting = false;
    this.startTime = null;
  }
}

let dataCollector = new DataCollector();

// ===========================
// DATABASE & QUEUE MANAGEMENT
// ===========================
// Database integration with background retry
// Uses fire-and-forget pattern to avoid blocking UI during user interactions
let databaseQueue = [];
let isProcessingQueue = false;

async function sendToDatabase(record) {
  // Queue records for background processing - UI never waits for database
  // Critical for smooth Tinder-style interactions where speed matters
  databaseQueue.push({
    record: record,
    attempts: 0,
    timestamp: Date.now(),
  });

  // Start processing if not already running
  if (!isProcessingQueue) {
    processQueueInBackground();
  }
}

async function processQueueInBackground() {
  isProcessingQueue = true;

  // Process only items currently in queue to avoid infinite loop
  const initialQueueLength = databaseQueue.length;
  let processed = 0;

  while (databaseQueue.length > 0 && processed < initialQueueLength) {
    const item = databaseQueue.shift();
    processed++;

    try {
      const response = await fetch(`${DATABASE_URL}/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.record),
      });

      if (!response.ok) {
        throw new Error(`Database store failed: ${response.status}`);
      }

      const result = await response.json();
      const filename =
        item.record.unifiedImageObject?.filename ||
        item.record.imageFile ||
        "unknown";
      console.log("✅ Database save successful:", filename);
    } catch (error) {
      item.attempts++;
      console.warn(
        `❌ Database save failed (attempt ${item.attempts}):`,
        error.message
      );

      // Retry with exponential backoff
      if (item.attempts < 3) {
        // Retrying database save
        setTimeout(() => {
          // Add back to queue and restart processing if needed
          databaseQueue.push(item); // Add to end to avoid priority issues
          if (!isProcessingQueue) {
            processQueueInBackground();
          }
        }, item.attempts * 2 * 1000);
      } else {
        console.error(
          `💥 Giving up on database save after 3 attempts:`,
          item.record.imageFile
        );
      }
    }
  }

  isProcessingQueue = false;

  // If new items were added during processing, restart
  if (databaseQueue.length > 0) {
    setTimeout(() => processQueueInBackground(), 100);
  }
}

// Preloading state management (Turing tape!)
// Implements infinite scroll with predictive loading to maintain instant UX
// downloadedImages array removed - images now write directly to tape on load

// Debug interface variables
// currentImageId moved to TransientState.currentImageId
// boundingBoxesEnabled moved to UserPreferences.boundingBoxes.enabled
// firstImageLoaded moved to TransientState.firstImageLoaded

// Configuration - PHP services (no Node.js required)
// URLs now come from config.js
const API_URL = CONFIG.API_URL;
const DATABASE_URL = CONFIG.DATABASE_URL;
const BUFFER_SIZE = 5; // Navigation history buffer (for back/forward)
const PRELOAD_COUNT = 10; // Ready images ahead of current position

// Data Collection Constants
const MAX_SCROLL_EVENTS = 10; // Scroll events to track

// ===========================
// EVENT LISTENERS & UI SETUP
// ===========================

// Flash click zone for visual feedback on like/dislike actions
function flashClickZone(action) {
  const zoneId = action === "like" ? "like-zone" : "dislike-zone";
  const zone = document.getElementById(zoneId);
  
  if (zone) {
    zone.classList.add("active");
    setTimeout(() => {
      zone.classList.remove("active");
    }, 200); // Brief 200ms flash
  }
}

// Setup click zone hover effects and click handlers
function setupClickZoneEffects() {
  const likeZone = document.getElementById("like-zone");
  const dislikeZone = document.getElementById("dislike-zone");
  
  // Add hover effects via JavaScript
  [likeZone, dislikeZone].forEach(zone => {
    if (zone) {
      zone.addEventListener("mouseenter", () => zone.classList.add("active"));
      zone.addEventListener("mouseleave", () => zone.classList.remove("active"));
    }
  });
}

function setupEventListeners() {
  // History button - redirect to history page
  document.getElementById("history-btn").addEventListener("click", function () {
    handleInteraction("history");
  });

  // Temporary tape navigation buttons for testing
  document
    .getElementById("tape-back-btn")
    .addEventListener("click", function () {
      handleInteraction("tape_back");
    });

  document
    .getElementById("tape-forward-btn")
    .addEventListener("click", function () {
      handleInteraction("tape_forward");
    });

  // Skip button with budget system
  document.getElementById("skip-btn").addEventListener("click", function () {
    handleInteraction("skip");
  });

  // Back button with budget system
  document.getElementById("back-btn").addEventListener("click", function () {
    GameMechanics.handleBackAction();
  });

  // Like button - core preference action
  document.getElementById("like-btn").addEventListener("click", function () {
    flashClickZone("like");
    setTimeout(() => handleInteraction("like"), 200);
  });

  // Dislike button - core preference action  
  document.getElementById("dislike-btn").addEventListener("click", function () {
    flashClickZone("dislike");
    setTimeout(() => handleInteraction("dislike"), 200);
  });

  // Setup click zone hover effects and existing click handlers
  setupClickZoneEffects();

  // Download button
  document
    .getElementById("download-btn")
    .addEventListener("click", function () {
      handleInteraction("download");
    });

  // Share button
  document.getElementById("share-btn").addEventListener("click", function () {
    handleInteraction("share");
  });

  // Click zones on image
  document.getElementById("like-zone").addEventListener("click", function () {
    handleInteraction("like");
  });

  document
    .getElementById("dislike-zone")
    .addEventListener("click", function () {
      handleInteraction("dislike");
    });

  // Bounding boxes toggle
  document
    .getElementById("toggle-bounding-boxes")
    .addEventListener("click", function () {
      toggleBoundingBoxes();
    });

  // Initialize button text based on URL state
  const bboxButton = document.getElementById("toggle-bounding-boxes");
  if (bboxButton) {
    bboxButton.textContent = isBoundingBoxesEnabled()
      ? "Hide Bounding Boxes"
      : "Show Bounding Boxes";
  }
}

// ===========================
// BUFFER & PRELOAD SYSTEM
// ===========================
// Background image preloading system
// Maintains buffer of analyzed images ahead of user's current position
// Critical for instant Tinder-style navigation - no waiting between swipes
// === PURE UTILITY FUNCTIONS ===

// Preload image in browser cache
function preloadImageInCache(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });
}

// 🎉 BEAUTIFUL NEW SIMPLE LOADING 🎉
// Get random image with guaranteed analysis data from single API call
async function loadRandomImageWithData() {
  try {
    // Single request gets both metadata AND analysis - guaranteed to work!
    const response = await fetch(`${CONFIG.API_URL}/image?random=true`);
    if (!response.ok) {
      throw new Error(`Random API error: ${response.status}`);
    }

    const data = await response.json();

    // Calculate imageUrl from filename (jpg -> webp conversion)
    const imageUrl = CONFIG.getImageUrl(data.filename);

    // Wait for browser to cache the image (only async work needed!)
    await preloadImageInCache(imageUrl);

    // Return unified image object (this WILL break existing code until we remap everything)
    return {
      ...data, // Spread the entire unified object
      url: imageUrl, // Add calculated URL for backward compatibility during transition
      thumbnail: imageUrl,
      cocoFile: data.filename, // Keep this for backward compatibility during transition
    };
  } catch (error) {
    console.warn("Failed to load random image:", error.message);
    return null;
  }
}

// Load a specific image by filename with analysis data
async function loadImageWithData(filename) {
  try {
    // Request specific image with analysis data
    const response = await fetch(
      `${CONFIG.API_URL}/image?filename=${encodeURIComponent(filename)}`
    );
    if (!response.ok) {
      throw new Error(`Specific image API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("🔍 Specific unified image API response:", data);

    // Calculate imageUrl from filename (jpg -> webp conversion)
    const imageUrl = CONFIG.getImageUrl(data.filename);

    // Wait for browser to cache the image
    await preloadImageInCache(imageUrl);

    // Return unified image object (this WILL break existing code until we remap everything)
    return {
      ...data, // Spread the entire unified object
      url: imageUrl, // Add calculated URL for backward compatibility during transition
      thumbnail: imageUrl,
      cocoFile: data.filename, // Keep this for backward compatibility during transition
    };
  } catch (error) {
    console.warn("Failed to load specific image:", error.message);
    return null;
  }
}

// 📼 HISTORICAL PRELOAD FUNCTION 📼
async function preloadUserHistory() {
  if (!username) {
    console.log("👤 No username available, skipping historical preload");
    return;
  }

  try {
    console.log("🔍 Loading user history for backward navigation...");

    // Fetch user's previous interactions
    const response = await fetch(
      `/v3/controller/retrieve?username=${encodeURIComponent(username)}`
    );
    const result = await response.json();

    if (
      !result.success ||
      !result.interactions ||
      result.interactions.length === 0
    ) {
      console.log("📄 No previous history found, starting fresh");
      return;
    }

    console.log(
      `📥 Found ${result.interactions.length} historical interactions, loading into negative tape positions...`
    );

    // Historical interactions will be loaded into turing tape below

    // Sort by imageIndex descending to load most recent history first
    const interactions = result.interactions.sort(
      (a, b) => (b.image_index || 0) - (a.image_index || 0)
    );

    // Load up to 10 most recent interactions into negative positions
    const historyCount = Math.min(interactions.length, 10);

    for (let i = 0; i < historyCount; i++) {
      const interaction = interactions[i];

      try {
        // Parse the stored analysis data to reconstruct complete frame
        const completeData =
          typeof interaction.analysisData === "string"
            ? JSON.parse(interaction.analysisData)
            : interaction.analysisData;

        // Reconstruct the film frame exactly as it was stored
        const restoredFrame = {
          image: {
            cocoFile: interaction.imageFile,
            analysis: completeData.analysisData || completeData, // Handle both structures
          },
          action: interaction.userAction,
          timestamp: new Date(interaction.timestamp).getTime(),
          writeHistory: [
            {
              timestamp: new Date(interaction.timestamp).getTime(),
              action: interaction.userAction,
              previousAction: null, // Historical data doesn't track previous actions
              context: { type: "historical_restore" },
            },
          ],
        };

        // Place in negative tape position (most recent history at -1, older at -2, etc.)
        const negativePosition = -(i + 1);
        turingTape.tape[negativePosition] = restoredFrame;

        console.log(
          `📼 Historical frame loaded: ${restoredFrame.image.cocoFile} → Position ${negativePosition} (${restoredFrame.action})`
        );
      } catch (error) {
        console.warn(
          `⚠️ Failed to restore historical frame for interaction ${interaction.image_index}:`,
          error
        );
      }
    }

    console.log(
      `✅ Historical preload complete: ${historyCount} frames loaded into negative positions`
    );
  } catch (error) {
    console.warn("⚠️ Historical preload failed:", error);
  }
}

// 🚀 GLORIOUSLY SIMPLE PRELOAD FUNCTION 🚀
async function preloadSingleImage() {
  try {
    const imageData = await loadRandomImageWithData();

    if (imageData) {
      // Image feeds itself to tape immediately on load
      // Find next empty position starting from 0 for new session
      let nextPosition = 0;
      while (turingTape.tape[nextPosition] !== undefined) {
        nextPosition++;
      }
      turingTape.tape[nextPosition] = {
        image: imageData,
        action: "view",
        timestamp: Date.now(),
        writeHistory: [],
      };
      console.log(
        `📥 Downloaded: ${imageData.cocoFile} → Tape position ${nextPosition}`
      );
      return imageData;
    }
  } catch (error) {
    console.warn("Preload failed:", error.message);
  }

  return null;
}

async function maintainPreloadBuffer() {
  // Simple rule: count how many positions ahead of head have data
  let positionsAhead = 0;
  for (let i = 1; i <= PRELOAD_COUNT; i++) {
    if (turingTape.tape[turingTape.head + i]) {
      positionsAhead++;
    } else {
      break; // Stop counting at first gap
    }
  }
  if (positionsAhead < PRELOAD_COUNT) {
    const startTime = performance.now();
    console.log(
      `🔄 Buffer maintenance: loading 1 image (positions ahead: ${positionsAhead}/${PRELOAD_COUNT}) [start: ${Math.round(
        startTime
      )}ms]`
    );

    // Start loading exactly ONE image in background - don't await
    preloadSingleImage()
      .then((result) => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        if (result) {
          console.log(
            `✅ Background load completed: ${
              result.cocoFile
            } [duration: ${duration}ms, end: ${Math.round(endTime)}ms]`
          );
        } else {
          console.warn(
            `❌ Background load failed: returned null [duration: ${duration}ms, end: ${Math.round(
              endTime
            )}ms]`
          );
        }
      })
      .catch((err) => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        console.warn(
          `❌ Background preload failed after ${duration}ms:`,
          err.message
        );
      });
  } else {
    console.log(
      `✅ Buffer complete: ${positionsAhead}/${PRELOAD_COUNT} positions ahead - no loading needed`
    );
  }
}

// getNextPreloadedImage() removed - images now write directly to tape on load

// === INITIALIZATION FUNCTIONS ===

function initializeWithFirstImage(imageData) {
  // Initialize Turing Tape with first image (check if tape is empty)
  if (Object.keys(turingTape.tape).length === 0) {
    turingTape.write("view", imageData, {
      type: "init",
      timing: { startTime: Date.now() },
    });
    console.log(
      `📼 Turing Tape initialized with first image: ${imageData.cocoFile}`
    );

    // Update UI from initial state
    updateUIFromCurrentState();
    return true;
  }
  return false;
}

// ===========================
// USER ACTIONS & NAVIGATION
// ===========================

// Update UI elements from current Turing Tape state
function updateUIFromCurrentState() {
  const displayData = UserState.getDisplayData();

  // Update score display
  const scoreEl = document.getElementById("user-score");
  if (scoreEl) {
    scoreEl.textContent = displayData.score.toLocaleString();
  }

  // Update interaction stats (like/dislike counts)
  const statsEl = document.getElementById("interaction-stats");
  if (statsEl) {
    statsEl.textContent = `👍${displayData.likeCount} 👎${displayData.dislikeCount}`;
  }

  // Update emoji stream from liked emojis
  GameMechanics.updateEmojiStreamDisplay();

  console.log(`✅ UI updated from UserState`);
}

function canNavigateForward() {
  // Film strip model: can always navigate forward (infinite scrolling)
  return true;
}

function canNavigateBackward() {
  // Buffer model: can navigate backward if we have images in backward buffer
  return backwardBuffer.length > 0;
}

// handleSkipAction and updateSkipCounter moved to game-mechanics.js

// === SHARING & DOWNLOAD UTILITY FUNCTIONS ===

// Generate shareable URL with current state parameters
function generateShareableURL(currentImage) {
  const params = new URLSearchParams();
  params.set("image", currentImage.filename);
  params.set("shared", "true");

  if (isBoundingBoxesEnabled()) {
    params.set("bbox", "true");
  }

  return `${window.location.origin}${
    window.location.pathname
  }?${params.toString()}`;
}

// Copy URL to clipboard - simple success/failure
async function copyToClipboard(url) {
  try {
    await navigator.clipboard.writeText(url);
    showShareFeedback("✓ Copied to clipboard!");
  } catch (error) {
    console.error("Clipboard copy failed:", error);
    console.log("URL to copy manually:", url);
    showShareFeedback("⚠ Copy failed");
    // TODO: Implement better fallback messaging (e.g., modal, persistent notification)
  }
}

// Download image with CORS handling
async function downloadImage(currentImage) {
  try {
    const response = await fetch(currentImage.url);
    const blob = await response.blob();

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = currentImage.cocoFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed:", error);
    window.open(currentImage.url, "_blank");
  }
}

// Simplified handlers - no logging (handled by handleInteraction)
async function handleDownload() {
  const currentImage = currentDisplayedImage;
  if (!currentImage) return;

  await downloadImage(currentImage);
}

async function handleShare() {
  const currentImage = currentDisplayedImage;
  if (!currentImage) return;

  const shareUrl = generateShareableURL(currentImage);
  await copyToClipboard(shareUrl);
}

// ===========================
// UI FEEDBACK & UTILITIES
// ===========================

function showShareFeedback(message = "✓ Copied!") {
  const shareBtn = document.getElementById("share-btn");
  const originalText = shareBtn.textContent;
  const originalBackground = shareBtn.style.background;

  shareBtn.textContent = message;
  shareBtn.style.background = message.includes("✓")
    ? "rgba(46, 213, 115, 0.2)"
    : "rgba(255, 71, 87, 0.2)";
  shareBtn.style.borderColor = message.includes("✓")
    ? "rgba(46, 213, 115, 0.5)"
    : "rgba(255, 71, 87, 0.5)";

  setTimeout(() => {
    shareBtn.textContent = originalText;
    shareBtn.style.background = originalBackground;
    shareBtn.style.borderColor = "";
  }, 2500);
}

function updateURL(imageFile) {
  // Update browser URL without page reload, preserving bounding box state
  const params = new URLSearchParams();
  params.set("image", imageFile);
  if (isBoundingBoxesEnabled()) {
    params.set("bbox", "true");
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  // Update URL without creating history entry
  window.history.replaceState(
    { image: imageFile, bbox: isBoundingBoxesEnabled() },
    "",
    newUrl
  );
  // Browser URL updated in place
}

function clearSharedFlag() {
  // Remove the shared flag from URL to prevent re-triggering shared logic
  const params = new URLSearchParams(window.location.search);
  if (params.has("shared")) {
    params.delete("shared");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }
}

function getSharedImageFromURL() {
  // Check if URL contains a shared image parameter
  const urlParams = new URLSearchParams(window.location.search);
  const image = urlParams.get("image");
  const bbox = urlParams.get("bbox") === "true";
  const shared = urlParams.get("shared") === "true";

  return { image, bbox, shared };
}

// ===========================
// IMAGE DISPLAY & RENDERING
// ===========================

function displayImage(imageUrl, analysisData = null) {
  const mainImage = document.getElementById("main-image");

  // Only set src if it's different to avoid reloading cached images
  if (mainImage.src !== imageUrl) {
    mainImage.src = imageUrl;
  }

  // If we have analysis data, calculate and set image dimensions immediately
  if (analysisData && analysisData.imageData?.imageDimensions) {
    const originalDimensions = analysisData.imageData.imageDimensions;

    // Check for error state (negative dimensions indicate missing data from backend)
    if (originalDimensions.width < 0 || originalDimensions.height < 0) {
      logger(
        "error",
        "Image dimensions missing from analysis data",
        originalDimensions
      );
    }

    // Use the exact dimensions from analysis data
    mainImage.style.width = originalDimensions.width + "px";
    mainImage.style.height = originalDimensions.height + "px";
  }

  // Update navigation button states
  updateNavigationButtons();

  // Get current image from buffer system for logging and action tracking
  const currentImage = currentDisplayedImage;
  if (currentImage) {
    console.log(
      `🖼️ Displayed image: ${currentImage.filename || currentImage.cocoFile}`
    );

    // Track "view" action - this is the foundation of all user interaction tracking
    if (!currentImage.actionHistory) {
      currentImage.actionHistory = [];
    }

    // Add view action record
    const viewAction = {
      action: "view",
      timestamp: new Date().toISOString(),
      metadata: {
        lingerTime: 0, // Will be updated when user navigates away
        navigationSource: currentImage.source || "unknown", // Use the image's source field
      },
    };
    currentImage.actionHistory.push(viewAction);

    console.log(
      `👁️ View action tracked for ${
        currentImage.filename || currentImage.cocoFile
      }`
    );
  }
}

function displaySimplifiedResults(data) {
  logger('debug', 'displaySimplifiedResults called with analysis data');
  logger('debug', `Color data structure: ${JSON.stringify(data.colors, null, 2)}`);
  
  // Display first place emojis
  displayPrimaryEmojis(data.emojiPredictions);

  // Display second place emojis
  displaySecondaryEmojis(data.emojiPredictions);

  // Display compact color palette (prefer Copic over Prismacolor)
  displayCompactColorPalette(data.colors);

  // Display best caption
  displayBestCaption(data.captions);
}

function displayPrimaryEmojis(predictions) {
  const primaryDiv = document.getElementById("guess-final");

  // Clear existing content
  while (primaryDiv.firstChild) {
    primaryDiv.removeChild(primaryDiv.firstChild);
  }

  if (
    predictions &&
    predictions.firstPlace &&
    predictions.firstPlace.length > 0
  ) {
    predictions.firstPlace.forEach((item) => {
      const emojiDiv = document.createElement("div");
      emojiDiv.className = "emoji-large multiple";
      emojiDiv.textContent = item.emoji;
      primaryDiv.appendChild(emojiDiv);
    });
  } else if (predictions.final) {
    const emojiDiv = document.createElement("div");
    emojiDiv.className = "emoji-large";
    emojiDiv.textContent = predictions.final;
    primaryDiv.appendChild(emojiDiv);
  }
}

function displaySecondaryEmojis(predictions) {
  const secondaryDiv = document.getElementById("guess-second");

  // Clear existing content
  while (secondaryDiv.firstChild) {
    secondaryDiv.removeChild(secondaryDiv.firstChild);
  }

  if (predictions.secondPlace && predictions.secondPlace.length > 0) {
    predictions.secondPlace.forEach((item) => {
      const emojiDiv = document.createElement("div");
      emojiDiv.className = "emoji-medium multiple";
      emojiDiv.textContent = item.emoji;
      secondaryDiv.appendChild(emojiDiv);
    });
  } else if (predictions.second) {
    const emojiDiv = document.createElement("div");
    emojiDiv.className = "emoji-medium";
    emojiDiv.textContent = predictions.second;
    secondaryDiv.appendChild(emojiDiv);
  }
}

function displayCompactColorPalette(colorsData) {
  const colorDiv = document.getElementById("color-palette-compact");

  logger('debug', `displayCompactColorPalette called with: ${JSON.stringify(colorsData, null, 2)}`);

  // Clear existing content
  while (colorDiv.firstChild) {
    colorDiv.removeChild(colorDiv.firstChild);
  }

  // Handle case where no color data exists
  if (!colorsData) {
    logger('debug', 'No color data provided to displayCompactColorPalette');
    return;
  }

  // Display primary color if available
  if (colorsData.primary && colorsData.primary.hex) {
    const dominantHex = colorsData.primary.hex;
    const dominantLabel = colorsData.primary.label || "Primary";
    const swatchDiv = document.createElement("div");
    swatchDiv.className = "color-swatch-compact dominant";
    swatchDiv.style.backgroundColor = dominantHex;
    swatchDiv.title = `${dominantLabel} (${dominantHex.toUpperCase()})`;
    colorDiv.appendChild(swatchDiv);
    logger('debug', `Added primary color: ${dominantHex} (${dominantLabel})`);
  }

  // Display palette colors if available
  if (colorsData.palette && colorsData.palette.colors && Array.isArray(colorsData.palette.colors)) {
    colorsData.palette.colors.forEach((color) => {
      const colorHex = color.hex || "#000000";
      const colorName = color.color || "Unknown";
      const swatchDiv = document.createElement("div");
      swatchDiv.className = "color-swatch-compact";
      swatchDiv.style.backgroundColor = colorHex;
      swatchDiv.title = `${colorName} (${colorHex.toUpperCase()})`;
      colorDiv.appendChild(swatchDiv);
      logger('debug', `Added palette color: ${colorHex} (${colorName})`);
    });
  }

  // Show message if no colors were displayed
  if (colorDiv.children.length === 0) {
    logger('debug', 'No colors displayed - empty color palette');
  } else {
    logger('ui', `Color palette displayed with ${colorDiv.children.length} swatches`);
  }
}

function displayBestCaption(captions) {
  const captionDiv = document.getElementById("caption-best");

  // Clear existing content
  while (captionDiv.firstChild) {
    captionDiv.removeChild(captionDiv.firstChild);
  }

  if (!captions || (!captions.blip && !captions.llama)) {
    return;
  }

  let bestScore = -Infinity;

  // Captions now come with scores already built in from API
  let blipScore = captions.blip?.percentage ?? -1;
  let llamaScore = captions.llama?.percentage ?? -1;

  // Find the caption with the highest score, or shortest if tied
  let bestCaptionObj = null;

  if (captions.blip && blipScore >= 0) {
    if (blipScore > bestScore) {
      bestCaptionObj = captions.blip;
      bestScore = blipScore;
    } else if (
      blipScore === bestScore &&
      captions.blip.text.length < bestCaptionObj?.text?.length
    ) {
      bestCaptionObj = captions.blip;
    }
  }

  if (captions.llama && llamaScore >= 0) {
    if (llamaScore > bestScore) {
      bestCaptionObj = captions.llama;
      bestScore = llamaScore;
    } else if (
      llamaScore === bestScore &&
      captions.llama.text.length < bestCaptionObj?.text?.length
    ) {
      bestCaptionObj = captions.llama;
    }
  }

  // Fallback to first available caption if no scores
  if (!bestCaptionObj) {
    if (captions.blip) {
      bestCaptionObj = captions.blip;
    } else if (captions.llama) {
      bestCaptionObj = captions.llama;
    }
  }

  // Use only the formatted caption for display
  if (bestCaptionObj && bestCaptionObj.formatted) {
    const textDiv = document.createElement("div");
    textDiv.className = "text-large";
    textDiv.innerHTML = bestCaptionObj.formatted;
    captionDiv.appendChild(textDiv);
  }
}

function updateNavigationButtons() {
  const backBtn = document.getElementById("back-btn");

  // History button is always enabled - just goes to history page
  if (backBtn) {
    backBtn.disabled = false;
    backBtn.classList.add("btn-enabled");
    backBtn.classList.remove("btn-disabled");
  }
}

function updateProgress(percent, text) {
  document.getElementById("progress-fill").style.width = percent + "%";
  document.getElementById("progress-text").textContent = text;
}

function hideLoadingScreen() {
  document.getElementById("loading").classList.add("loaded");
}

function showError(message) {
  // Replace alert with a nice error display
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);

  // Click to dismiss
  errorDiv.addEventListener("click", () => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  });
}

// Display image without analysis-dependent features (graceful degradation)
function displayImageWithoutAnalysis(image) {
  // Display basic image without analysis data
  displayImage(image.url, null);

  // Clear any existing analysis-dependent UI elements
  clearAllBoundingBoxes();

  // Show minimal image info
  const filename = image.filename || "Unknown image";
  document.title = `Animal Farm - ${filename}`;

  // Display fallback content instead of analysis results
  const resultContainer = document.getElementById("result-container");
  if (resultContainer) {
    resultContainer.innerHTML = `
            <div class="degraded-mode-notice">
                <h3>🖼️ Image Display Mode</h3>
                <p><strong>Filename:</strong> ${filename}</p>
                <p><em>ML analysis features are unavailable for this image.</em></p>
                <p>You can still navigate to other images using the controls below.</p>
            </div>
        `;
  }

  // Update navigation button states
  updateNavigationButtons();

  console.log(`📷 Displayed image without analysis: ${filename}`);
}

// Bounding box scaling and rendering functions
function scaleBoundingBox(bbox, processingDimensions, displayDimensions) {
  const scaleX = displayDimensions.width / processingDimensions.width;
  const scaleY = displayDimensions.height / processingDimensions.height;

  return {
    x: Math.round(bbox.x * scaleX),
    y: Math.round(bbox.y * scaleY),
    width: Math.round(bbox.width * scaleX),
    height: Math.round(bbox.height * scaleY),
  };
}

function createMinimumBoundingBox(boxes) {
  if (boxes.length === 0) return null;
  if (boxes.length === 1) return boxes[0];

  const x1 = Math.min(...boxes.map((b) => b.x));
  const y1 = Math.min(...boxes.map((b) => b.y));
  const x2 = Math.max(...boxes.map((b) => b.x + b.width));
  const y2 = Math.max(...boxes.map((b) => b.y + b.height));

  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
  };
}

// === BOUNDING BOX RENDERING UTILITY FUNCTIONS ===

// Get or create the bounding box overlay container
function getBoundingBoxOverlay() {
  let bboxOverlay = document.getElementById("bbox-overlay");

  if (!bboxOverlay) {
    const imageContainer = document.querySelector(".image-container");
    if (!imageContainer) {
      console.error("Image container not found");
      return null;
    }

    bboxOverlay = document.createElement("div");
    bboxOverlay.id = "bbox-overlay";
    bboxOverlay.className = "bbox-overlay";
    imageContainer.style.position = "relative";
    imageContainer.appendChild(bboxOverlay);
  }

  // Set display state based on persistent preference
  bboxOverlay.style.display = isBoundingBoxesEnabled() ? "block" : "none";

  return bboxOverlay;
}

// Create single bounding box element with label
function createBoundingBoxElement(pred) {
  const bbox = pred.scaledBbox;

  if (!bbox || bbox.width <= 0 || bbox.height <= 0) {
    console.warn(`Invalid bbox for prediction:`, bbox);
    return null;
  }

  // Create main box element
  const bboxDiv = document.createElement("div");
  const cssClass =
    pred.type === "face" ? "bbox bbox-face" : "bbox bbox-winning";

  bboxDiv.className = cssClass;
  bboxDiv.style.left = `${bbox.x}px`;
  bboxDiv.style.top = `${bbox.y}px`;
  bboxDiv.style.width = `${bbox.width}px`;
  bboxDiv.style.height = `${bbox.height}px`;

  // Create label with emoji and votes
  const labelDiv = document.createElement("div");
  labelDiv.className = "bbox-label";

  const emojiSpan = document.createElement("span");
  emojiSpan.className = "bbox-label-emoji";
  emojiSpan.textContent = pred.emoji;

  const votesSpan = document.createElement("span");
  votesSpan.className = "bbox-label-votes";
  votesSpan.textContent = `(${pred.votes || 0} votes)`;

  labelDiv.appendChild(emojiSpan);
  labelDiv.appendChild(votesSpan);
  bboxDiv.appendChild(labelDiv);

  return bboxDiv;
}

// Main bounding box rendering function
function renderBoundingBoxes(predictions) {
  const bboxOverlay = getBoundingBoxOverlay();
  if (!bboxOverlay) return;

  // Clear existing boxes
  bboxOverlay.innerHTML = "";

  // Create and append each bounding box
  predictions.forEach((pred) => {
    const bboxElement = createBoundingBoxElement(pred);
    if (bboxElement) {
      bboxOverlay.appendChild(bboxElement);
    }
  });
}

// === PURE DATA EXTRACTION FUNCTIONS ===

// Extract emoji predictions with bounding boxes from API data (first place only)
function extractEmojiBoundingBoxes(data) {
  const emojisWithBboxes = [];
  if (data.emojiPredictions.firstPlace) {
    emojisWithBboxes.push(
      ...data.emojiPredictions.firstPlace.filter((item) => item.mergedBbox)
    );
  }
  return emojisWithBboxes;
}

// Extract face detection bounding boxes from API data
function extractFaceBoundingBoxes(data) {
  const faceBboxes = [];
  if (data.face && data.face.predictions) {
    data.face.predictions.forEach((prediction) => {
      if (prediction.type === "face_detection" && prediction.bbox) {
        faceBboxes.push({
          bbox: prediction.bbox,
          emoji: prediction.emoji || "🙂",
          type: "face",
        });
      }
    });
  }
  return faceBboxes;
}

// Convert emoji bounding box data to prediction format
function convertEmojiToPrediction(
  emojiItem,
  originalDimensions,
  displayDimensions
) {
  const scaledBbox = scaleBoundingBox(
    emojiItem.mergedBbox,
    originalDimensions,
    displayDimensions
  );

  return {
    label: emojiItem.emoji,
    emoji: emojiItem.emoji,
    scaledBbox: scaledBbox,
    originalBbox: emojiItem.mergedBbox,
    votes: emojiItem.votes || 0,
    serviceCount: emojiItem.services?.length || 0,
    type: "emoji",
  };
}

// Convert face bounding box data to prediction format
function convertFaceToPrediction(
  faceItem,
  originalDimensions,
  displayDimensions
) {
  const scaledBbox = scaleBoundingBox(
    faceItem.bbox,
    originalDimensions,
    displayDimensions
  );

  return {
    label: faceItem.emoji,
    emoji: faceItem.emoji,
    scaledBbox: scaledBbox,
    originalBbox: faceItem.bbox,
    votes: 0, // Faces don't have votes
    serviceCount: 1, // Just MediaPipe
    type: "face",
  };
}

// Process all bounding box data into prediction format
function processBoundingBoxData(data, displayDimensions) {
  const emojisWithBboxes = extractEmojiBoundingBoxes(data);
  const faceBboxes = extractFaceBoundingBoxes(data);

  if (emojisWithBboxes.length === 0 && faceBboxes.length === 0) {
    return [];
  }

  const originalDimensions = data.imageData?.imageDimensions || {
    width: 640,
    height: 426,
  };

  // Check for error state from backend
  if (originalDimensions.width < 0 || originalDimensions.height < 0) {
    console.warn(
      "Cannot process bounding boxes - image dimensions missing from analysis data:",
      originalDimensions
    );
    return []; // Return empty array to prevent broken scaling
  }

  const allPredictions = [];

  // Process emoji predictions
  emojisWithBboxes.forEach((emojiItem) => {
    allPredictions.push(
      convertEmojiToPrediction(emojiItem, originalDimensions, displayDimensions)
    );
  });

  // Process face predictions
  faceBboxes.forEach((faceItem) => {
    allPredictions.push(
      convertFaceToPrediction(faceItem, originalDimensions, displayDimensions)
    );
  });

  return allPredictions;
}

// Clear all bounding boxes immediately and re-apply visibility state
function clearAllBoundingBoxes() {
  const bboxOverlay = document.getElementById("bbox-overlay");
  if (bboxOverlay) {
    bboxOverlay.innerHTML = "";
    console.log("🧹 Cleared all bounding boxes");

    // Re-apply visibility state after clearing
    if (UserState.boundingBoxesEnabled) {
      bboxOverlay.style.display = "block";
    } else {
      bboxOverlay.style.display = "none";
    }
  }
}

// Helper function to render bounding boxes if enabled - synchronous version
function renderBoundingBoxesIfEnabled(analysisData) {
  if (!isBoundingBoxesEnabled()) {
    return;
  }

  const img = document.getElementById("main-image");
  if (!img) {
    console.warn("Main image element not found, cannot render bounding boxes");
    return;
  }

  // Use the dimensions we already set on the image element
  let displayWidth = parseFloat(img.style.width) || img.clientWidth;
  let displayHeight = parseFloat(img.style.height) || img.clientHeight;

  // Fallback to image natural dimensions if display dimensions aren't available
  if (!displayWidth || !displayHeight) {
    const originalDimensions = analysisData.imageData?.imageDimensions;
    if (!originalDimensions?.width || !originalDimensions?.height) {
      console.warn(
        "Cannot render bounding boxes - image dimensions not available"
      );
      return;
    }

    displayWidth = originalDimensions.width;
    displayHeight = originalDimensions.height;

    // Check for error state from backend
    if (originalDimensions.width < 0 || originalDimensions.height < 0) {
      console.warn(
        "Cannot render bounding boxes - image dimensions missing from analysis data:",
        originalDimensions
      );
      return; // Exit early to prevent broken bounding box rendering
    }

    const aspectRatio = originalDimensions.height / originalDimensions.width;
    displayHeight = displayWidth * aspectRatio;
  }

  const displayDimensions = {
    width: displayWidth,
    height: displayHeight,
  };

  // Process bounding boxes synchronously
  processBoundingBoxesSynchronously(analysisData, displayDimensions);
}

// Process bounding boxes synchronously using known dimensions
function processBoundingBoxesSynchronously(analysisData, displayDimensions) {
  // Check if we have any bounding box data to render
  const emojisWithBboxes = extractEmojiBoundingBoxes(analysisData);
  const faceBboxes = extractFaceBoundingBoxes(analysisData);

  if (emojisWithBboxes.length === 0 && faceBboxes.length === 0) {
    console.log("📦 No bounding box data to render");
    return;
  }

  // Process all bounding box data into prediction format
  const allPredictions = processBoundingBoxData(
    analysisData,
    displayDimensions
  );

  // Render the bounding boxes
  renderBoundingBoxes(allPredictions);
}

// Apply bounding box state to both button text and DOM visibility
function applyBoundingBoxState() {
  const isEnabled = UserState.boundingBoxesEnabled;

  // Update button text
  const bboxButton = document.getElementById("toggle-bounding-boxes");
  if (bboxButton) {
    if (isEnabled) {
      bboxButton.textContent = "Hide Bounding Boxes";
    } else {
      bboxButton.textContent = "Show Bounding Boxes";
    }
  }

  // Update overlay visibility
  const bboxOverlay = document.getElementById("bbox-overlay");
  if (bboxOverlay) {
    if (isEnabled) {
      bboxOverlay.style.display = "block";
    } else {
      bboxOverlay.style.display = "none";
    }
  }

  if (isEnabled) {
  } else {
  }
}

function toggleBoundingBoxes() {
  // Toggle the state in UserState
  UserState.boundingBoxesEnabled = !UserState.boundingBoxesEnabled;

  // Apply the new state to UI
  applyBoundingBoxState();

  // If we just turned bounding boxes ON, render them for the current image
  if (
    UserState.boundingBoxesEnabled &&
    currentDisplayedImage &&
    currentDisplayedImage.analysisData
  ) {
    renderBoundingBoxesIfEnabled(currentDisplayedImage.analysisData);
  }

  // Save the unified user state
  UserState.save();
}

// ===========================
// INITIALIZATION & STARTUP
// ===========================

// Removed login image processing - no GPU available on production server
async function preloadLoginThumbnail() {
  // GPU-dependent login image processing has been removed for production deployment
  console.log(
    "Login image processing disabled - using pre-processed images only"
  );
  return null;
}

// Reset consumed flags for session recovery
async function resetConsumedFlags() {
  // Use window.username which is set from PHP session
  if (!window.username) {
    console.log("👤 No username available, skipping consumed flag reset");
    return;
  }

  console.log(
    "🔄 Attempting to reset consumed flags for user:",
    window.username
  );

  try {
    const response = await fetch("/v3/controller/reset-consumed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: window.username,
      }),
    });

    console.log("📡 Reset consumed flags response status:", response.status);

    const result = await response.json();
    if (result.success) {
      console.log(
        `🔄 Reset ${result.resetCount} consumed flags for session recovery`
      );
    } else {
      console.error("❌ Failed to reset consumed flags:", result.error);
    }
  } catch (error) {
    console.error("❌ Error resetting consumed flags:", error);
  }
}

async function initializePreloadSystem(
  startingImageFile = null,
  enableBoundingBoxes = false
) {
  // Initializing system

  document.getElementById("loading").classList.remove("loaded");
  updateProgress(0, "Restoring session state...");

  // Reset consumed flags for session recovery (restore access to all user's historical images)
  // This is non-blocking - if it fails, navigation still works normally
  resetConsumedFlags().catch((error) => {
    console.log(
      "⚠️ Consumed flag reset failed, continuing with normal initialization:",
      error
    );
  });

  // Restore user's cumulative state from database
  await UserState.restoreFromDatabase();

  // Override bounding box state if specified in URL parameter
  if (enableBoundingBoxes !== false) {
    UserState.boundingBoxesEnabled = enableBoundingBoxes;
  }

  // Update UI with restored user state
  updateUIFromCurrentState();

  // Apply bounding box state to UI (button text and overlay visibility)
  applyBoundingBoxState();

  updateProgress(10, "Building navigation buffers...");

  // Navigation buffers will be built as needed using encounter ID references

  // Handle shared image loading
  if (startingImageFile) {
    updateProgress(50, "Loading shared image...");
    const sharedImage = await loadSpecificImage(startingImageFile);
    if (sharedImage) {
      // Set as current image and display immediately
      currentDisplayedImage = sharedImage;

      if (!sharedImage.analysisData) {
        console.error("Shared image missing analysis data");

        // Show user-friendly error message for shared images
        showError(
          "This shared image could not be fully analyzed. Showing image without ML features."
        );

        // Display shared image without analysis-dependent features
        displayImageWithoutAnalysis(sharedImage);
        return;
      }

      // Display the shared image
      displayImage(sharedImage.url, sharedImage.analysisData);
      displaySimplifiedResults(sharedImage.analysisData);
      renderBoundingBoxesIfEnabled(sharedImage.analysisData);

      // If user is logged in, continue with normal preloading
      if (username) {
        updateProgress(70, "Building navigation buffers...");
        // Initialize buffers with random images (shared image is already displayed)
        await initializeBuffers();
      } else {
        // User not logged in - stop here, no navigation allowed
        updateProgress(100, "Shared image loaded!");
        console.log("🔗 Shared image displayed for non-logged user");
      }
    } else {
      console.error(
        "❌ Failed to load shared image, falling back to normal initialization"
      );
      await initializeBuffers();
      await navigate("forward");
    }
  } else {
    // Normal initialization - no shared image
    await initializeBuffers();
    updateProgress(100, "Ready!");
    // Display first image from forward buffer (already preloaded)
    await navigate("forward");
  }

  updateProgress(100, "Ready to roll!");

  // Hide loading screen now that everything is ready
  hideLoadingScreen();

  // System ready
}

// Initialize interface when page loads
window.addEventListener("load", function () {
  // Modules initialized by game-mechanics.js after it loads

  // Start session monitoring
  startSessionMonitor();
  checkSessionOnInteraction();

  // Add resize listener for emoji stream dynamic sizing
  window.addEventListener("resize", function () {});

  // Check if we're on the main Tinder interface
  if (document.getElementById("back-btn")) {
    // Main Tinder interface (check for a Tinder-specific element)
    // Main interface detected
    setupEventListeners();

    // Initialize skip counter display
    GameMechanics.updateSkipCounter();
    
    // Initialize back counter display
    GameMechanics.updateBackCounter();

    // Check for shared image in URL
    const sharedData = getSharedImageFromURL();
    if (sharedData.image) {
      // Same initialization, just with a specific starting image
      initializePreloadSystem(sharedData.image, sharedData.bbox);
      // Clear shared flag after initial load if present
      if (sharedData.shared) {
        clearSharedFlag();
      }
    } else {
      // Try to restore previous session, fallback to random if no session found
      restoreSessionFromDatabase()
        .then((restored) => {
          if (restored) {
            // Session restored successfully, let normal initialization continue
            initializePreloadSystem();
          } else {
            // No previous session found, start with random image
            initializePreloadSystem();
          }
        })
        .catch((error) => {
          console.error(
            "❌ Session restoration failed, starting fresh:",
            error
          );
          initializePreloadSystem();
        });
    }
  } else {
    // Unknown interface type
  }
});

// Production interface complete
