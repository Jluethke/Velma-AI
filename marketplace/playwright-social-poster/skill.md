# Playwright Social Poster

Takes a fully written content pack and generates complete, runnable Playwright (Python) automation scripts for each platform — LinkedIn, Reddit, Twitter/X, Facebook, Instagram. Scripts handle login session management, post creation, content insertion, scheduling logic, and error handling. Output is copy-paste runnable code.

**Why this exists:** Writing the content is one problem. Actually posting it across 5 platforms on a schedule is another. This skill generates the automation layer so a single Python process can run the entire 30-day campaign unattended.

**Core principle:** Scripts use persistent browser contexts (saved session cookies) so login credentials are never hardcoded. First run authenticates manually and saves the session. All subsequent runs reuse it. Each platform has its own script. A single orchestrator script ties them together.

## Inputs

- `full_content_pack`: string — Complete content document from social-content-writer
- `content_calendar`: list[object] — Day-by-day schedule with platform, post reference, and target community
- `platform_credentials_env`: object — Environment variable names (not values) for each platform: `{linkedin_session_path, reddit_session_path, twitter_session_path, facebook_session_path, instagram_session_path}`
- `post_times`: object — Preferred posting time per platform in UTC: `{linkedin: "13:00", reddit: "15:00", twitter: "12:00", facebook: "14:00", instagram: "11:00"}`
- `dry_run_mode`: boolean — If true, scripts print what they would post but do not submit. Default true.
- `headless`: boolean — Run browser headlessly. Default false for first run (need to see login). True for scheduled runs.

## Outputs

- `linkedin_script`: string — Complete Python Playwright script for LinkedIn posting
- `reddit_script`: string — Complete Python Playwright script for Reddit posting
- `twitter_script`: string — Complete Python Playwright script for Twitter/X posting
- `facebook_script`: string — Complete Python Playwright script for Facebook posting
- `instagram_script`: string — Complete Python Playwright script for Instagram posting
- `orchestrator_script`: string — Master Python script that reads the content calendar and dispatches to each platform script on schedule
- `session_setup_script`: string — One-time setup script that launches each platform, waits for manual login, and saves the session cookie to disk
- `requirements_txt`: string — All Python dependencies
- `readme`: string — Step-by-step setup and usage instructions

---

## Execution

### Phase 1: SESSION MANAGEMENT ARCHITECTURE

**Generate the session setup script first.** This runs once, manually:

```python
# session_setup.py — Run ONCE per platform to save login session
# Usage: python session_setup.py --platform linkedin

import asyncio
import argparse
from pathlib import Path
from playwright.async_api import async_playwright

SESSION_PATHS = {
    "linkedin":  "sessions/linkedin_session.json",
    "reddit":    "sessions/reddit_session.json",
    "twitter":   "sessions/twitter_session.json",
    "facebook":  "sessions/facebook_session.json",
    "instagram": "sessions/instagram_session.json",
}

LOGIN_URLS = {
    "linkedin":  "https://www.linkedin.com/login",
    "reddit":    "https://www.reddit.com/login",
    "twitter":   "https://twitter.com/login",
    "facebook":  "https://www.facebook.com/login",
    "instagram": "https://www.instagram.com/accounts/login/",
}

async def setup_session(platform: str):
    session_path = Path(SESSION_PATHS[platform])
    session_path.parent.mkdir(exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        print(f"Opening {platform} login page...")
        await page.goto(LOGIN_URLS[platform])
        print(f"Log in manually in the browser window.")
        print(f"Press ENTER here when you are fully logged in and on the home page.")
        input()

        await context.storage_state(path=str(session_path))
        print(f"Session saved to {session_path}")
        await browser.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--platform", required=True, choices=SESSION_PATHS.keys())
    args = parser.parse_args()
    asyncio.run(setup_session(args.platform))
```

**Output:** `session_setup_script`

---

### Phase 2: LINKEDIN SCRIPT

