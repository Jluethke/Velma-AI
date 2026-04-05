# Social Automation Example: Post a Tweet via Playwright

## Setup
```python
from playwright.sync_api import sync_playwright

pw = sync_playwright().start()
browser = pw.chromium.launch_persistent_context(
    user_data_dir=edge_profile,
    channel="msedge",
    headless=False,
    args=["--disable-blink-features=AutomationControlled"],
    slow_mo=200,
)
page = browser.pages[0] if browser.pages else browser.new_page()
```

## Post a Tweet
```python
page.goto("https://x.com/compose/post", wait_until="domcontentloaded")
# Remove overlays that block interaction
page.evaluate('document.querySelectorAll("[data-testid=\\"twc-cc-mask\\"]").forEach(e=>e.remove())')
# Find compose box and type
compose = page.wait_for_selector('[data-testid="tweetTextarea_0"]', timeout=10000)
compose.click(force=True)
page.keyboard.type("Hello from automation!", delay=20)
page.keyboard.press("Control+Enter")  # Submit via keyboard shortcut
```

## Key Points
- Always use `headless=False` -- X detects and blocks headless browsers
- Use `keyboard.type()` with delay, not `page.fill()` -- contenteditable divs need it
- `Ctrl+Enter` is more reliable than clicking the post button
