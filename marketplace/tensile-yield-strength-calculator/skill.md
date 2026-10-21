# Tensile Yield Strength Calculator

Determine yield strength using the 0.2% offset method or other specified criteria.

## Inputs

- `stress-strain-curves`: Engineering stress vs engineering strain per specimen
- `yield-method`: Offset percentage (default 0.2%) or proportional limit criterion

## Outputs

- `yield-strengths`: Yield strength per specimen with the offset line coordinates
- `elastic-region-fit`: Linear fit parameters for the elastic portion of each curve

## Process

1. Identify the linear elastic region of each curve by maximum R-squared linear fit
2. Construct the offset line parallel to the elastic slope shifted by the specified strain offset
3. Find the intersection of the offset line with the stress-strain curve
4. Record the yield strength and flag any specimens with ambiguous or discontinuous yielding

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
