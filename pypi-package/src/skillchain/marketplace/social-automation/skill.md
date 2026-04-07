# Social Automation -- Browser-Based Social Media Management

Automate social media interactions via Playwright browser automation with Edge, handling posting, engagement, timeline reading, and session management with screenshot verification.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SETUP         --> Configure browser (Playwright, Edge, profile management)
PHASE 2: AUTHENTICATE  --> Login flow, cookie sync, session verification
PHASE 3: EXECUTE       --> Post/thread/engage/read timeline (with timing randomization)
PHASE 4: VERIFY        --> Screenshot capture, DOM verification, error detection
PHASE 5: REPORT        --> Log actions, store posts in memory, update engagement metrics
```

## Inputs

- **action**: string -- What to do: "post", "thread", "like", "reply", "read_timeline", "read_mentions", "login"
- **content**: string (optional) -- Text to post or reply with
- **target_url**: string (optional) -- Tweet URL for like/reply actions
- **force**: boolean (optional) -- Override organic timing skip (default: false)

## Outputs

- **action_result**: object -- Success/failure status, screenshot path, posted URL (if applicable)
- **scraped_data**: list[object] (optional) -- Timeline/mention data: [{text, user, time}]
- **session_status**: object -- Login state, cookie freshness, profile health

## Execution

### Phase 1: SETUP -- Configure Browser
**Entry criteria:** Playwright installed. Microsoft Edge available. Automation profile directory accessible.
**Actions:**
1. Configure browser context:
   ```python
   source_profile = os.path.join(LOCALAPPDATA, "Microsoft", "Edge", "User Data")
   edge_profile = os.path.join(LOCALAPPDATA, "Microsoft", "Edge", "Velma Automation")
   
   browser = pw.chromium.launch_persistent_context(
       user_data_dir=edge_profile,
       channel="msedge",
       headless=False,              # Sites detect headless
       args=["--disable-blink-features=AutomationControlled"],
       viewport={"width": 1280, "height": 900},
       slow_mo=200,                 # 200ms between actions
       timeout=30000,
   )
   ```
2. Ensure Edge is not already running (Playwright can't attach to existing instances with same profile)
3. Set up resource cleanup pattern (try/finally for browser and Playwright)
4. Prepare screenshots directory: `%USERPROFILE%/Desktop/velma_screenshots/`
**Output:** Browser context configured and ready to launch.
**Quality gate:** Edge is closed. Automation profile directory exists. Screenshots directory exists. Cleanup pattern in place (try/finally).

### Phase 2: AUTHENTICATE -- Session Management
**Entry criteria:** Browser context configured.
**Actions:**
1. Sync cookies from real Edge profile to automation profile:
   ```python
   SYNC_FILES = [
       "Cookies", "Cookies-journal",
       "Login Data", "Login Data-journal",
       "Web Data", "Web Data-journal",
       "Preferences", "Secure Preferences",
   ]
   # "Local State" goes in profile root, not Default/
   ```
2. Launch browser with synced profile
3. Navigate to target site and check session status:
   - If URL contains `/login` after navigation -> session expired
   - If URL contains `/home` or `/compose` -> session valid
4. If session expired, run login flow:
   - Navigate to `https://x.com/login`
   - Keep browser open 3 minutes for manual sign-in
   - Poll every 5 seconds for URL change indicating success
   - Graceful close flushes cookies to disk
5. Handle cookie file locking on Windows (Edge locks SQLite database files -- use try/except on copy)
**Output:** Authenticated browser session ready for operations.
**Quality gate:** Session is valid (not redirected to /login). Cookies synced successfully (or sync failure handled gracefully). Browser launched in headed mode with anti-detection flags.

