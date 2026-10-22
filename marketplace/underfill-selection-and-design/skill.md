# Underfill Selection And Design

Select underfill material and process to distribute stress from CTE mismatch and protect solder joints.

## Inputs

- `bump-specification`: Bump type, dimensions, and pitch
- `die-substrate-combination`: Die size, substrate material, and CTE difference

## Outputs

- `underfill-specification`: Underfill type, material properties (CTE, Tg, modulus, filler content), and process parameters
- `stress-analysis`: Predicted solder joint stress reduction from underfill and remaining stress at corners

## Process

1. Calculate the CTE mismatch stress without underfill. Critical parameter is DNP (distance from neutral point) x delta_CTE x delta_T. Corner bumps see the highest strain. Without underfill, large dies (> 10mm) on organic substrates fail within 100-500 thermal cycles.
2. Select underfill type. Capillary underfill: dispensed at die edge, flows by capillary action. Requires gap height and bump pitch that allow flow. Non-conductive paste (NCP): pre-applied on substrate, die is placed into it, compressed during thermocompression bonding.
3. Choose material properties. CTE should be between silicon (2.6 ppm/C) and substrate (15-17 ppm/C) to redistribute stress. High filler content (70-80% silica by weight) reduces CTE to 20-30 ppm/C. Tg should be above the use temperature.
4. Simulate solder joint stress with underfill. FEA with temperature cycling load. Verify that the maximum inelastic strain energy density at the corner bump is within the fatigue life requirement (Darveaux or Syed model).
5. Define process parameters: dispense pattern, flow time, cure profile (temperature ramp, hold time, cool rate). Verify void-free fill by cross-section and SAM inspection of qualification units.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
