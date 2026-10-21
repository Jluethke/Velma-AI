# Encrypted Channel Detection Tester

Test whether DLP controls can inspect or flag encrypted exfiltration channels.

## Inputs

- `test-data-set`: Synthetic test data
- `network-test-results`: Results from network exfiltration tests

## Outputs

- `encryption-test-results`: Pass/fail for detection of encrypted exfiltration
- `ssl-inspection-gaps`: Encrypted channels that bypass inspection

## Process

1. Test exfiltration over TLS to non-standard ports
2. Test exfiltration through certificate-pinned applications that resist inspection
3. Test steganographic embedding in images or documents sent through approved channels
4. Identify which encrypted channels are inspected and which bypass DLP

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
