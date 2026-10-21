# Telemetry Encryption Test

Check encryption and integrity protection of telemetry data on the downlink.

## Inputs

- `link-inventory`: Downlink parameters and telemetry protocols
- `protocol-analysis`: Telemetry protocol structure

## Outputs

- `telemetry-encryption-findings`: Telemetry encryption and integrity findings
- `data-exposure-assessment`: Assessment of sensitive data exposure in telemetry

## Process

1. Check whether telemetry data is encrypted on the downlink
2. Test integrity protection of telemetry frames
3. Assess whether operational parameters can be derived from unencrypted telemetry
4. Check for sensitive payload data exposure in housekeeping telemetry

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
