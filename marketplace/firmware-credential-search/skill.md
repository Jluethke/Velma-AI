# Firmware Credential Search

Search the extracted firmware for hardcoded credentials, private keys, certificates, and API tokens.

## Inputs

- `extracted-filesystem`: Extracted firmware filesystem
- `firmware-metadata`: Firmware metadata for context

## Outputs

- `credential-findings`: Hardcoded credentials and keys found in the firmware
- `crypto-material-inventory`: Certificates, keys, and crypto assets found

## Process

1. Search for common credential patterns (passwords, API keys, tokens) in all files
2. Extract and analyze /etc/passwd, /etc/shadow, and similar credential stores
3. Scan for private keys (.pem, .key) and certificates (.crt, .cer)
4. Check for default or vendor backdoor accounts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
