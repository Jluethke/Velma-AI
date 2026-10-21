# Content Type Switching Test

Test for WAF bypass through content type switching between JSON, XML, and form data.

## Inputs

- `waf-profile`: WAF configuration and rule sets
- `chunked-bypass-results`: Chunked encoding bypass results

## Outputs

- `content-type-bypass-results`: Content type switches that bypass WAF inspection
- `parser-differential-findings`: Parser differences between WAF and application

## Process

1. Switch payloads between application/json, application/xml, and application/x-www-form-urlencoded
2. Test with multipart/form-data boundaries and file upload wrappers
3. Check for content type mismatch handling (declared vs actual)
4. Test with exotic content types that the WAF may not inspect

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
