# Extension Storage Channel Test

Test storage mechanisms and communication channels for data leakage and tampering.

## Inputs

- `extension-source`: Path to the unpacked extension source
- `message-handler-findings`: Message handler vulnerabilities

## Outputs

- `storage-findings`: Storage and channel security issues
- `data-exposure-inventory`: Sensitive data exposed through storage or channels

## Process

1. Enumerate all data stored in chrome.storage.local, chrome.storage.sync, and localStorage
2. Check for sensitive data (tokens, passwords, PII) stored without encryption
3. Test external messaging (chrome.runtime.sendMessage from web pages) for abuse
4. Check for native messaging host vulnerabilities

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
