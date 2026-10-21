# Wireless Auth Attack Testing

Test wireless authentication mechanisms on authorized test networks using dictionary and brute force techniques.

## Inputs

- `encryption-findings`: Known encryption weaknesses
- `access-point-inventory`: Access points to test

## Outputs

- `auth-attack-results`: Results of authentication attack attempts
- `weak-credentials`: Any weak or default credentials discovered

## Process

1. Capture the WPA handshake or PMKID from the authorized test network.
2. Run dictionary attacks using common password lists against the captured material.
3. Test for WPS PIN brute force on any access points with WPS enabled.
4. Check enterprise networks (802.1X) for certificate validation and EAP downgrade attacks.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
