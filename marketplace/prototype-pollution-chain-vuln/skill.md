# Prototype Pollution Chain Vuln

Chain prototype pollution with other vulnerabilities including XSS and remote code execution.

## Inputs

- `client-pollution-results`: Client-side pollution results
- `server-pollution-results`: Server-side pollution results

## Outputs

- `chained-exploits`: Exploit chains built from pollution to higher impact
- `max-impact`: Maximum achievable impact through chaining

## Process

1. Attempt to chain server pollution to RCE through template engines
2. Chain client pollution to XSS through innerHTML or script gadgets
3. Assess the maximum impact achievable from each pollution vector

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
