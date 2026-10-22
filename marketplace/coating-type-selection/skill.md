# Coating Type Selection

Select the conformal coating chemistry based on the protection requirements, process compatibility, and rework needs, understanding the trade-offs between coating types.

## Inputs

- `coating-performance-requirements`: Temperature, humidity, chemical resistance, and flexibility requirements
- `masking-map`: Keep-out zones

## Outputs

- `selected-coating`: Coating chemistry, specific product, application method, thickness specification, and cure process
- `coating-trade-off-rationale`: Why this coating was selected over alternatives, including the rework and repair implications

## Process

1. Compare coating chemistries:
- Acrylic (AR): easy to apply and remove (dissolves in solvent for rework), good moisture resistance, limited chemical resistance, operating range -65 to +125C. The default choice for most commercial electronics where rework is needed.
- Silicone (SR): widest temperature range (-65 to +200C), excellent flexibility (does not crack), good moisture resistance, very difficult to remove for rework (must be mechanically peeled). Used for high-temperature applications.
- Polyurethane (UR): excellent chemical and solvent resistance, good moisture protection, harder to remove than acrylic (requires specialized solvents or burn-through for rework). Used for chemical exposure environments.
- Epoxy (ER): hardest and most chemical-resistant, practically impossible to remove without damaging components. Used only where rework is not expected and maximum protection is needed.
- Parylene (XY): applied by chemical vapor deposition, perfectly uniform thickness even under components, excellent moisture barrier, cannot be selectively applied (entire board is coated, masking is difficult). Very thin (5-25 microns vs 25-75 for others). Expensive process.
2. Match the coating to the primary threat. Humidity only: acrylic is sufficient and the easiest to rework. Chemical exposure: polyurethane or epoxy. High temperature: silicone. Maximum protection with no rework: parylene. Automotive underhood: silicone (temperature) or polyurethane (chemicals + temperature).
3. Select the application method based on production volume and masking complexity. Spray: manual (low volume, complex masking) or automated selective (high volume, programmable path avoids keep-outs). Dip: uniform coverage, requires masking of all keep-outs (expensive). Brush: touch-up and repair only. CVD: parylene only, coats everything uniformly.
4. Specify the thickness. IPC-CC-830 recommends 25-75 microns for most coatings, 12.5-25 microns for parylene. Too thin provides inadequate protection. Too thick increases stress on components during thermal cycling, can bridge between closely spaced leads causing shorts, and wastes material.
5. Define the cure process. UV-curable coatings: cure in seconds under UV lamp, shadow areas need secondary moisture cure. Thermal cure: 10-60 minutes at 60-80C for most coatings. Room temperature cure: 24 hours for acrylics (ties up production space). Moisture cure: for some silicones and polyurethanes, takes 24-72 hours depending on humidity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