### Phase 3: EXECUTE -- Perform Social Actions
**Entry criteria:** Authenticated browser session active.
**Actions:**
1. **Posting a tweet:**
   - Navigate to `https://x.com/compose/post`
   - Wait 3 seconds for page load
   - Kill overlays via JS (cookie consent, migration banners, promo dialogs):
     ```javascript
     document.querySelectorAll('[data-testid="twc-cc-mask"]').forEach(e => e.remove());
     document.querySelectorAll('[data-testid="xMigrationBottomBar"]').forEach(e => e.remove());
     ```
   - Find compose textarea using selector chain (4 fallback selectors)
   - `compose.click(force=True)` to bypass remaining overlays
   - `page.keyboard.type(text, delay=20)` -- character-by-character, 20ms delay
   - `page.keyboard.press("Control+Enter")` -- keyboard shortcut to post (more reliable than button click)
   - Wait 5 seconds for submission

2. **Posting a thread:**
   - First tweet: compose normally
   - Subsequent tweets: click add button (`[data-testid="addButton"]`)
   - Textarea ID increments: `tweetTextarea_0`, `tweetTextarea_1`, ...
   - Type into the LAST textbox (highest index)
   - Configurable delay between tweets (default 3s, launch stories 20-45s random)
   - Post all via `[data-testid="tweetButton"]`

3. **Engagement (like/reply):**
   - Navigate to tweet URL
   - Like: `page.wait_for_selector('[data-testid="like"]').click()`
   - Reply: click reply button, wait for compose box, type reply, click post

4. **Read timeline/mentions:**
   - Navigate to `https://x.com/home` or `https://x.com/notifications/mentions`
   - Extract tweet data via `page.evaluate()` JS:
     ```javascript
     articles = document.querySelectorAll('article[data-testid="tweet"]');
     // Extract: text, user, time from each article
     ```

5. **Organic timing**: 30% random skip rate for cron-triggered posts (override with `force=True`)
6. **Duplicate prevention**: Scrape own recent tweets, pass to LLM as context to avoid duplication
**Output:** Action executed (post created, tweet liked, reply sent, or timeline data scraped).
**Quality gate:** For posts: text was typed fully (not truncated). For engagement: target element found and clicked. For timeline reads: valid data extracted. Organic timing applied unless force=True.

### Phase 4: VERIFY -- Screenshot & DOM Check
**Entry criteria:** Action executed in Phase 3.
**Actions:**
1. Take verification screenshot:
   ```python
   # Naming: velma_{action}_{YYYYMMDD_HHMMSS}.png
   # Actions: pre_submit, posted, not_logged_in, compose_not_found, thread_posted, replied
   ```
2. Check DOM state to confirm action succeeded:
   - Post: verify compose area cleared or success indicator present
   - Like: verify like button state changed (filled vs outline)
   - Reply: verify reply appears in thread
   - Timeline: verify data extraction returned non-empty results
3. Detect error states:
   - Rate limiting indicators
   - Account suspension notices
   - CAPTCHA challenges
   - Compose area not found (selector chain exhausted)
4. If error detected, capture diagnostic screenshot with error-specific naming
**Output:** Verification screenshot path and action success/failure confirmation.
**Quality gate:** Screenshot captured and saved. Action success confirmed via DOM state. Any errors detected and classified.

### Phase 5: REPORT -- Log & Update Metrics
**Entry criteria:** Verification complete with success/failure determination.
**Actions:**
1. Log action details:
   - Action type, timestamp, content (if post), target (if engagement)
   - Success/failure status
   - Screenshot path for audit trail
2. Store posts in memory for deduplication (prevent repeat content)
3. Update engagement metrics:
   - Posts sent (count, timestamps)
   - Engagement actions (likes, replies, count)
   - Timeline reads (timestamps, data volume)
4. Check for one-time flag files (e.g., launch story `story_posted.flag`)
5. Clean up browser resources (close browser, stop Playwright)
**Output:** Action log entry, updated metrics, clean resource state.
**Quality gate:** Browser and Playwright properly closed (no orphaned processes). Metrics updated. Deduplication list current. Screenshot stored as audit trail.

## Exit Criteria

