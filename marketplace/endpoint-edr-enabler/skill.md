# Endpoint Edr Enabler

Install and configure endpoint detection and response (EDR) software.

## Inputs

- `os-type`: Operating system
- `approved-applications`: EDR product to deploy

## Outputs

- `edr-status`: EDR installation and enrollment status
- `edr-config`: Applied EDR policy settings

## Process

1. Install the EDR agent and enroll with the management console
2. Configure the detection policy (prevention mode vs detect-only)
3. Verify the agent is reporting to the console
4. Test detection with a benign test sample (EICAR or equivalent)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
