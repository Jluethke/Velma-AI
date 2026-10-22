# Cookie Scanner

Scan a website to identify all cookies, trackers, and scripts that process user data.

## Inputs

- `website-url`: The URL of the website to scan
- `scan-scope`: Pages to scan (all, top-level, specific paths)

## Outputs

- `cookie-inventory`: List of all cookies found (name, domain, expiry, type, value pattern)
- `tracker-inventory`: List of all third-party trackers and scripts detected

## Process

1. Crawl the specified pages and record all cookies set (first-party and third-party).
2. Detect all third-party scripts, pixels, and trackers loaded on each page.
3. Record the cookie attributes (name, domain, path, expiry, secure flag, SameSite).
4. Identify any cookies set before the user interacts with the consent mechanism.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
