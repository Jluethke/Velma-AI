# Endpoint Baseline Reporter

Produce the endpoint hardening baseline document with all applied settings.

## Inputs

- `os-type`: Operating system
- `edr-status`: EDR enrollment status

## Outputs

- `baseline-document`: Complete endpoint hardening baseline with all settings
- `compliance-checklist`: Checklist for verifying baseline compliance on other endpoints

## Process

1. Compile all configuration settings into the baseline document
2. Create a checklist for verifying each control on a new endpoint
3. Document any platform-specific variations
4. Produce the baseline document and compliance checklist

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
