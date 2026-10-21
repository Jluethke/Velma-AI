# Voip Call Interception Test

Test for call interception vulnerabilities on authorized test lines.

## Inputs

- `voip-topology`: Network paths and media handling architecture
- `auth-weakness-findings`: Authentication weaknesses that could enable interception

## Outputs

- `interception-findings`: Call interception vulnerabilities and evidence from test calls
- `media-security-assessment`: RTP/SRTP configuration and encryption status

## Process

1. Capture RTP streams on the test network to check for unencrypted media
2. Test for ARP spoofing to redirect media streams on the local segment
3. Verify SRTP enforcement between endpoints
4. Test SRTP key exchange mechanisms (SDES, DTLS-SRTP, ZRTP) for weaknesses

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
