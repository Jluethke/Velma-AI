# Payload Mutation Test

Test for WAF rule set gaps using systematic payload mutation and obfuscation.

## Inputs

- `encoding-bypass-results`: Working encoding bypasses
- `content-type-bypass-results`: Content type bypass results

## Outputs

- `mutation-bypass-results`: Payload mutations that evade WAF rules
- `rule-gap-catalog`: Catalog of WAF rule gaps by attack category

## Process

1. Mutate SQL injection payloads using comments, case alternation, and function aliases
2. Mutate XSS payloads using event handler variations, SVG, and MathML vectors
3. Test command injection with variable expansion, backticks, and shell alternates
4. Combine multiple bypass techniques (encoding + content type + mutation)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
