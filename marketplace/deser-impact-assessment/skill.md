# Deser Impact Assessment

Assess the full impact of confirmed deserialization vulnerabilities.

## Inputs

- `gadget-chain-results`: Successful gadget chain results
- `hidden-endpoint-findings`: Hidden deserialization endpoints

## Outputs

- `impact-assessment`: Full impact analysis of each deserialization vulnerability
- `exploitation-chain`: Complete exploitation chain from input to code execution

## Process

1. Map each vulnerability to its maximum impact (RCE, file read, SSRF, DoS)
2. Determine the execution context (user, service account, root/SYSTEM)
3. Assess network position and lateral movement potential from the execution context
4. Document the full exploitation chain with prerequisites and reliability

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
