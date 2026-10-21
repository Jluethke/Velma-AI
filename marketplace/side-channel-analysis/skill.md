# Side Channel Analysis

Analyze power consumption, electromagnetic emissions, or timing for side-channel information leakage.

## Inputs

- `device-under-test`: Physical device for side-channel measurement
- `overflow-findings`: Known vulnerabilities for targeted side-channel testing

## Outputs

- `side-channel-findings`: Side-channel leakage paths identified
- `key-extraction-feasibility`: Whether cryptographic keys can be extracted via side channels

## Process

1. Measure power consumption during cryptographic operations with an oscilloscope
2. Perform simple power analysis (SPA) and differential power analysis (DPA) on captured traces
3. Test for timing differences that leak information about key material or branching
4. Assess whether countermeasures (masking, constant-time code) are present

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
