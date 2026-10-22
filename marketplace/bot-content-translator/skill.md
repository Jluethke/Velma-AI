# Bot Content Translator

Translate and culturally adapt the bot content for each target language.

## Inputs

- `string-catalog`: Extracted string catalog with context
- `localization-plan`: Localization plan with cultural adaptation notes

## Outputs

- `translated-content`: Translated strings for each target language with cultural adaptations applied
- `translation-review-notes`: Reviewer notes on translations that need native speaker verification

## Process

1. Translate each string maintaining the original tone and intent.
2. Adapt culturally specific references (idioms, examples, humor, formality levels).
3. Adjust for text expansion or contraction (some languages are 30% longer than English).
4. Flag translations that need native speaker review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
