# Skimming Resilience Test

Test the terminal's resilience to skimming attacks on card reader and PIN pad components.

## Inputs

- `terminal-specifications`: Terminal physical design and card reader type
- `authorization-scope`: Physical access boundaries for testing

## Outputs

- `skimming-findings`: Physical and electronic skimming vulnerability findings
- `anti-tamper-assessment`: Assessment of anti-skimming protections

## Process

1. Inspect card reader slot for space allowing overlay devices
2. Test for magnetic stripe data exposure during card swipe
3. Check EMV chip communication for relay attack feasibility
4. Assess NFC contactless reader isolation and transaction limits

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
