# Container Secret Scan

Test for secrets accessible from within the container environment.

## Inputs

- `target-container`: Container to inspect
- `mount-findings`: Known mount points

## Outputs

- `secret-findings`: Secrets found in the container environment
- `secret-sources`: Where each secret was found: env vars, files, mounts, metadata

## Process

1. Search environment variables for credentials and API keys
2. Scan mounted volumes and config files for secrets
3. Query cloud metadata endpoints for instance credentials

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
