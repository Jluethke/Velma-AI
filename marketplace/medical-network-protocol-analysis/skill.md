# Medical Network Protocol Analysis

Analyze medical device network interfaces and protocols including HL7, DICOM, and FHIR endpoints.

## Inputs

- `device-specifications`: Device model, firmware version, and network configuration
- `authorization-scope`: Written scope of the authorized test
- `network-capture-config`: Network tap or span port configuration

## Outputs

- `protocol-inventory`: All network protocols and endpoints in use
- `traffic-analysis`: Captured and analyzed network traffic patterns

## Process

1. Capture network traffic from the device across all interfaces
2. Identify HL7, DICOM, FHIR, and proprietary protocol communications
3. Map all endpoints the device communicates with and their purposes
4. Check for protocol version compliance and deprecated cipher usage

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
