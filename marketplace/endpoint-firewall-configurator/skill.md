# Endpoint Firewall Configurator

Configure the host firewall to restrict inbound connections.

## Inputs

- `os-type`: Operating system
- `encryption-status`: Disk encryption verified

## Outputs

- `firewall-config`: Applied host firewall rules
- `firewall-test-results`: Verification that unauthorized connections are blocked

## Process

1. Enable the host firewall if not already active
2. Set the default inbound policy to block
3. Allow only required inbound services (if any)
4. Test that remote connections to non-allowed ports are rejected

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
