# Bump Technology Selection

Select bump type (solder ball, copper pillar, or gold stud) and pitch based on I/O density, electrical performance, and manufacturing capability.

## Inputs

- `io-count-and-pitch`: Required I/O count and minimum pitch from die design
- `current-per-bump`: Maximum current per bump for power and signal
- `manufacturing-capability`: Assembly house capability for bump pitch and type

## Outputs

- `bump-specification`: Bump type, dimensions (diameter, height, pitch), UBM stack, and solder alloy
- `bump-count-map`: Signal, power, ground, and thermal bump allocation across the die

## Process

1. C4 solder bumps: 75-200um pitch, solder composition SAC305 or high-Pb (97Pb3Sn for high-reliability). Diameter ~60-100um. Mature, low cost, but limited pitch below 100um due to bridging risk.
2. Copper pillar with solder cap: 40-130um pitch. Copper pillar height 20-50um, solder cap 10-25um (SnAg). Better electromigration resistance than C4, finer pitch capability, more uniform standoff height.
3. Micro-bump for 2.5D/3D: 25-55um pitch. Smaller solder volume, typically Cu pillar with thin SnAg cap (2-5um). Requires thermocompression bonding for fine pitch.
4. Calculate minimum pitch from I/O count and die size: pitch = sqrt(die_area / IO_count) if area array, or tighter calculation for peripheral-only bumping.
5. Allocate bumps: signal I/O at periphery or distributed, power and ground in core area. Typical power/ground allocation is 50-70% of total bumps for high-performance designs. Calculate current per power bump and verify it is below electromigration limit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
