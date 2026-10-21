# Email Attachment Filter Test

Test email gateway filtering for dangerous attachments and malicious links.

## Inputs

- `email-system-info`: Email gateway and filtering system details
- `spoofing-results`: Spoofing test results for context

## Outputs

- `filter-bypass-findings`: Attachment types and link patterns that bypass filtering
- `filter-coverage-assessment`: Assessment of content filtering breadth and depth

## Process

1. Send test attachments with various executable formats and archive types
2. Test password-protected archives and nested container formats
3. Send messages with obfuscated malicious URLs (URL shorteners, redirects, encoding)
4. Test macro-enabled document handling and sandboxing

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
