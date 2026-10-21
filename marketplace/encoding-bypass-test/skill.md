# Encoding Bypass Test

Test for WAF bypass through URL encoding, double encoding, and Unicode normalization.

## Inputs

- `waf-profile`: WAF product and configuration
- `block-behavior`: Block response pattern

## Outputs

- `encoding-bypass-results`: Encoding techniques that bypass WAF detection
- `normalization-gaps`: Unicode and encoding normalization gaps found

## Process

1. Test standard URL encoding, double URL encoding, and mixed encoding
2. Test Unicode normalization forms (NFC, NFD, NFKC, NFKD) for equivalent characters
3. Test overlong UTF-8 sequences and invalid encodings
4. Test HTML entity encoding and JavaScript Unicode escapes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
