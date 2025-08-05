// Make debug function available globally
// Add to window for easy browser console access
if (typeof window !== "undefined") {
  window.debugDumpState = debugDumpState;
  window.debugDumpStateLite = debugDumpStateLite;
  window.collectCurrentState = collectCurrentState;
  window.showUserActions = showUserActions;
}

// Debug function to show user actions
function showUserActions() {
  // User actions logged
  // Image buffer status
  return { userActions, viewingHistory, currentImageIndex: turingTape.head };
}

// === STATE DEBUGGING UTILITIES ===

// Main state collection function - now much simpler
function collectCurrentState() {
  const state = {
    navigation: collectNavigationState(),
    interactions: collectInteractionState(),
    gameMechanics: GameMechanics.collectGameMechanicsState(),
    ui: collectUserPreferences(),
    processing: collectProcessingState(),
    dataCollection: collectDataCollectionState(),
    session: collectSessionInfo(),
    meta: {
      timestamp: Date.now(),
      stateSize: 0, // Will be calculated below
    },
  };

  // Calculate and set state size
  state.meta.stateSize = calculateStateSize(state);

  return state;
}

// === STATE COLLECTION UTILITY FUNCTIONS ===

// Collect navigation state data
function collectNavigationState() {
  return {
    forwardBufferLength: forwardBuffer.length,
    backwardBufferLength: backwardBuffer.length,
    currentImage: currentDisplayedImage,
    canNavigateForward: canNavigateForward(),
    canNavigateBackward: canNavigateBackward(),
  };
}

// Collect user interaction state data
function collectInteractionState() {
  const displayData = SessionState.getDisplayData();

  return {
    userActions: [...userActions],
    emojiSequencesByAction: {
      like: displayData.likedEmojis,
      dislike: displayData.dislikedEmojis,
      skip: [],
      download: [],
      share: [],
    },
    actionCounts: {
      like: displayData.likeCount,
      dislike: displayData.dislikeCount,
      skip: 0,
      download: 0,
      share: 0,
    },
  };
}

// Collect game mechanics state data
// collectGameMechanicsState moved to game-mechanics.js

// Collect user preferences data
function collectUserPreferences() {
  return {
    boundingBoxesEnabled: isBoundingBoxesEnabled(),
    currentImageId: TransientState.currentImageId,
  };
}

// Collect async processing state data
function collectProcessingState() {
  return {
    emojiRemovalQueue: emojiRemovalQueue.length,
    isProcessingRemovals: isProcessingRemovals,
    databaseQueueLength: databaseQueue.length,
    isProcessingQueue: isProcessingQueue,
    bufferLength: buffer.length,
  };
}

// Collect data collection state
function collectDataCollectionState() {
  return {
    dataCollector: dataCollector
      ? {
          sessionId: dataCollector.sessionId,
          startTime: dataCollector.startTime,
          interactionData: { ...dataCollector.interactionData },
        }
      : null,
  };
}

// Collect session information
function collectSessionInfo() {
  return {
    username: typeof username !== "undefined" ? username : null,
    sessionId:
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("sessionId")
        : null,
    timestamp: new Date().toISOString(),
  };
}

function debugDumpState() {
  const state = collectCurrentState();

  console.group("🔍 APPLICATION STATE SUMMARY");
  console.log(
    "📊 State Size:",
    state.meta.stateSize + "KB",
    "← HOLY CRAP THIS IS HUGE!"
  );
  console.log("🔄 Position Consistency:", state.meta.positionConsistency);
  console.log("📍 Current Position:", state.navigation.currentImageIndex);
  console.log(
    "🎯 Journey Position:",
    state.navigation.userJourney.currentPosition
  );
  console.log(
    "💾 Viewing History Length:",
    state.navigation.viewingHistoryLength
  );
  console.log("🏆 User Score:", state.gameMechanics.userScore);
  console.log(
    "⏭️ Skip Budget:",
    `${TransientState.skipBudget.maxSkips - TransientState.skipBudget.used}/${
      TransientState.skipBudget.maxSkips
    }`
  );
  console.groupEnd();

  return state;
}

function debugDumpStateLite() {
  const state = collectCurrentState();

  // Calculate size breakdown
  const sizeBreakdown = {
    navigation: Math.round(JSON.stringify(state.navigation).length / 1024),
    interactions: Math.round(JSON.stringify(state.interactions).length / 1024),
    gameMechanics: Math.round(
      JSON.stringify(state.gameMechanics).length / 1024
    ),
    ui: Math.round(JSON.stringify(state.ui).length / 1024),
    processing: Math.round(JSON.stringify(state.processing).length / 1024),
    dataCollection: Math.round(
      JSON.stringify(state.dataCollection).length / 1024
    ),
  };

  // Just the essentials
  const lite = {
    position: {
      currentImageIndex: state.navigation.currentImageIndex,
      journeyPosition: state.navigation.userJourney.currentPosition,
      consistent: state.meta.positionConsistency.consistent,
    },
    game: {
      score: state.gameMechanics.userScore,
      skipsLeft:
        TransientState.skipBudget.maxSkips - TransientState.skipBudget.used,
    },
    timeline: {
      length: state.navigation.userJourney.timeline.length,
    },
    size: state.meta.stateSize + "KB",
    sizeBreakdown: sizeBreakdown,
  };

  console.log("🔍 STATE LITE:", lite);
  return lite;
}

