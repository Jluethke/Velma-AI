# Dns Rebinding Sop Bypass Check

Check for same-origin policy bypasses achieved through DNS rebinding.

## Inputs

- `protection-assessment`: Assessment of DNS rebinding protections
- `bypass-techniques`: Techniques that bypassed protections

## Outputs

- `sop-bypass-findings`: Findings on same-origin policy bypasses
- `impact-assessment`: Impact assessment of each bypass

## Process

1. Test whether rebinding allows cross-origin data reads
2. Check for cookie and credential exposure through rebinding
3. Assess the severity of each SOP bypass found

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
