# Voice Accessibility Auditor

Audit voice systems for accessibility compliance.

## Inputs

- `data-handling-audit`: Data handling audit results
- `pii-handling-findings`: PII handling findings

## Outputs

- `accessibility-audit`: Audit of voice system accessibility (hearing impaired alternatives, language support, cognitive load)
- `accessibility-gaps`: Gaps between current accessibility and legal or best-practice requirements

## Process

1. Check for TTY/TDD support for hearing-impaired callers.
2. Check for language support (IVR language selection, multilingual agents, translation services).
3. Evaluate the cognitive load of IVR menus (number of options, menu depth, speech rate).
4. Check for alternatives to voice interaction (callback, SMS, chat, email).
5. Document the accessibility gaps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