Generate a complete LinkedIn posting script. Key behaviors:
- Load saved session
- Navigate to linkedin.com/feed
- Click "Start a post"
- Insert post body (handle line breaks — LinkedIn uses Shift+Enter for line breaks within a post)
- Add hashtags
- For carousels: upload pre-generated slide images if present
- Click "Post"
- Verify post appeared in feed
- Log result with timestamp

```python
# linkedin_poster.py
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

SESSION_PATH = "sessions/linkedin_session.json"

async def post_to_linkedin(content: dict, dry_run: bool = True, headless: bool = True):
    """
    Post content to LinkedIn.
    
    content: {
        "body": str,       # Full post text with hashtags
        "format": str,     # "text" | "carousel"
        "slides": list     # Paths to slide images if carousel
    }
    """
    if dry_run:
        print(f"[DRY RUN] LinkedIn post:")
        print(f"  Body: {content['body'][:100]}...")
        return {"status": "dry_run", "platform": "linkedin"}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context(storage_state=SESSION_PATH)
        page = await context.new_page()

        try:
            await page.goto("https://www.linkedin.com/feed/", wait_until="networkidle")

            # Click "Start a post" button
            start_post = page.locator('[aria-label="Start a post"]').first
            await start_post.wait_for(state="visible", timeout=10000)
            await start_post.click()
            await page.wait_for_timeout(1500)

            # Type post content
            post_box = page.locator(".ql-editor").first
            await post_box.wait_for(state="visible", timeout=10000)
            await post_box.click()

            # Insert text preserving line breaks
            body = content["body"]
            paragraphs = body.split("\n")
            for i, paragraph in enumerate(paragraphs):
                await post_box.type(paragraph, delay=20)
                if i < len(paragraphs) - 1:
                    await page.keyboard.press("Shift+Enter")

            await page.wait_for_timeout(1000)

            # Submit
            post_button = page.locator('[aria-label="Post"]').last
            await post_button.wait_for(state="visible", timeout=5000)
            await post_button.click()
            await page.wait_for_timeout(3000)

            print(f"[SUCCESS] LinkedIn post submitted")
            return {"status": "success", "platform": "linkedin"}

        except Exception as e:
            print(f"[ERROR] LinkedIn post failed: {e}")
            await page.screenshot(path=f"errors/linkedin_error_{int(asyncio.get_event_loop().time())}.png")
            return {"status": "error", "platform": "linkedin", "error": str(e)}

        finally:
            await browser.close()
```

**Output:** `linkedin_script` (full script with all posts from content pack loaded as data)

---

### Phase 3: REDDIT SCRIPT

Key behaviors:
- Load saved session
- Navigate to target subreddit
- Click "Create Post"
- Select post type (text)
- Fill title
- Fill body
- Check community rules compliance (flair if required)
- Submit
- Handle CAPTCHA detection — pause and alert if triggered

```python
# reddit_poster.py
import asyncio
from playwright.async_api import async_playwright

SESSION_PATH = "sessions/reddit_session.json"

async def post_to_reddit(content: dict, dry_run: bool = True, headless: bool = True):
    """
    content: {
        "subreddit": str,   # e.g. "MachineLearning"
        "title": str,
        "body": str,
        "flair": str        # Optional — required by some subreddits
    }
    """
    if dry_run:
        print(f"[DRY RUN] Reddit post to r/{content['subreddit']}:")
        print(f"  Title: {content['title']}")
        print(f"  Body: {content['body'][:100]}...")
        return {"status": "dry_run", "platform": "reddit"}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context(storage_state=SESSION_PATH)
        page = await context.new_page()

        try:
            subreddit = content["subreddit"]
            await page.goto(f"https://www.reddit.com/r/{subreddit}/submit", wait_until="networkidle")
            await page.wait_for_timeout(2000)

            # Select text post type
            text_tab = page.locator('[role="tab"]:has-text("Text")')
            await text_tab.click()
            await page.wait_for_timeout(500)

            # Title
            title_input = page.locator('[placeholder="Title"]')
            await title_input.fill(content["title"])

            # Body
            body_editor = page.locator('.public-DraftEditor-content')
            await body_editor.click()
            await body_editor.type(content["body"], delay=10)

            # Flair if required
            if content.get("flair"):
                flair_btn = page.locator('[aria-label*="flair"]').first
                if await flair_btn.is_visible():
                    await flair_btn.click()
                    flair_option = page.locator(f'text="{content["flair"]}"').first
                    if await flair_option.is_visible():
                        await flair_option.click()

            # Submit
            submit_btn = page.locator('[aria-label="Submit"]').last
            await submit_btn.click()
            await page.wait_for_timeout(3000)

            # Check for CAPTCHA
            if await page.locator('[id*="captcha"]').is_visible():
                print("[ALERT] CAPTCHA detected — manual intervention required")
                input("Solve the CAPTCHA then press ENTER to continue...")

            print(f"[SUCCESS] Reddit post submitted to r/{subreddit}")
            return {"status": "success", "platform": "reddit", "subreddit": subreddit}

        except Exception as e:
            print(f"[ERROR] Reddit post failed: {e}")
            await page.screenshot(path=f"errors/reddit_error_{int(asyncio.get_event_loop().time())}.png")
            return {"status": "error", "platform": "reddit", "error": str(e)}

        finally:
            await browser.close()
```

