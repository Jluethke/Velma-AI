# Http Parameter Pollution Test

Test for WAF bypass through HTTP parameter pollution and duplicate parameters.

## Inputs

- `waf-profile`: WAF product and configuration
- `encoding-bypass-results`: Encoding bypass results

## Outputs

- `hpp-bypass-results`: Parameter pollution techniques that bypass the WAF
- `parameter-precedence-map`: Which duplicate parameter the WAF vs application uses

## Process

1. Send duplicate parameters with the payload split across both values
2. Test parameter precedence differences between WAF and backend (first vs last wins)
3. Test array notation and bracket syntax for parameter handling differences
4. Test parameter name case sensitivity mismatches between WAF and application

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
