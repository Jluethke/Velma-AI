# Credential Harvesting Internal

Attempt to capture credentials through broadcast protocol poisoning and other authorized techniques.

## Inputs

- `broadcast-traffic-analysis`: Broadcast protocols in use on the network
- `internal-host-map`: Live hosts and services to target

## Outputs

- `captured-credentials`: Hashes and cleartext credentials obtained during testing
- `credential-source-log`: How and where each credential was obtained

## Process

1. Perform LLMNR and NBT-NS poisoning to capture authentication hashes
2. Attempt hash cracking against captured NTLMv2 hashes
3. Check for credentials in network shares, scripts, and configuration files
4. Test for Kerberoastable service accounts and crack their ticket hashes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