**Output:** `reddit_script`

---

### Phase 4: TWITTER/X SCRIPT

Key behaviors:
- Load session
- Navigate to twitter.com/compose/tweet
- For threads: post first tweet, then reply to own tweet for each subsequent tweet
- Handle character count — split if over 280
- Add media if specified

```python
# twitter_poster.py
import asyncio
from playwright.async_api import async_playwright

SESSION_PATH = "sessions/twitter_session.json"

async def post_thread_to_twitter(tweets: list, dry_run: bool = True, headless: bool = True):
    """
    tweets: list of strings. First is the root tweet, rest are replies in thread.
    """
    if dry_run:
        print(f"[DRY RUN] Twitter thread ({len(tweets)} tweets):")
        for i, t in enumerate(tweets):
            print(f"  [{i+1}] {t[:80]}...")
        return {"status": "dry_run", "platform": "twitter"}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context(storage_state=SESSION_PATH)
        page = await context.new_page()

        try:
            await page.goto("https://twitter.com/home", wait_until="networkidle")
            await page.wait_for_timeout(2000)

            # Click compose
            compose_btn = page.locator('[aria-label="Tweet"]').first
            await compose_btn.click()
            await page.wait_for_timeout(1000)

            tweet_box = page.locator('[aria-label="Tweet text"]').first
            await tweet_box.click()
            await tweet_box.type(tweets[0], delay=15)

            # If thread, add subsequent tweets
            for tweet_text in tweets[1:]:
                add_tweet_btn = page.locator('[aria-label="Add Tweet"]').last
                await add_tweet_btn.click()
                await page.wait_for_timeout(500)
                new_box = page.locator('[aria-label="Tweet text"]').last
                await new_box.click()
                await new_box.type(tweet_text, delay=15)

            # Post
            tweet_all_btn = page.locator('[data-testid="tweetButton"]').last
            await tweet_all_btn.click()
            await page.wait_for_timeout(3000)

            print(f"[SUCCESS] Twitter thread posted ({len(tweets)} tweets)")
            return {"status": "success", "platform": "twitter", "tweet_count": len(tweets)}

        except Exception as e:
            print(f"[ERROR] Twitter post failed: {e}")
            await page.screenshot(path=f"errors/twitter_error_{int(asyncio.get_event_loop().time())}.png")
            return {"status": "error", "platform": "twitter", "error": str(e)}

        finally:
            await browser.close()
```

**Output:** `twitter_script`

---

### Phase 5: FACEBOOK SCRIPT

Key behaviors:
- Navigate to target group
- Click "Write something" / "Create Post"
- Fill content
- Submit to group

