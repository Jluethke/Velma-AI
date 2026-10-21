# Wireless Encryption Testing

Test the encryption strength of wireless networks including WPA2/WPA3 configuration and known protocol weaknesses.

## Inputs

- `access-point-inventory`: Detected access points and their encryption types
- `authorized-ssids`: Organization-owned SSIDs

## Outputs

- `encryption-findings`: Encryption weaknesses and misconfigurations found
- `protocol-analysis`: Analysis of wireless protocol security per network

## Process

1. Identify networks using deprecated protocols (WEP, WPA-TKIP).
2. Check WPA2 networks for PMKID vulnerability and known key reinstallation attacks.
3. Verify WPA3 networks for proper SAE implementation.
4. Test for downgrade attacks from WPA3 to WPA2 on transition-mode networks.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
