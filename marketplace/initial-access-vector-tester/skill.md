# Initial Access Vector Tester

Test common ransomware initial access vectors (phishing, RDP, VPN).

## Inputs

- `critical-systems-list`: Systems in scope
- `network-architecture`: Network design and external-facing services

## Outputs

- `initial-access-results`: Test results for each initial access vector
- `exposed-services-inventory`: Internet-exposed services and their patch status

## Process

1. Test email gateway filtering of common ransomware delivery methods (malicious macros, ISO attachments, HTML smuggling)
2. Check for internet-exposed RDP, SMB, and other management protocols
3. Test VPN and remote access for default credentials and known vulnerabilities
4. Verify patch status of internet-facing services

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
