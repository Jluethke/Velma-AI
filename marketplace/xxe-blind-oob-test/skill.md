# Xxe Blind Oob Test

Test for blind XXE through out-of-band channels when direct data return is not possible.

## Inputs

- `file-read-results`: File reading results
- `xml-endpoints`: XML endpoints

## Outputs

- `oob-results`: Out-of-band XXE test results
- `exfiltrated-data`: Data exfiltrated through OOB channels

## Process

1. Set up an external server to receive OOB callbacks
2. Inject parameter entities that exfiltrate data via HTTP or DNS
3. Use error-based extraction as an alternative to HTTP-based OOB

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
