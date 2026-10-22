# Die To Die Interface Selection

Select the physical interface between chiplets based on bandwidth, latency, power, and integration technology constraints.

## Inputs

- `partition-candidates`: Chiplet partitions with function assignment
- `bandwidth-requirements`: Data rate requirements between chiplet pairs in GB/s
- `latency-budget`: Maximum allowable latency per hop in nanoseconds

## Outputs

- `interface-selection`: Selected PHY for each chiplet-to-chiplet link: UCIe, BoW, HBI, custom, or organic substrate trace
- `integration-technology`: Required integration method: silicon interposer, EMIB bridge, fan-out, organic substrate, or direct bonding

## Process

1. Map bandwidth requirements to interface options. UCIe standard: 32 GT/s per lane, 16 lanes per module = 32 GB/s per direction at advanced packaging pitch. Organic substrate: limited to ~10-20 GB/s aggregate by trace pitch and length.
2. Evaluate latency. On-interposer links add 1-2 ns. Organic substrate links add 5-10 ns. Direct bonding (hybrid Cu-Cu) adds sub-1 ns. Compare to budget.
3. Calculate power per bit for each option. UCIe advanced: ~0.25 pJ/bit. UCIe standard (organic): ~0.5 pJ/bit. Proprietary wide parallel bus on interposer: ~0.1 pJ/bit. Long organic trace: ~1-2 pJ/bit.
4. Select integration technology based on which interface is needed. Interposer or bridge required for bump pitches below 55um. Fan-out for moderate density without interposer cost. Organic substrate for relaxed pitch.
5. Verify that the selected integration technology supports all chiplet-to-chiplet links simultaneously. Check routing density limits on the interposer or bridge.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
