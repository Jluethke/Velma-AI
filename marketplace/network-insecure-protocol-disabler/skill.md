# Network Insecure Protocol Disabler

Disable insecure management protocols and replace with secure alternatives.

## Inputs

- `device-inventory`: Network devices to harden
- `syslog-config`: Logging configuration to capture protocol changes

## Outputs

- `protocol-changes`: Record of protocols disabled and their replacements
- `secure-protocol-config`: Configuration of the secure alternatives

## Process

1. Disable Telnet and enable SSH for CLI access
2. Disable HTTP management and enable HTTPS with a valid certificate
3. Disable TFTP for config transfers and use SCP or SFTP
4. Verify that insecure protocols no longer respond

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
