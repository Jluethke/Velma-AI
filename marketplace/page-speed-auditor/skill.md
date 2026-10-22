# Page Speed Auditor

Audit page speed and Core Web Vitals across key pages.

## Inputs

- `crawl-report`: Pages to test
- `site-url`: The site URL

## Outputs

- `speed-report`: Page speed scores and Core Web Vitals for each tested page
- `speed-fixes`: Prioritized list of speed improvements

## Process

1. Test the top pages (by traffic or importance) for load speed.
2. Measure Core Web Vitals: Largest Contentful Paint, Interaction to Next Paint, Cumulative Layout Shift.
3. Identify the largest contributors to slow load times (images, scripts, fonts, server response).
4. Prioritize fixes by impact.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
