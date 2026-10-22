# Device Encryption Enabler

Enable encrypted communication for IoT devices.

## Inputs

- `segmentation-config`: Network segmentation configuration
- `update-recommendations`: Firmware updates

## Outputs

- `encryption-config`: TLS/DTLS configuration for each device class
- `auth-config`: Device authentication configuration (certificates, tokens)

## Process

1. Enable TLS or DTLS on all device-to-platform communication.
2. Deploy certificates or rotate tokens for device authentication.
3. Verify encrypted connections are working and unencrypted fallback is disabled.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