```python
# facebook_poster.py
import asyncio
from playwright.async_api import async_playwright

SESSION_PATH = "sessions/facebook_session.json"

async def post_to_facebook_group(content: dict, dry_run: bool = True, headless: bool = True):
    """
    content: {
        "group_url": str,   # Full URL of the Facebook group
        "body": str
    }
    """
    if dry_run:
        print(f"[DRY RUN] Facebook post to {content['group_url']}:")
        print(f"  Body: {content['body'][:100]}...")
        return {"status": "dry_run", "platform": "facebook"}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context(storage_state=SESSION_PATH)
        page = await context.new_page()

        try:
            await page.goto(content["group_url"], wait_until="networkidle")
            await page.wait_for_timeout(2000)

            write_btn = page.locator('[aria-label*="Write something"]').first
            await write_btn.click()
            await page.wait_for_timeout(1000)

            text_area = page.locator('[contenteditable="true"]').last
            await text_area.click()
            await text_area.type(content["body"], delay=15)
            await page.wait_for_timeout(1000)

            post_btn = page.locator('[aria-label="Post"]').last
            await post_btn.click()
            await page.wait_for_timeout(3000)

            print(f"[SUCCESS] Facebook post submitted")
            return {"status": "success", "platform": "facebook"}

        except Exception as e:
            print(f"[ERROR] Facebook post failed: {e}")
            return {"status": "error", "platform": "facebook", "error": str(e)}

        finally:
            await browser.close()
```

**Output:** `facebook_script`

---

### Phase 6: INSTAGRAM SCRIPT

Key behaviors:
- Instagram web posting is limited — use the mobile user agent approach
- For carousels: requires pre-rendered slide images
- Caption + hashtags posted in first comment (for cleaner look) or caption field

```python
# instagram_poster.py
import asyncio
from playwright.async_api import async_playwright

SESSION_PATH = "sessions/instagram_session.json"

MOBILE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
)

async def post_to_instagram(content: dict, dry_run: bool = True, headless: bool = True):
    """
    content: {
        "caption": str,
        "image_paths": list  # Local paths to images (1 for single, multiple for carousel)
    }
    """
    if dry_run:
        print(f"[DRY RUN] Instagram post:")
        print(f"  Caption: {content['caption'][:100]}...")
        print(f"  Images: {content.get('image_paths', [])}")
        return {"status": "dry_run", "platform": "instagram"}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context(
            storage_state=SESSION_PATH,
            user_agent=MOBILE_UA,
            viewport={"width": 390, "height": 844},
        )
        page = await context.new_page()

        try:
            await page.goto("https://www.instagram.com/", wait_until="networkidle")
            await page.wait_for_timeout(2000)

            # Click new post button
            new_post_btn = page.locator('[aria-label="New post"]').first
            await new_post_btn.click()
            await page.wait_for_timeout(1000)

            # Upload images
            file_input = page.locator('input[type="file"]').first
            for image_path in content.get("image_paths", []):
                await file_input.set_input_files(image_path)
                await page.wait_for_timeout(1500)

            # Click Next through crop/filter screens
            for _ in range(2):
                next_btn = page.locator('button:has-text("Next")').last
                await next_btn.click()
                await page.wait_for_timeout(1500)

            # Caption
            caption_area = page.locator('textarea[aria-label*="caption"], [aria-label*="Write a caption"]').first
            await caption_area.click()
            await caption_area.type(content["caption"], delay=10)
            await page.wait_for_timeout(1000)

            # Share
            share_btn = page.locator('button:has-text("Share")').last
            await share_btn.click()
            await page.wait_for_timeout(5000)

            print(f"[SUCCESS] Instagram post submitted")
            return {"status": "success", "platform": "instagram"}

        except Exception as e:
            print(f"[ERROR] Instagram post failed: {e}")
            return {"status": "error", "platform": "instagram", "error": str(e)}

        finally:
            await browser.close()
```

**Output:** `instagram_script`

---

### Phase 7: ORCHESTRATOR SCRIPT

The master script reads the content calendar JSON, checks what needs to post today, and dispatches to each platform poster at the right time.

