# Network Exfiltration Tester

Test network-based exfiltration channels including HTTP, DNS, and ICMP tunneling.

## Inputs

- `test-data-set`: Synthetic test data
- `classification-matrix`: Expected controls per data type

## Outputs

- `network-test-results`: Pass/fail for each network exfiltration channel tested
- `network-detection-times`: Time from exfiltration attempt to alert for each test

## Process

1. Test HTTP/HTTPS exfiltration to external endpoints (direct upload, webmail, paste sites)
2. Test DNS tunneling by encoding data in DNS queries to a controlled domain
3. Test ICMP tunneling and other protocol covert channels
4. Record whether each attempt was blocked, alerted, or passed undetected

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
