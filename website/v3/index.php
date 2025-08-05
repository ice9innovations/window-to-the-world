<?php
// Environment-controlled debug mode
$debugMode = ($_ENV['DEBUG_MODE'] ?? 'false') === 'true'; // Default to false for security

if ($debugMode) {
    // Development: Show all errors for debugging
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
} else {
    // Production: Hide errors from users, log them instead
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    ini_set('log_errors', 1);
}

session_start();

// Check if user is logged in with valid session data
if (!isset($_SESSION['username']) || empty($_SESSION['username']) || !isset($_SESSION['userID'])) {
    error_log("Login redirect: Missing or empty session data - username: " . (isset($_SESSION['username']) ? $_SESSION['username'] : 'not set') . ", userID: " . (isset($_SESSION['userID']) ? $_SESSION['userID'] : 'not set'));
    
    // Preserve shared link parameters when redirecting to login
    $queryString = $_SERVER['QUERY_STRING'] ?? '';
    $loginUrl = '/login/';
    if (!empty($queryString)) {
        $loginUrl .= '?' . $queryString;
        error_log("Login redirect: Preserving shared link parameters: " . $queryString);
    }
    
    header("Location: " . $loginUrl);
    exit();
}
?>
<!DOCTYPE html>
<html lang="en-us">
<head>
    <title>Animal Farm v3 - Image Analysis</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&display=swap" rel="stylesheet">
</head>
<body>

    <!-- Loading state -->
    <div id="loading">
        <div class="loading-content">
            <h3>Loading</h3>
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>
            <p id="progress-text">Building image buffer...</p>
        </div>
    </div>

    <!-- Results - Simple layout -->
    <main id="results" role="main" aria-label="Image analysis results">
        <!-- Score header -->
        <header class="score-header">
            <div class="score-row">
                <span class="score-label">Score:</span>
                <span class="score-value" id="user-score" aria-live="polite">0</span>
                <span class="interaction-stats" id="interaction-stats" aria-live="polite">👍0 👎0</span>
                <div id="emojis-category-display" aria-live="polite">
                    <span id="categories-liked" class="categories">Liked: none yet</span>
                    <span id="categories-disliked" class="categories">Disliked: none yet</span>
                </div>
            </div>
            <div class="emoji-stream liked" id="emoji-stream-liked" aria-live="polite" aria-label="Your liked emoji collection"></div>
            <div class="emoji-stream disliked" id="emoji-stream-disliked" aria-live="polite" aria-label="Your disliked emoji collection"></div>
        </header>

        <!-- Secondary actions - de-emphasized -->
        <nav class="secondary-controls" aria-label="Secondary actions">
            <button class="secondary-btn dislike" id="dislike-btn" aria-label="Mark as disliked">👎 Dislike</button>
            <button class="secondary-btn back" id="back-btn" aria-label="Go back to previous image">⏪ Back (<span id="back-count">3</span>)</button>
            <button class="secondary-btn skip" id="skip-btn" aria-label="Skip to next image">⏭️ Skip (<span id="skip-count">3</span>)</button>
            <button class="secondary-btn like" id="like-btn" aria-label="Mark as liked">👍 Like</button>
            <!-- Temporary testing buttons -->
            <button class="secondary-btn" id="tape-back-btn" aria-label="Navigate backward on tape">← Tape Back</button>
            <button class="secondary-btn" id="tape-forward-btn" aria-label="Navigate forward on tape">Tape Forward →</button>
        </nav>

        <!-- AI Analysis section -->
        <section class="ai-analysis-section" aria-label="AI analysis results">
            <!-- Best caption first -->
            <article id="caption-best" aria-label="Image caption"></article>

            <!-- First place emojis -->
            <article id="emoji-predictions-primary" aria-label="Primary emoji predictions">
                <div id="guess-final"></div>
            </article>

            <!-- Second place emojis (hidden for now) -->
            <article id="emoji-predictions-secondary" style="display: none;" aria-label="Secondary emoji predictions">
                <div id="guess-second"></div>
            </article>
        </section>


        <!-- Main image display with click zones -->
        <section id="image-display-container" aria-label="Image display and interaction area">
            <div id="image-display">
                <div class="image-container">
                    <img id="main-image" src="" alt="Random COCO image">
                </div>
            </div>
            <div id="image-click-zones">
                <button aria-label="Dislike" class="click-zone dislike-zone" id="dislike-zone" title="Dislike (click left)" aria-label="Dislike this image"></button>
                <button aria-label="Like" class="click-zone like-zone" id="like-zone" title="Like (click right)" aria-label="Like this image"></button>
            </div>
        </section>

        <section class="ai-analysis-section" aria-label="AI analysis results">
            <!-- Compact color palette row -->
            <div id="color-palette-compact" aria-label="Color palette"></div>
        </section>

        <nav class="secondary-controls" aria-label="Secondary actions">
            <button class="secondary-btn" id="download-btn" aria-label="Download this image">⬇ Download Image</button>
            <button class="secondary-btn" id="share-btn" aria-label="Share this image">🔗 Share</button>
            <button class="secondary-btn" id="history-btn" aria-label="View image history">📋 History</button>
        </nav>
 
        <!-- Debug/technical controls -->
        <section class="debug-controls" aria-label="Debug controls">
            <button id="toggle-bounding-boxes" class="bbox-btn">Show Bounding Boxes</button>
        </section>
        
        <!-- Debug sections -->
        <section class="debug-sections" aria-label="Detailed analysis information">
            <div id="confidence-info" aria-label="Confidence levels"></div>
            <section id="color-palette" aria-label="Color analysis"></section>
            <section id="captions" aria-label="AI generated captions">
                <article id="blip-caption" aria-label="BLIP caption"></article>
                <article id="llama-caption" aria-label="LLaMA caption"></article>
            </section>
            <section class="vote-breakdown" aria-label="Vote breakdown">
                <h3>Vote Breakdown</h3>
                <div id="vote-details"></div>
            </section>
            <section class="service-summary" aria-label="Service performance summary">
                <h3>Service Summary</h3>
                <div id="service-overview"></div>
                <div id="service-details"></div>
            </section>
            <section class="analysis-footer" aria-label="Additional analysis details">
                <h3>Analysis Details</h3>
                <div id="analysis-details"></div>
            </section>
        </section>
    </main>
    <script>
        // Make session variables globally accessible for modules
        window.username = "<?PHP echo $_SESSION['username']; ?>";
        window.sessionId = "<?PHP echo session_id(); ?>";
        
        // Store sessionId in sessionStorage for JavaScript access
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('sessionId', window.sessionId);
        }
        
        // Login image processing removed - no GPU on production server
        const loginImageUrl = "";
        
        console.log("Login image URL:", loginImageUrl);
        console.log("Session variables set:", { username: window.username, sessionId: window.sessionId });
    </script>
    <script src="scripts/config.js"></script>
    <script src="scripts/logger.js"></script>
    <script src="scripts/app.js"></script>
    <script src="scripts/game-mechanics.js"></script>
</body>
</html>