```python
# orchestrator.py — Run daily via cron or Task Scheduler
# Reads content_calendar.json, posts what's scheduled for today

import asyncio
import json
import datetime
from pathlib import Path
from linkedin_poster import post_to_linkedin
from reddit_poster import post_to_reddit
from twitter_poster import post_thread_to_twitter
from facebook_poster import post_to_facebook_group
from instagram_poster import post_to_instagram

DRY_RUN = True  # Set to False when ready to go live
HEADLESS = True

POST_TIMES = {
    "linkedin":  "13:00",
    "reddit":    "15:00",
    "twitter":   "12:00",
    "facebook":  "14:00",
    "instagram": "11:00",
}

async def run_todays_posts():
    today_day = (datetime.date.today() - CAMPAIGN_START_DATE).days + 1
    calendar = json.loads(Path("content_calendar.json").read_text())
    content  = json.loads(Path("content_pack.json").read_text())
    results  = []

    todays_posts = [p for p in calendar if p["day"] == today_day]

    for post in todays_posts:
        platform = post["platform"]
        post_data = content[platform][post["content_ref"]]

        print(f"Posting to {platform} (Day {today_day})...")

        if platform == "linkedin":
            result = await post_to_linkedin(post_data, dry_run=DRY_RUN, headless=HEADLESS)
        elif platform == "reddit":
            result = await post_to_reddit(post_data, dry_run=DRY_RUN, headless=HEADLESS)
        elif platform == "twitter":
            result = await post_thread_to_twitter(post_data["tweets"], dry_run=DRY_RUN, headless=HEADLESS)
        elif platform == "facebook":
            result = await post_to_facebook_group(post_data, dry_run=DRY_RUN, headless=HEADLESS)
        elif platform == "instagram":
            result = await post_to_instagram(post_data, dry_run=DRY_RUN, headless=HEADLESS)

        results.append(result)
        await asyncio.sleep(30)  # Throttle between posts

    # Log results
    log_path = Path(f"logs/campaign_day_{today_day}.json")
    log_path.parent.mkdir(exist_ok=True)
    log_path.write_text(json.dumps(results, indent=2))
    print(f"Day {today_day} complete. Results: {results}")

if __name__ == "__main__":
    CAMPAIGN_START_DATE = datetime.date.fromisoformat(
        json.loads(Path("campaign_config.json").read_text())["start_date"]
    )
    asyncio.run(run_todays_posts())
```

**Output:** `orchestrator_script`

---

### Phase 8: REQUIREMENTS AND README

**requirements.txt:**
```
playwright>=1.40.0
asyncio
python-dateutil
```

**README structure:**
1. Prerequisites (Python 3.10+, Playwright install)
2. One-time setup: run `session_setup.py` for each platform
3. Content prep: confirm `content_pack.json` and `content_calendar.json` are in place
4. Dry run: `python orchestrator.py` with DRY_RUN=True — verify output
5. Go live: set DRY_RUN=False
6. Scheduling: add to cron (`0 10 * * * python /path/to/orchestrator.py`) or Windows Task Scheduler
7. Error handling: errors logged to `errors/` with screenshots
8. Session refresh: if a platform logs you out, rerun `session_setup.py --platform [name]`

**Output:** `requirements_txt`, `readme`

---

## Exit Criteria

Done when:
1. Session setup script generated — handles all 5 platforms
2. All 5 platform scripts generated — fully runnable with error handling and dry-run mode
3. Orchestrator script generated — reads calendar, dispatches, logs results
4. Requirements.txt complete
5. README covers setup through scheduling
6. All scripts use persistent sessions (no hardcoded credentials)
7. Dry run mode is default on all scripts

---

## Error Handling

| Error | Response |
|---|---|
| Session expired / logged out | Detect redirect to login page → pause → alert → wait for manual re-auth |
| CAPTCHA triggered | Detect CAPTCHA element → pause execution → alert user → resume on input |
| Rate limiting | Detect 429 or "too many requests" → back off 60 minutes → retry |
| Element not found | Take screenshot → log error → skip post → continue campaign |
| Network error | Retry 3x with 30s delay → if still failing, log and skip |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
