# Wpa2 Enterprise Attack Test

Test WPA2 Enterprise security including evil twin and EAP downgrade attacks.

## Inputs

- `wireless-survey-results`: Target enterprise SSIDs and their EAP configurations
- `wireless-scope`: Authorization for active wireless attacks

## Outputs

- `enterprise-wifi-findings`: WPA2 Enterprise vulnerabilities found
- `captured-eap-credentials`: Credentials captured during authorized testing

## Process

1. Set up an evil twin access point mimicking the authorized test SSID
2. Test for EAP type downgrade from PEAP/EAP-TLS to weaker methods
3. Capture and analyze EAP handshakes for credential extraction
4. Test client certificate validation enforcement

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
