# Protocol Encryption Scan

Identify unencrypted protocols carrying sensitive data.

## Inputs

- `pcap-files`: Captured network traffic

## Outputs

- `cleartext-findings`: Instances of sensitive data in unencrypted protocols
- `protocol-inventory`: All protocols observed with encryption status

## Process

1. Parse traffic for protocol identification
2. Flag unencrypted protocols: HTTP, FTP, Telnet, SMTP without TLS, LDAP without TLS
3. Search for sensitive patterns in cleartext: credentials, PII, API keys
4. Inventory all observed protocols and their encryption status

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
