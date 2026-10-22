# Structured Data Auditor

Review structured data and schema markup for correctness and coverage.

## Inputs

- `mobile-findings`: Mobile audit results
- `crawl-report`: All pages for schema check

## Outputs

- `schema-findings`: Structured data errors, warnings, and missing markup
- `seo-technical-report`: Complete technical SEO audit report with all findings prioritized

## Process

1. Validate existing structured data for syntax errors.
2. Check that schema types match the page content (Article, Product, FAQ, LocalBusiness).
3. Identify pages that should have structured data but do not.
4. Compile all findings into the final technical SEO report, prioritized by impact.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
