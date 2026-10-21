# Dns Query Logger

Enable DNS query logging for security monitoring and forensics.

## Inputs

- `dns-software`: DNS server software
- `recursion-config`: Recursion settings already applied

## Outputs

- `query-log-config`: Applied query logging configuration
- `log-verification`: Verification that queries are being logged

## Process

1. Enable query logging in the DNS server configuration
2. Configure log rotation and retention to manage disk usage
3. Forward logs to the central SIEM or log management system
4. Verify that test queries appear in the log output

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
