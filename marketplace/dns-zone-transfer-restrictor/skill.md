# Dns Zone Transfer Restrictor

Restrict DNS zone transfers to authorized secondary servers only.

## Inputs

- `dns-software`: DNS server software
- `secondary-servers`: IP addresses of authorized secondary DNS servers

## Outputs

- `zone-transfer-config`: Applied zone transfer restrictions
- `transfer-test-results`: Verification that unauthorized transfers are denied

## Process

1. Configure allow-transfer to list only authorized secondary server IPs
2. Use TSIG keys for zone transfer authentication between servers
3. Test that zone transfer succeeds from an authorized server
4. Test that zone transfer is denied from an unauthorized IP

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
