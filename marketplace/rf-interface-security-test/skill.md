# Rf Interface Security Test

Test radio frequency interfaces (Bluetooth, Zigbee, LoRa, Wi-Fi, cellular) for pairing abuse, replay, and injection.

## Inputs

- `device-under-test`: Physical device with wireless interfaces
- `device-documentation`: Documentation of supported wireless protocols

## Outputs

- `rf-findings`: Wireless interface vulnerabilities found
- `rf-attack-surface-map`: Map of wireless protocols and their exposure

## Process

1. Enumerate active wireless interfaces and their configurations
2. Test Bluetooth pairing for PIN bypass, MITM, and unauthorized reconnection
3. Capture and replay wireless packets to test for replay attack resistance
4. Test for command injection through wireless protocol payloads

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
