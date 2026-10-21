# Dkim Signing Verification

Test DKIM signing coverage and key strength for all sending sources.

## Inputs

- `target-domain`: Email domain to assess
- `authorized-senders`: Authorized sending services from SPF analysis

## Outputs

- `dkim-analysis`: DKIM selector coverage, key sizes, and signing practices
- `unsigned-sources`: Sending sources that do not DKIM-sign their messages

## Process

1. Discover DKIM selectors through DNS enumeration and email header analysis
2. Check key sizes (RSA 1024-bit minimum, 2048-bit recommended)
3. Verify that all authorized sending sources sign with DKIM
4. Test for DKIM signature replay and header manipulation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
