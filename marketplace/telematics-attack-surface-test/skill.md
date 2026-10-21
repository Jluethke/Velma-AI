# Telematics Attack Surface Test

Assess the telematics control unit attack surface including cellular, WiFi, and Bluetooth interfaces.

## Inputs

- `authorization-scope`: Scope defining telematics test boundaries
- `can-message-catalog`: CAN messages sent by the telematics unit

## Outputs

- `telematics-findings`: Telematics unit attack surface findings
- `remote-access-paths`: Remote access paths to vehicle systems through telematics

## Process

1. Enumerate wireless interfaces (cellular, WiFi, Bluetooth) and their configurations
2. Test for open ports and services on the telematics unit network interface
3. Check for plaintext communication between telematics and backend servers
4. Assess whether telematics has write access to safety-critical CAN buses

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
