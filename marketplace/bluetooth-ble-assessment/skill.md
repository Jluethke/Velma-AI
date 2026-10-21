# Bluetooth Ble Assessment

Assess Bluetooth and BLE device security in the authorized scope.

## Inputs

- `wireless-scope`: Bluetooth/BLE devices and areas authorized for testing
- `rf-environment-map`: RF environment context

## Outputs

- `bluetooth-findings`: Bluetooth and BLE security vulnerabilities found
- `ble-device-inventory`: Discovered BLE devices with services and characteristics

## Process

1. Scan for discoverable Bluetooth classic and BLE devices
2. Enumerate BLE services and characteristics for unauthorized read/write access
3. Test for BLE pairing weaknesses (Just Works, legacy pairing)
4. Check for sensitive data exposed through BLE GATT services

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
