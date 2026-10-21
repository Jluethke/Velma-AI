# Extension Ui Xss Test

Test extension popup, options page, and sidebar UI for cross-site scripting vulnerabilities.

## Inputs

- `extension-source`: Path to the unpacked extension source
- `dom-attack-surface`: DOM attack surface map from content script review

## Outputs

- `xss-findings`: XSS vulnerabilities found in extension UI components
- `ui-security-score`: Overall UI security posture score

## Process

1. Inject test payloads into all user-facing input fields in popup and options pages
2. Test for stored XSS through extension storage (chrome.storage, localStorage)
3. Check for reflected XSS through URL parameters passed to extension pages
4. Verify CSP enforcement on extension pages

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
