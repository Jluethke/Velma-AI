# Screen Reader Tester

Test with a screen reader to verify content is announced correctly.

## Inputs

- `keyboard-findings`: Keyboard test results
- `site-url`: The site URL

## Outputs

- `screen-reader-findings`: Issues with how content is announced (missing labels, incorrect reading order, unlabeled images)
- `aria-issues`: Incorrect or missing ARIA attributes

## Process

1. Navigate each page with a screen reader (NVDA, VoiceOver, or JAWS).
2. Verify that headings, landmarks, and page structure are announced correctly.
3. Check that images have meaningful alt text and decorative images are hidden.
4. Test forms to verify labels, error messages, and instructions are announced.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
