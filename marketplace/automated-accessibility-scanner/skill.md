# Automated Accessibility Scanner

Run automated accessibility scans to catch machine-detectable issues.

## Inputs

- `site-url`: The website URL to audit
- `pages-to-test`: List of pages or page types to include in the audit

## Outputs

- `automated-findings`: Issues found by automated tools (missing alt text, contrast failures, missing labels)
- `scan-coverage`: What percentage of WCAG criteria the automated scan covers

## Process

1. Run an automated scanner (axe, WAVE, Lighthouse accessibility) on each page.
2. Categorize findings by WCAG criterion and severity (critical, serious, moderate, minor).
3. Note which criteria the automated scan cannot test (they require manual review).
4. De-duplicate findings across pages.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
