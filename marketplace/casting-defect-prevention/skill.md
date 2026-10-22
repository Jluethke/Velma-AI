# Casting Defect Prevention

Predict and prevent casting defects through melt practice control, mold design adjustments, and solidification simulation verification.

## Inputs

- `gating-system`: Designed gating system to evaluate for fill-related defects
- `riser-design`: Risering system to evaluate for solidification-related defects

## Outputs

- `defect-risk-assessment`: Predicted defect types and locations (shrinkage porosity, gas porosity, hot tears, misruns, inclusions, cold shuts) with risk level and mitigation
- `verified-design`: Gating and risering design validated by solidification simulation showing directional solidification, no isolated hot spots, and adequate feeding

## Process

1. Run solidification simulation (e.g., MAGMASOFT, ProCAST, SOLIDCast) to predict: fill pattern (verify no cold shuts or misruns), solidification sequence (verify directional solidification toward risers), shrinkage porosity location (Niyama criterion: G/sqrt(R) where G is temperature gradient and R is cooling rate; Niyama < 1.0 indicates shrinkage risk for steel), and hot spot locations (isolated regions that solidify last without riser access).
2. Prevent gas porosity through melt practice. For aluminum: degas with inert gas (argon or nitrogen) rotary degassing to reduce hydrogen content below 0.10 mL/100g (measure by reduced pressure test or Alscan). For steel: deoxidize with aluminum and/or silicon to reduce oxygen in the melt. For iron: control carbon equivalent and inoculation for proper graphite morphology (nodularity for ductile iron).
3. Prevent hot tears by avoiding casting designs with mechanical restraint during solidification contraction. Hot tears form at temperatures between solidus and the coherency point where the semi-solid material cannot accommodate strain. Fillet all internal corners (minimum fillet radius = section thickness). Avoid abrupt section transitions (taper ratio 3:1 or gentler). Add chills to control the solidification path away from restrained features.
4. Prevent inclusions and oxide films. For aluminum: use ceramic foam filters in the gating system (20-30 ppi for general, 50 ppi for aerospace). For steel: design the pouring basin with a dam and weir, use a submerged entry from the ladle. For all alloys: minimize turbulence in the gating system to prevent entrainment of oxide films (the gate velocity should stay below the critical velocity for the alloy, approximately 0.5 m/s for aluminum to avoid surface oxide entrainment).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
