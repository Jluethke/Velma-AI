# Output Filtering Moderation Test

Test output filtering and content moderation for bypass techniques and policy violations.

## Inputs

- `application-endpoint`: URL or interface for the LLM application
- `extraction-findings`: Extraction findings for context

## Outputs

- `filter-bypass-findings`: Techniques that bypassed output filtering
- `moderation-gap-list`: Content categories not caught by moderation

## Process

1. Test for encoding-based filter bypass (base64, ROT13, Unicode homoglyphs)
2. Try role-play and fictional framing to elicit filtered content
3. Test whether the model can be made to produce content it should refuse
4. Check for inconsistency between languages (filter works in English but not others)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
