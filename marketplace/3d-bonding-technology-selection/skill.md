# 3D Bonding Technology Selection

Select the bonding method for 3D die stacking based on interconnect density, thermal, and manufacturing requirements.

## Inputs

- `vertical-io-count`: Number of vertical connections required between tiers
- `pitch-requirement`: Minimum bond pitch needed for the design
- `thermal-budget`: Maximum temperature the bottom die can tolerate during top die bonding

## Outputs

- `bonding-method`: Selected method: micro-bump, hybrid Cu-Cu bonding, or oxide bonding with rationale
- `vertical-pitch`: Achievable bond pitch and resulting vertical interconnect density

## Process

1. Micro-bump (solder): pitch 40-55um achievable in production. Compatible with existing flip-chip infrastructure. Reflow temperature 250-260C. Limited density (roughly 400-600 connections per mm2).
2. Hybrid bonding (Cu-Cu with oxide): pitch 1-10um in production (TSMC SoIC achieves 9um, research below 1um). Density: 10,000 to 1,000,000 connections per mm2. Requires extremely flat surfaces (CMP, < 0.5nm RMS roughness).
3. Oxide bonding: for connections that only need structural bonding, not electrical. Used with TSVs for electrical connection at wider pitch. Lower cost than hybrid bonding.
4. Select based on required density. If vertical I/O count / die area > 500/mm2, hybrid bonding is required. If lower density is sufficient, micro-bump is cheaper and more mature.
5. Verify thermal compatibility: bottom die must survive the bonding temperature of the top die. Hybrid bonding can be done at lower temperature (room temperature for initial bond, 200-300C anneal) vs micro-bump reflow at 250C.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