// Debug functions for testing (accessible from browser console)
window.debugBuffers = {
  getBufferInfo: () => ({
    forwardBuffer: forwardBuffer.length,
    backwardBuffer: backwardBuffer.length,
    currentImage: currentDisplayedImage?.filename || "none",
    bufferEncounters: backwardBuffer
      .map((img) => img.encounterId)
      .filter(Boolean),
  }),
  getCurrentImage: () => currentDisplayedImage,
  navigate: async (direction) => {
    navigate(direction);
    updateUIFromCurrentState();
    return true;
  },
  simulate: {
    like: () => handleInteraction("like"),
    dislike: () => handleInteraction("dislike"),
    skip: () => handleInteraction("skip"),
    back: () => handleInteraction("history"),
  },
  dumpTape: () => {
    console.log("📼 Complete Turing Tape Dump:");
    turingTape.tape.forEach((entry, index) => {
      console.log(`Position ${index}:`, {
        action: entry.action,
        image: entry.image?.cocoFile || "none",
        timestamp: new Date(entry.timestamp).toLocaleTimeString(),
        contextType: entry.context?.type || "unknown",
      });
    });
    return turingTape.tape;
  },
  getWriteHistory: () => turingTape.getWriteHistory(),
  analyzeRewrites: () => {
    const history = turingTape.getWriteHistory();
    const rewrites = history.filter((record) => record.previousAction !== null);
    return {
      totalWrites: history.length,
      totalRewrites: rewrites.length,
      rewriteRate:
        history.length > 0
          ? ((rewrites.length / history.length) * 100).toFixed(2) + "%"
          : "0%",
      rewritesByPosition: rewrites.reduce((acc, record) => {
        acc[record.position] = (acc[record.position] || 0) + 1;
        return acc;
      }, {}),
      rewriteDetails: rewrites.map((record) => ({
        position: record.position,
        from: record.previousAction,
        to: record.action,
        image: record.image,
        timestamp: new Date(record.timestamp).toLocaleString(),
        context: record.context.type,
      })),
    };
  },
  showRewrites: () => {
    const history = turingTape.getWriteHistory();
    const analysis = turingTape
      .getWriteHistory()
      .filter((record) => record.previousAction !== null);

    console.log("📊 REWRITE ANALYSIS");
    console.log("=".repeat(50));
    console.log(`Total writes: ${history.length}`);
    console.log(`Total rewrites: ${analysis.length}`);
    console.log(
      `Rewrite rate: ${
        history.length > 0
          ? ((analysis.length / history.length) * 100).toFixed(2) + "%"
          : "0%"
      }`
    );
    console.log("");

    if (analysis.length > 0) {
      console.log("📝 REWRITE DETAILS:");
      analysis.forEach((record, index) => {
        console.log(
          `${index + 1}. Position ${record.position}: ${
            record.previousAction
          } → ${record.action}`
        );
        console.log(`   Image: ${record.image}`);
        console.log(`   Time: ${new Date(record.timestamp).toLocaleString()}`);
        console.log("");
      });
    } else {
      console.log("✨ No rewrites yet - all decisions were final!");
    }

    return analysis;
  },
};

// Calculate state size in KB
function calculateStateSize(state) {
  const stateJson = JSON.stringify(state);
  return Math.round(stateJson.length / 1024);
}

console.log("🛠️ Debug functions available: window.debugBuffers");

// SESSION END SAFETY NET: Save any unsaved buffer contents when user leaves
// Addresses data loss risk for short sessions that never trigger buffer overflow
// COMMENTED OUT FOR TESTING - to prove this causes extra database entries on reload
/*
    window.addEventListener('beforeunload', function() {
        // Save current image if it exists and hasn't been saved yet
        if (currentDisplayedImage) {
            // Add view action if it doesn't exist (handles first image case)
            if (!currentDisplayedImage.actionHistory || currentDisplayedImage.actionHistory.length === 0) {
                trackAction('view', currentDisplayedImage, { navigationSource: 'session_start' });
            }
            
            // Store immediately (synchronous to work during beforeunload)
            const record = createUnifiedStorageRecord(currentDisplayedImage);
            navigator.sendBeacon(`${CONFIG.API_URL}/store`, JSON.stringify(record));
            console.log('💾 Session end safety: Saved current image via beacon');
        }
        
        // Save any images still in backward buffer that haven't been saved
        backwardBuffer.forEach((image, index) => {
            if (image && (!image.actionHistory || image.actionHistory.length === 0)) {
                trackAction('view', image, { navigationSource: 'buffer_rescue' });
            }
            if (image) {
                const record = createUnifiedStorageRecord(image);
                navigator.sendBeacon(`${CONFIG.API_URL}/store`, JSON.stringify(record));
                console.log(`💾 Session end safety: Saved buffer image ${index} via beacon`);
            }
        });
    });
    */
