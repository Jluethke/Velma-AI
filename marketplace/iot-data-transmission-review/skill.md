# Iot Data Transmission Review

Review data transmitted and stored by the device for privacy and security concerns.

## Inputs

- `network-findings`: Network protocol and service findings
- `credential-findings`: Credential and authentication findings

## Outputs

- `data-findings`: Data privacy and security issues in transmission and storage
- `data-flow-map`: Map of what data leaves the device, where it goes, and how it is protected

## Process

1. Capture and analyze network traffic to identify data being transmitted
2. Check whether sensitive data (credentials, personal information, telemetry) is encrypted in transit
3. Test cloud API endpoints that receive device data for authorization controls
4. Review on-device data storage for encryption and access controls

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
