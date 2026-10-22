# Production Formatter

Format and produce responsive documents to the requesting party.

## Inputs

- `review-results`: Tagged documents ready for production
- `privilege-log`: Privilege log to accompany the production

## Outputs

- `production-set`: Final production set with Bates numbers and load file
- `production-record`: Record of the production (date, volume, format, delivery method)

## Process

1. Apply Bates numbering to all responsive documents.
2. Redact any partially privileged documents.
3. Generate the production in the agreed format (native, TIFF, PDF) with the load file.
4. Deliver the production and produce the production record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
