# Cms Redirect Configurator

Configure redirects from old URLs to new URLs and verify they resolve.

## Inputs

- `imported-url-map`: Old URL to new URL mapping
- `import-report`: Import summary for reference

## Outputs

- `redirect-rules`: All 301 redirect rules configured and tested
- `migration-checklist`: Final checklist confirming all content migrated and redirects active

## Process

1. Create 301 redirect rules for every changed URL.
2. Test a sample of redirects to verify they resolve correctly.
3. Check for redirect chains or loops and fix them.
4. Produce the final migration checklist with sign-off items.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
