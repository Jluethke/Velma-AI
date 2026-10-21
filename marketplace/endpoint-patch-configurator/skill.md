# Endpoint Patch Configurator

Configure automatic patching for the operating system and applications.

## Inputs

- `os-type`: Operating system
- `whitelist-config`: Application control already configured

## Outputs

- `patch-config`: Applied automatic update settings
- `patch-status`: Current patch compliance status

## Process

1. Configure Windows Update, Software Update, or unattended-upgrades
2. Set a maintenance window for automatic restarts if required
3. Check current patch compliance
4. Configure third-party application patching if applicable

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