- Requested social action completed successfully (or failure clearly reported)
- Verification screenshot captured and stored
- Browser and Playwright resources cleaned up
- Action logged with all details
- Deduplication list updated (for posts)
- No orphaned browser processes

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| SETUP | Edge already running with same profile | **Adjust** -- kill Edge processes first, or use alternate profile directory |
| AUTHENTICATE | Session expired, cannot re-login automatically | **Escalate** -- open browser for manual login, wait for user to complete |
| AUTHENTICATE | Cookie file locked by running Edge | **Skip** -- proceed without sync, use existing automation profile cookies |
| EXECUTE | Compose textarea not found (all selectors fail) | **Abort** -- capture diagnostic screenshot, report selectors may have changed |
| EXECUTE | Ctrl+Enter doesn't submit post | **Retry** -- fall back to clicking `[data-testid="tweetButton"]` |
| EXECUTE | contenteditable typing fails (React state not updating) | **Adjust** -- increase slow_mo, add delays between keystrokes |
| VERIFY | Screenshot capture fails | **Skip** -- log action without screenshot, note missing verification |
| REPORT | Browser close hangs | **Abort** -- force kill browser process after 10s timeout |

## State Persistence

- Cookie/session state (in Edge automation profile directory)
- Recent posts list (for deduplication)
- One-time flag files (e.g., story_posted.flag in %LOCALAPPDATA%/Velma/)
- Engagement metrics (cumulative across sessions)
- Screenshot archive (audit trail)

## Reference

### IP Safety Rules

**CRITICAL**: Never post patent-sensitive content via social media automation. The Velma ecosystem includes proprietary algorithms under patent protection.

- Safe topics: what Velma can do, philosophical takes, build-in-public updates
- Unsafe topics: specific algorithm formulas, governance threshold values, trading edge details

### Element Selectors (X/Twitter)

**Compose textarea (fallback chain):**
```python
selectors = [
    '[data-testid="tweetTextarea_0"]',
    '[role="textbox"][data-testid="tweetTextarea_0"]',
    'div[contenteditable="true"][role="textbox"]',
    '.public-DraftEditor-content',
]
```

**Thread controls:**
- Add tweet: `[data-testid="addButton"]` or `button[aria-label="Add post"]`
- Post button: `[data-testid="tweetButton"]` or `[data-testid="tweetButtonInline"]`

**Engagement:**
- Like: `[data-testid="like"]`
- Reply: `[data-testid="reply"]`

### DOM Scraping Pattern

```javascript
(maxTweets) => {
    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    const results = [];
    for (let i = 0; i < Math.min(articles.length, maxTweets); i++) {
        const textEl = articles[i].querySelector('[data-testid="tweetText"]');
        const userEl = articles[i].querySelector('[data-testid="User-Name"]');
        const timeEl = articles[i].querySelector('time');
        results.push({
            text: textEl ? textEl.innerText : '',
            user: userEl ? userEl.innerText.split('\n')[0] : '',
            time: timeEl ? timeEl.getAttribute('datetime') : '',
        });
    }
    return results;
}
```

### Browser Session Extraction

Velma can extract open tabs from Chrome, Edge, and Firefox without launching them:
- **Chrome/Edge**: Read LevelDB files in `Session Storage/`, extract URLs via regex
- **Firefox**: Parse `sessionstore-backups/recovery.json`

### Common Pitfalls

1. Edge must be closed before launching -- Playwright can't attach to running instance with same profile
2. X uses contenteditable div, not standard input -- `page.fill()` does NOT work, must use `page.keyboard.type()`
3. X layers cookie consent, migration banners, promo dialogs -- always run overlay removal JS before compose
4. Ctrl+Enter is more reliable than clicking the post button (X sometimes hides/disables it)
5. Sessions expire -- check for /login redirect after navigation
6. Always use `headless=False` and `--disable-blink-features=AutomationControlled` -- X detects headless
7. Without `slow_mo=200`, typing is too fast for React state updates -- causes empty tweets
8. Thread textarea IDs increment (`tweetTextarea_0`, `_1`, `_2`) -- always target highest index
9. Windows locks Edge cookie database files -- shutil.copy2 can fail if Edge is running
10. Launch story flag file at `%LOCALAPPDATA%/Velma/story_posted.flag` -- deletion causes re-post
