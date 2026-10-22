# Transactional Content Writer

Write the content for each transactional email.

## Inputs

- `email-inventory`: The list of transactional emails to write
- `content-requirements`: Content requirements per email

## Outputs

- `email-content`: Written content for each transactional email (subject, preheader, body, CTA)
- `personalization-map`: Map of dynamic fields and merge tags for each email

## Process

1. Write the subject line and preheader for each email.
2. Write the body copy with clear action focus and minimal design.
3. Insert the merge tags for personalization.
4. Write the fallback content for missing data fields.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
