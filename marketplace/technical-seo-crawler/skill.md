# Technical Seo Crawler

Crawl the site for technical SEO issues: broken links, crawl errors, page speed, and indexing problems.

## Inputs

- `site-url`: URL of the site to audit
- `crawl-config`: Crawl depth, user agent, and exclusion rules

## Outputs

- `technical-issues`: List of technical SEO problems with severity
- `crawl-summary`: Pages crawled, response codes, and speed metrics

## Process

1. Crawl the site and record response codes for each URL
2. Check page speed scores and Core Web Vitals
3. Identify broken links, redirect chains, and orphan pages

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
