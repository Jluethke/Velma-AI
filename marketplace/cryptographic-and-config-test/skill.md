# Cryptographic And Config Test

Test for cryptographic failures, security misconfigurations, and vulnerable components.

## Inputs

- `technology-stack`: Identified technologies and versions
- `application-map`: Application endpoints and data flows

## Outputs

- `crypto-config-findings`: Cryptographic weaknesses and misconfigurations found
- `vulnerable-components`: Third-party components with known vulnerabilities

## Process

1. Test TLS configuration for weak ciphers, protocol versions, and certificate issues
2. Check for sensitive data transmitted or stored without encryption
3. Identify third-party libraries and frameworks with known CVEs
4. Test for security misconfigurations (default credentials, verbose errors, directory listing)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
