# Linux Ssh Hardener

Harden the SSH configuration to prevent unauthorized access.

## Inputs

- `benchmark-profile`: CIS benchmark with SSH requirements
- `baseline-scan`: Current SSH configuration state

## Outputs

- `ssh-config`: Updated sshd_config with hardened settings
- `ssh-change-log`: Record of each SSH setting change

## Process

1. Disable root login over SSH
2. Require public key authentication and disable password authentication
3. Set idle timeout and maximum authentication attempts
4. Restrict SSH access to specific users or groups
5. Disable X11 forwarding and agent forwarding unless required

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
