# Iot Service Lockdown

Disable unused ports and services on IoT devices.

## Inputs

- `encryption-config`: Encryption configuration
- `auth-config`: Authentication configuration

## Outputs

- `lockdown-checklist`: Checklist of services disabled and ports closed per device
- `hardening-report`: Complete security hardening report

## Process

1. Scan each device for open ports and running services.
2. Disable services not required for the device's function (telnet, FTP, UPnP, debug interfaces).
3. Close unnecessary ports and change default credentials.
4. Compile the hardening report with before/after state for each device.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
