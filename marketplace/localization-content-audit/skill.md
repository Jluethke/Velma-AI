# Localization Content Audit

Identify and extract the content to localize.

## Inputs

- `source-content`: The original content to localize (UI strings, marketing copy, documentation)
- `target-locales`: The markets and languages to localize for

## Outputs

- `content-inventory`: All localizable strings and assets with their context
- `localization-scope`: Total word count, asset count, and estimated effort per locale

## Process

1. Walk through the source content and extract every user-facing string.
2. Tag each string with context (where it appears, character limits, tone requirements).
3. Identify non-text assets that need localization (images with text, videos, PDFs).
4. Calculate the scope per locale and produce the content inventory.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
