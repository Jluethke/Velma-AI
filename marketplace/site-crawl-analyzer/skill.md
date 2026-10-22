# Site Crawl Analyzer

Crawl the site to identify indexation issues, crawl errors, and orphan pages.

## Inputs

- `site-url`: The website URL to audit
- `audit-scope`: Which sections or subdomains to include

## Outputs

- `crawl-report`: All pages found with status codes, canonical tags, and index directives
- `crawl-issues`: Errors, warnings, and orphan pages identified

## Process

1. Crawl the site following internal links from the homepage.
2. Record each page's HTTP status, canonical tag, robots directive, and title.
3. Identify crawl errors (4xx, 5xx), redirect chains, and duplicate content.
4. Flag orphan pages (not linked from any other page).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
