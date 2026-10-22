# Robots Sitemap Auditor

Audit the robots.txt and sitemap configuration.

## Inputs

- `crawl-report`: Full crawl results
- `site-url`: The site URL

## Outputs

- `robots-findings`: Issues in robots.txt (blocking important pages, missing directives)
- `sitemap-findings`: Sitemap issues (missing pages, incorrect URLs, stale entries)

## Process

1. Check robots.txt for rules that block important pages or resources.
2. Verify the sitemap includes all indexable pages and excludes non-indexable ones.
3. Cross-reference the sitemap against the crawl report for missing or extra URLs.
4. Check sitemap format, size limits, and last-modified dates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
