# Telemetry Verifier

Verify the device is sending data correctly to the platform.

## Inputs

- `provisioned-credentials`: The device credentials
- `device-record`: The registered device record

## Outputs

- `telemetry-status`: Confirmation that data is flowing correctly
- `data-sample`: A sample of the received telemetry data

## Process

1. Trigger a test data transmission from the device.
2. Confirm the data arrives at the platform with correct schema and timestamps.
3. Validate the data values are within expected ranges.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
