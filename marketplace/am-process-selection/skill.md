# Am Process Selection

Select the additive manufacturing process based on material requirements, geometric complexity, production volume, and required mechanical properties.

## Inputs

- `part-requirements`: Material type, mechanical property targets, dimensional tolerances, surface finish requirements, and production volume
- `geometry-description`: Part geometry including overhangs, internal channels, thin walls, and unsupported features

## Outputs

- `selected-process`: Chosen AM process (SLM/DMLS, EBM, DED, SLS, binder jetting) with rationale
- `material-feedstock`: Powder or wire specification (alloy, particle size distribution, morphology, recycling limits)

## Process

1. Map material to viable processes. Titanium alloys (Ti-6Al-4V): SLM or EBM (EBM gives lower residual stress due to elevated build temperature, but coarser surface). Nickel superalloys (IN718, IN625): SLM with careful parameter development for crack-free builds. Aluminum (AlSi10Mg, Scalmalloy): SLM. Stainless and tool steels: SLM or binder jetting. Copper alloys: specialized SLM with green laser or EBM. Polymers: SLS for functional parts (PA12, PA11), FDM for prototypes.
2. Evaluate geometric feasibility. SLM/EBM: minimum wall thickness 0.3-0.5mm, minimum feature size 0.1mm, overhang angle limit 45 degrees from horizontal without support. DED: minimum feature size 1-2mm, better for adding material to existing parts. Binder jetting: no overhang limits (self-supporting in powder bed) but lower density (requires sintering or infiltration).
3. Compare properties. SLM/EBM: near-wrought properties after HIP and heat treatment (Ti-6Al-4V: UTS 1000+ MPa, elongation 10+ %). DED: properties depend on deposition rate vs heat input trade-off. Binder jetting + sinter: 95-99% density depending on material system. SLS polymers: 90-95% of injection-molded properties for PA12.
4. Factor production volume. SLM/EBM: economical below 100-1000 parts depending on size (crossover with casting/machining varies). Binder jetting: scales better for volume due to higher build rates. DED: best for low-volume large parts or repair/refurbishment. The cost model must include machine time, powder cost, support removal, post-processing, and inspection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
