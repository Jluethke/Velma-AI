# Certificate Pinning Test

Test the application's certificate pinning implementation for bypass vulnerabilities.

## Inputs

- `traffic-findings`: Network traffic analysis results
- `platform`: Target platform

## Outputs

- `pinning-findings`: Certificate pinning bypass results
- `pinning-implementation-notes`: Details of the pinning implementation and its strength

## Process

1. Attempt to intercept traffic using a custom CA certificate.
2. If pinning is present, attempt bypass using common techniques (Frida, SSL Kill Switch).
3. Verify whether pinning covers all network connections or only some endpoints.
4. Check for pinning on both the leaf certificate and the intermediate/root chain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
