# Content Script Injection Test

Review content script injection points and test for DOM manipulation vulnerabilities on target pages.

## Inputs

- `extension-source`: Path to the unpacked extension source
- `permission-inventory`: Permission inventory from manifest review

## Outputs

- `injection-findings`: List of content script injection vulnerabilities
- `dom-attack-surface`: Map of DOM elements the extension modifies

## Process

1. Identify all content scripts and their match patterns
2. Trace DOM reads and writes for unsanitized user data
3. Test for innerHTML, document.write, and eval usage with attacker-controlled input
4. Check for prototype pollution through content script modifications

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
