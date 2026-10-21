# Email Relay Disabler

Disable open relay and restrict mail relay to authorized users and networks.

## Inputs

- `mail-server-ip`: Authorized server addresses
- `tls-config`: TLS settings already configured

## Outputs

- `relay-config`: Applied relay restriction settings
- `relay-test-results`: Results of open relay testing from external sources

## Process

1. Configure the mail server to reject relay from unauthenticated sources
2. Set the mynetworks or equivalent to include only trusted subnets
3. Require SMTP authentication for outbound relay
4. Test for open relay from an external IP address

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
